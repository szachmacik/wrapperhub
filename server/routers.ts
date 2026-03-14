import { TRPCError } from "@trpc/server";
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
import { notificationsRouter, byokRouter, embedRouter } from "./notificationsRouter";

// Seed default data on startup
seedDefaultData().catch(console.error);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME,
    exchangeSupabaseToken: publicProcedure
      .input(z.object({ accessToken: z.string(), refreshToken: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { verifySupabaseToken, isEmailAllowed, isEmailAdmin } = await import("./_core/supabaseAuth");
        const { SignJWT } = await import("jose");
        const payload = await verifySupabaseToken(input.accessToken);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Nieprawidłowy token Supabase" });
        const email = payload.email ?? "";
        if (!isEmailAllowed(email)) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu — email nie jest na liście dozwolonych" });
        const isAdmin = isEmailAdmin(email);
        const openId = `supabase:${payload.sub}`;
        const db = getDb();
        await db.upsertUser({
          openId,
          name: payload.user_metadata?.full_name ?? payload.user_metadata?.name ?? email.split("@")[0] ?? null,
          email,
          loginMethod: "supabase_otp",
          lastSignedIn: new Date(),
          ...(isAdmin ? { role: "admin" } : {}),
        });
        const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "ofshore-secret-2026");
        const sessionToken = await new SignJWT({ openId, email, role: isAdmin ? "admin" : "user" })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("365d")
          .sign(secret);
        ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));
        return { success: true, role: isAdmin ? "admin" : "user" };
      }), { ...cookieOptions, maxAge: -1 });
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
  notifications: notificationsRouter,
  byok: byokRouter,
  embed: embedRouter,
});

export type AppRouter = typeof appRouter;
