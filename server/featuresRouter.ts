import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAverageRating,
  getChangelog,
  createChangelogEntry,
  getFavoritesForUser,
  getMonthlyUsageCount,
  getRatingsForWrapper,
  getTagsForWrapper,
  getUserSettings,
  setTagsForWrapper,
  toggleFavorite,
  upsertRating,
  upsertUserSettings,
  getUserActivePlan,
} from "./db";

// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const rateLimitRouter = router({
  check: protectedProcedure.query(async ({ ctx }) => {
    const userPlanData = await getUserActivePlan(ctx.user.id);
    const monthlyCount = await getMonthlyUsageCount(ctx.user.id);
    const limit = userPlanData?.plan?.monthlyRequestLimit ?? null;
    return {
      used: monthlyCount,
      limit,
      remaining: limit !== null ? Math.max(0, limit - monthlyCount) : null,
      exceeded: limit !== null ? monthlyCount >= limit : false,
      planName: userPlanData?.plan?.name ?? "Free",
    };
  }),
});

// ─── Ratings ─────────────────────────────────────────────────────────────────
export const ratingsRouter = router({
  getForWrapper: publicProcedure
    .input(z.object({ wrapperId: z.number() }))
    .query(async ({ input }) => {
      const [reviews, stats] = await Promise.all([
        getRatingsForWrapper(input.wrapperId),
        getAverageRating(input.wrapperId),
      ]);
      return { reviews, stats };
    }),

  submit: protectedProcedure
    .input(z.object({
      wrapperId: z.number(),
      rating: z.number().min(1).max(5),
      review: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertRating(ctx.user.id, input.wrapperId, input.rating, input.review);
      return { success: true };
    }),
});

// ─── Favorites ────────────────────────────────────────────────────────────────
export const favoritesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await getFavoritesForUser(ctx.user.id);
    return rows.map((r) => r.wrapperId);
  }),

  toggle: protectedProcedure
    .input(z.object({ wrapperId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isFavorited = await toggleFavorite(ctx.user.id, input.wrapperId);
      return { isFavorited };
    }),
});

// ─── Tags ─────────────────────────────────────────────────────────────────────
export const tagsRouter = router({
  getForWrapper: publicProcedure
    .input(z.object({ wrapperId: z.number() }))
    .query(async ({ input }) => {
      return getTagsForWrapper(input.wrapperId);
    }),

  setForWrapper: protectedProcedure
    .input(z.object({
      wrapperId: z.number(),
      tags: z.array(z.string().max(64)).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      await setTagsForWrapper(input.wrapperId, input.tags);
      return { success: true };
    }),
});

// ─── Changelog ────────────────────────────────────────────────────────────────
export const changelogRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }))
    .query(async ({ input }) => {
      return getChangelog(input.limit ?? 20);
    }),

  create: protectedProcedure
    .input(z.object({
      version: z.string().max(32),
      title: z.string().max(256),
      content: z.string(),
      type: z.enum(["feature", "fix", "improvement", "breaking"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      await createChangelogEntry(input);
      return { success: true };
    }),
});

// ─── User Settings ────────────────────────────────────────────────────────────
export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserSettings(ctx.user.id);
  }),

  update: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().max(8).optional(),
      emailNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      defaultWrapperId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertUserSettings(ctx.user.id, input);
      return { success: true };
    }),
});
