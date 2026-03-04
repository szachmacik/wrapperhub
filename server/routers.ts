import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { wrapperRouter } from "./wrapperRouter";
import { plansRouter } from "./plansRouter";
import { stripeRouter } from "./stripeRouter";
import { seedDefaultData } from "./db";

// Seed default data on startup
seedDefaultData().catch(console.error);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  wrappers: wrapperRouter,
  plans: plansRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
