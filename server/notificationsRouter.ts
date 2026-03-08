import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  broadcastNotificationToAllUsers,
  getUserApiKeys,
  addUserApiKey,
  deleteUserApiKey,
  getEmbedTokensForUser,
  createEmbedToken,
  deleteEmbedToken,
  getActiveWrappers,
} from "./db";
import { nanoid } from "nanoid";

// ─── Notifications Router ─────────────────────────────────────────────────────
export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserNotifications(ctx.user.id);
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadNotificationCount(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  // Admin: broadcast to all users
  broadcast: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      message: z.string().min(1),
      type: z.enum(["info", "success", "warning", "new_tool"]).default("info"),
      relatedWrapperId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const count = await broadcastNotificationToAllUsers({
        title: input.title,
        message: input.message,
        type: input.type,
        relatedWrapperId: input.relatedWrapperId,
      });
      return { success: true, count };
    }),
});

// ─── BYOK (Bring Your Own Key) Router ────────────────────────────────────────
export const byokRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserApiKeys(ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({
      provider: z.enum(["openai", "anthropic", "google", "mistral"]),
      apiKey: z.string().min(10),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Store key preview (first 7 + last 4 chars) and hash
      const key = input.apiKey.trim();
      const keyPreview = key.length > 11
        ? `${key.slice(0, 7)}...${key.slice(-4)}`
        : `${key.slice(0, 4)}...`;
      // Simple obfuscation — in production use proper encryption
      const keyHash = Buffer.from(key).toString("base64");

      await addUserApiKey({
        userId: ctx.user.id,
        provider: input.provider,
        keyHash,
        keyPreview,
        label: input.label,
      });
      return { success: true, keyPreview };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteUserApiKey(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Embed Tokens Router ──────────────────────────────────────────────────────
export const embedRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getEmbedTokensForUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      wrapperId: z.number(),
      label: z.string().optional(),
      allowedOrigins: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const token = `wh_embed_${nanoid(32)}`;
      await createEmbedToken({
        userId: ctx.user.id,
        wrapperId: input.wrapperId,
        token,
        label: input.label,
        allowedOrigins: input.allowedOrigins,
      });
      return { success: true, token };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteEmbedToken(input.id, ctx.user.id);
      return { success: true };
    }),

  getSnippet: protectedProcedure
    .input(z.object({ token: z.string(), wrapperId: z.number() }))
    .query(async ({ input }) => {
      const baseUrl = process.env.VITE_APP_URL ?? "https://wrapperhub.manus.space";
      const snippet = `<!-- WrapperHub Embed Widget -->
<div id="wrapperhub-widget"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/embed/${input.wrapperId}?token=${input.token}';
    iframe.style.cssText = 'width:100%;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);';
    iframe.allow = 'clipboard-write';
    document.getElementById('wrapperhub-widget').appendChild(iframe);
  })();
</script>`;
      return { snippet };
    }),
});
