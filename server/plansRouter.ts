import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  assignUserPlan,
  deletePlan,
  getAllPlans,
  getAllUsers,
  getAdminUsageStats,
  getAllUsageLogs,
  getPlans,
  getUsageByWrapper,
  getUserActivePlan,
  getUserUsageLogs,
  updateUserRole,
  upsertApiKey,
  getAllApiKeys,
  deleteApiKey,
  upsertPlan,
} from "./db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const plansRouter = router({
  // Public: list active plans for pricing page
  list: publicProcedure.query(async () => getPlans()),

  // Authenticated: get current user's plan
  myPlan: protectedProcedure.query(async ({ ctx }) => {
    return getUserActivePlan(ctx.user.id);
  }),

  // Authenticated: get usage history (no costs shown)
  myUsage: protectedProcedure.query(async ({ ctx }) => {
    const logs = await getUserUsageLogs(ctx.user.id, 100);
    // Strip cost data from client-facing response
    return logs.map(({ log, wrapper }) => ({
      id: log.id,
      wrapperName: wrapper.name,
      wrapperIcon: wrapper.icon,
      requestType: log.requestType,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      status: log.status,
      durationMs: log.durationMs,
      createdAt: log.createdAt,
    }));
  }),

  // Admin: full plan management
  admin: router({
    listPlans: adminProcedure.query(async () => getAllPlans()),

    upsertPlan: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        priceMonthly: z.string(),
        priceYearly: z.string(),
        stripePriceIdMonthly: z.string().optional(),
        stripePriceIdYearly: z.string().optional(),
        monthlyRequestLimit: z.number().nullable().optional(),
        monthlyTokenLimit: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertPlan(input as Parameters<typeof upsertPlan>[0]);
        return { success: true };
      }),

    deletePlan: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePlan(input.id);
        return { success: true };
      }),

    // Users management
    listUsers: adminProcedure.query(async () => getAllUsers()),

    assignPlan: adminProcedure
      .input(z.object({
        userId: z.number(),
        planId: z.number(),
        stripeSubscriptionId: z.string().optional(),
        stripeCustomerId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await assignUserPlan({
          userId: input.userId,
          planId: input.planId,
          status: "active",
          stripeSubscriptionId: input.stripeSubscriptionId,
          stripeCustomerId: input.stripeCustomerId,
        });
        return { success: true };
      }),

    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    // Usage stats
    usageStats: adminProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        const [stats, byWrapper] = await Promise.all([
          getAdminUsageStats(input.days),
          getUsageByWrapper(input.days),
        ]);
        return { stats, byWrapper };
      }),

    usageLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return getAllUsageLogs(input.limit);
      }),

    // API Keys management
    listApiKeys: adminProcedure.query(async () => {
      const keys = await getAllApiKeys();
      // Mask keys for security
      return keys.map((k) => ({
        ...k,
        keyHash: k.keyHash.slice(0, 8) + "..." + k.keyHash.slice(-4),
      }));
    }),

    upsertApiKey: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        provider: z.string().min(1),
        label: z.string().optional(),
        key: z.string().min(1), // raw key, will be stored as-is (in production: encrypt)
      }))
      .mutation(async ({ input }) => {
        await upsertApiKey({ id: input.id, provider: input.provider, label: input.label, keyHash: input.key });
        return { success: true };
      }),

    deleteApiKey: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteApiKey(input.id);
        return { success: true };
      }),
  }),
});
