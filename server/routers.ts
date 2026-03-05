import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { wrapperRouter } from "./wrapperRouter";
import { plansRouter } from "./plansRouter";
import { stripeRouter } from "./stripeRouter";
import { seedDefaultData } from "./db";
import {
  rateLimitRouter,
  ratingsRouter,
  favoritesRouter,
  tagsRouter,
  changelogRouter,
  settingsRouter,
} from "./featuresRouter";

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
  rateLimit: rateLimitRouter,
  ratings: ratingsRouter,
  favorites: favoritesRouter,
  tags: tagsRouter,
  changelog: changelogRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
