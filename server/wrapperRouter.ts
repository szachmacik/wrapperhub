import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  deleteWrapper,
  getAllWrappers,
  getActiveWrappers,
  getWrapperById,
  getWrapperBySlug,
  getWrappersForPlan,
  getUserActivePlan,
  logUsage,
  getActiveApiKey,
  upsertWrapper,
  getUserConversations,
  getConversationById,
  upsertConversation,
  deleteConversation,
  getMonthlyUsageCount,
} from "./db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Rate limit helper ────────────────────────────────────────────────────────
async function checkRateLimit(userId: number): Promise<void> {
  const userPlan = await getUserActivePlan(userId);
  const limit = userPlan?.plan?.monthlyRequestLimit ?? 50; // Free plan default
  if (limit === null) return; // Unlimited (Business)
  const used = await getMonthlyUsageCount(userId);
  if (used >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Monthly request limit reached (${used}/${limit}). Please upgrade your plan.`,
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getApiKeyForProvider(provider: string): Promise<string> {
  // First check DB-stored keys
  const dbKey = await getActiveApiKey(provider);
  if (dbKey) return dbKey.keyHash;
  // Fallback to env
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey) return envKey;
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `No API key configured for provider: ${provider}` });
}

function calculateCosts(wrapper: { costPerRequest: string; costPer1kTokens: string; marginMultiplier: string }, tokens: number) {
  const baseCost = parseFloat(wrapper.costPerRequest) + (tokens / 1000) * parseFloat(wrapper.costPer1kTokens);
  const totalCharged = baseCost * parseFloat(wrapper.marginMultiplier);
  const margin = totalCharged - baseCost;
  return { baseCostUsd: baseCost.toFixed(6), marginUsd: margin.toFixed(6), totalChargedUsd: totalCharged.toFixed(6) };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const wrapperRouter = router({
  // Public: list active wrappers
  list: publicProcedure.query(async () => {
    return getActiveWrappers();
  }),
  // Public: get wrapper by slug
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return getWrapperBySlug(input.slug);
  }),

  // Authenticated: list wrappers available for user's plan
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    const userPlan = await getUserActivePlan(ctx.user.id);
    if (!userPlan) {
      // Free plan by default
      const all = await getActiveWrappers();
      return all.filter((w) => ["ai-chat", "code-assistant"].includes(w.slug));
    }
    const planWrappers = await getWrappersForPlan(userPlan.plan.id);
    return planWrappers.map((pw) => pw.wrapper).filter((w) => w.isActive);
  }),

  // ─── AI Chat ──────────────────────────────────────────────────────────────
  chat: protectedProcedure
    .input(z.object({
      wrapperSlug: z.string(),
      messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string(), timestamp: z.string().optional() })),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
       await checkRateLimit(ctx.user.id);
      const wrapper = await getWrapperBySlug(input.wrapperSlug);
      if (!wrapper || !wrapper.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Wrapper not found" });
      if (wrapper.category !== "chat" && wrapper.category !== "code") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This wrapper does not support chat" });
      }
      const apiKey = await getApiKeyForProvider(wrapper.provider);
      const startTime = Date.now();

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: wrapper.modelId || "gpt-4o",
            messages: input.messages,
            max_tokens: 2048,
            temperature: 0.7,
            ...(wrapper.config as object || {}),
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${err}`);
        }

        const data = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };

        const assistantMessage = data.choices[0]?.message?.content || "";
        const totalTokens = data.usage?.total_tokens || 0;
        const costs = calculateCosts(wrapper, totalTokens);

        // Log usage
        await logUsage({
          userId: ctx.user.id,
          wrapperId: wrapper.id,
          requestType: "chat",
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          baseCostUsd: costs.baseCostUsd,
          marginUsd: costs.marginUsd,
          totalChargedUsd: costs.totalChargedUsd,
          status: "success",
          durationMs: Date.now() - startTime,
        });

        // Save/update conversation
        const allMessages = [...input.messages.map(m => ({ ...m, timestamp: m.timestamp || new Date().toISOString() })), { role: "assistant" as const, content: assistantMessage, timestamp: new Date().toISOString() }];
        const title = input.messages[0]?.content?.slice(0, 60) || "New conversation";
        const convId = await upsertConversation({
          id: input.conversationId,
          userId: ctx.user.id,
          wrapperId: wrapper.id,
          title,
          messages: allMessages,
        });

        return { message: assistantMessage, conversationId: convId, usage: { tokens: totalTokens } };
      } catch (error) {
        await logUsage({
          userId: ctx.user.id,
          wrapperId: wrapper.id,
          requestType: "chat",
          inputTokens: 0,
          outputTokens: 0,
          baseCostUsd: "0",
          marginUsd: "0",
          totalChargedUsd: "0",
          status: "error",
          errorMessage: String(error),
          durationMs: Date.now() - startTime,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI request failed. Please try again." });
      }
    }),

  // ─── Image Generation ─────────────────────────────────────────────────────
  generateImage: protectedProcedure
    .input(z.object({
      wrapperSlug: z.string(),
      prompt: z.string().min(1).max(1000),
      size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).default("1024x1024"),
      quality: z.enum(["standard", "hd"]).default("standard"),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.user.id);
      const wrapper = await getWrapperBySlug(input.wrapperSlug);
      if (!wrapper || !wrapper.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Wrapper not found" });
      if (wrapper.category !== "image") throw new TRPCError({ code: "BAD_REQUEST", message: "This wrapper does not support image generation" });

      const apiKey = await getApiKeyForProvider(wrapper.provider);
      const startTime = Date.now();

      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: wrapper.modelId || "dall-e-3",
            prompt: input.prompt,
            n: 1,
            size: input.size,
            quality: input.quality,
            response_format: "url",
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${err}`);
        }

        const data = await response.json() as { data: Array<{ url: string; revised_prompt: string }> };
        const imageUrl = data.data[0]?.url;
        const revisedPrompt = data.data[0]?.revised_prompt;

        const costs = calculateCosts(wrapper, 0); // image cost is per-request
        await logUsage({
          userId: ctx.user.id,
          wrapperId: wrapper.id,
          requestType: "image",
          inputTokens: 0,
          outputTokens: 0,
          baseCostUsd: costs.baseCostUsd,
          marginUsd: costs.marginUsd,
          totalChargedUsd: costs.totalChargedUsd,
          status: "success",
          durationMs: Date.now() - startTime,
        });

        return { imageUrl, revisedPrompt };
      } catch (error) {
        await logUsage({
          userId: ctx.user.id, wrapperId: wrapper.id, requestType: "image",
          inputTokens: 0, outputTokens: 0, baseCostUsd: "0", marginUsd: "0", totalChargedUsd: "0",
          status: "error", errorMessage: String(error), durationMs: Date.now() - startTime,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed. Please try again." });
      }
    }),

  // ─── Document Analysis ────────────────────────────────────────────────────
  analyzeDocument: protectedProcedure
    .input(z.object({
      wrapperSlug: z.string(),
      content: z.string().max(50000), // text content of document
      question: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkRateLimit(ctx.user.id);
      const wrapper = await getWrapperBySlug(input.wrapperSlug);
      if (!wrapper || !wrapper.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Wrapper not found" });
      if (wrapper.category !== "document") throw new TRPCError({ code: "BAD_REQUEST", message: "This wrapper does not support document analysis" });

      const apiKey = await getApiKeyForProvider(wrapper.provider);
      const startTime = Date.now();

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: wrapper.modelId || "gpt-4o",
            messages: [
              { role: "system", content: "You are a document analysis assistant. Analyze the provided document content and answer questions about it accurately and concisely." },
              { role: "user", content: `Document content:\n\n${input.content}\n\n---\n\nQuestion: ${input.question}` },
            ],
            max_tokens: 2048,
          }),
        });

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

        const data = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };

        const answer = data.choices[0]?.message?.content || "";
        const totalTokens = data.usage?.total_tokens || 0;
        const costs = calculateCosts(wrapper, totalTokens);

        await logUsage({
          userId: ctx.user.id, wrapperId: wrapper.id, requestType: "document",
          inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0,
          baseCostUsd: costs.baseCostUsd, marginUsd: costs.marginUsd, totalChargedUsd: costs.totalChargedUsd,
          status: "success", durationMs: Date.now() - startTime,
        });

        return { answer, usage: { tokens: totalTokens } };
      } catch (error) {
        await logUsage({
          userId: ctx.user.id, wrapperId: wrapper.id, requestType: "document",
          inputTokens: 0, outputTokens: 0, baseCostUsd: "0", marginUsd: "0", totalChargedUsd: "0",
          status: "error", errorMessage: String(error), durationMs: Date.now() - startTime,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Document analysis failed. Please try again." });
      }
    }),

  // ─── Conversations ────────────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserConversations(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return getConversationById(input.id, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await deleteConversation(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Admin CRUD ───────────────────────────────────────────────────────────
  admin: router({
    list: adminProcedure.query(async () => getAllWrappers()),
    get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => getWrapperById(input.id)),
    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["chat", "image", "document", "code", "audio", "video", "search", "custom"]),
        provider: z.string().min(1),
        modelId: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        costPerRequest: z.string().optional(),
        costPer1kTokens: z.string().optional(),
        marginMultiplier: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertWrapper(input as Parameters<typeof upsertWrapper>[0]);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteWrapper(input.id);
      return { success: true };
    }),
  }),
});
