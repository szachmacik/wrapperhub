/**
 * Streaming chat endpoint via SSE (Server-Sent Events)
 * Registered as a raw Express route (not tRPC) because tRPC doesn't support streaming.
 * Route: POST /api/stream/chat
 */
import type { Request, Response } from "express";
import { getWrapperBySlug, getUserActivePlan, getWrappersForPlan, logUsage, getActiveApiKey, upsertConversation } from "./db";
import { sdk } from "./_core/sdk";

async function getApiKeyForProvider(provider: string): Promise<string> {
  const dbKey = await getActiveApiKey(provider);
  if (dbKey) return dbKey.keyHash;
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey) return envKey;
  // Fallback to built-in forge API
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (forgeKey) return forgeKey;
  throw new Error(`No API key configured for provider: ${provider}`);
}

function calculateCosts(wrapper: { costPerRequest: string; costPer1kTokens: string; marginMultiplier: string }, tokens: number) {
  const baseCost = parseFloat(wrapper.costPerRequest) + (tokens / 1000) * parseFloat(wrapper.costPer1kTokens);
  const totalCharged = baseCost * parseFloat(wrapper.marginMultiplier);
  const margin = totalCharged - baseCost;
  return { baseCostUsd: baseCost.toFixed(6), marginUsd: margin.toFixed(6), totalChargedUsd: totalCharged.toFixed(6) };
}

export async function handleStreamChat(req: Request, res: Response) {
  // Auth
  const token = req.cookies?.["manus-session"];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
  try {
    user = await sdk.authenticateRequest(req);
    if (!user) throw new Error("Invalid token");
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { wrapperSlug, messages, conversationId } = req.body as {
    wrapperSlug: string;
    messages: Array<{ role: string; content: string }>;
    conversationId?: number;
  };

  if (!wrapperSlug || !messages?.length) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const wrapper = await getWrapperBySlug(wrapperSlug);
  if (!wrapper || !wrapper.isActive) {
    res.status(404).json({ error: "Wrapper not found" });
    return;
  }

  // Check plan access
  const userPlan = await getUserActivePlan(user.id);
  if (userPlan) {
    const planWrappers = await getWrappersForPlan(userPlan.plan.id);
    const hasAccess = planWrappers.some((pw) => pw.wrapper.id === wrapper.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Upgrade your plan to access this tool" });
      return;
    }
  } else {
    // Free plan: only basic wrappers
    const freeWrappers = ["ai-chat", "code-assistant"];
    if (!freeWrappers.includes(wrapper.slug)) {
      res.status(403).json({ error: "Upgrade your plan to access this tool" });
      return;
    }
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const startTime = Date.now();
  let fullContent = "";
  let totalTokens = 0;

  try {
    const apiKey = await getApiKeyForProvider(wrapper.provider);

    // Use built-in forge API if available, otherwise OpenAI
    const baseUrl = process.env.BUILT_IN_FORGE_API_URL
      ? `${process.env.BUILT_IN_FORGE_API_URL}/v1`
      : "https://api.openai.com/v1";

    const systemPrompt = (wrapper.config as Record<string, string> | null)?.systemPrompt || "You are a helpful AI assistant.";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: wrapper.modelId || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: `API error: ${response.status}` })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true, totalTokens })}\n\n`);
          break;
        }
        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
            usage?: { total_tokens: number };
          };
          const delta = parsed.choices[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
          if (parsed.usage?.total_tokens) {
            totalTokens = parsed.usage.total_tokens;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    // Estimate tokens if not provided
    if (!totalTokens) {
      totalTokens = Math.ceil((messages.reduce((a, m) => a + m.content.length, 0) + fullContent.length) / 4);
    }

    const costs = calculateCosts(wrapper, totalTokens);

    // Log usage
    await logUsage({
      userId: user.id,
      wrapperId: wrapper.id,
      requestType: "chat",
      inputTokens: Math.ceil(messages.reduce((a, m) => a + m.content.length, 0) / 4),
      outputTokens: Math.ceil(fullContent.length / 4),
      baseCostUsd: costs.baseCostUsd,
      marginUsd: costs.marginUsd,
      totalChargedUsd: costs.totalChargedUsd,
      status: "success",
      durationMs: Date.now() - startTime,
    });

    // Save conversation
    const allMessages = [
      ...messages.map((m) => ({ ...m, role: m.role as "user" | "assistant" | "system", timestamp: new Date().toISOString() })),
      { role: "assistant" as const, content: fullContent, timestamp: new Date().toISOString() },
    ];
    const title = messages.find((m) => m.role === "user")?.content?.slice(0, 60) || "New conversation";
    const newConvId = await upsertConversation({
      id: conversationId,
      userId: user.id,
      wrapperId: wrapper.id,
      title,
      messages: allMessages,
    });

    res.write(`data: ${JSON.stringify({ done: true, conversationId: newConvId, totalTokens })}\n\n`);
  } catch (error) {
    console.error("[Stream Chat] Error:", error);
    await logUsage({
      userId: user.id,
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
    res.write(`data: ${JSON.stringify({ error: "AI request failed. Please try again." })}\n\n`);
  }

  res.end();
}
