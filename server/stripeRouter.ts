import Stripe from "stripe";
import { z } from "zod";
import { assignUserPlan, getAllPlans, getUserByOpenId, getAllUsers } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
  return new Stripe(key);
}

export const stripeRouter = router({
  // Create checkout session for plan upgrade
  createCheckout: protectedProcedure
    .input(z.object({ planId: z.number(), billingPeriod: z.enum(["monthly", "yearly"]).default("monthly") }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const plans = await getAllPlans();
      const plan = plans.find((p) => p.id === input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      if (plan.slug === "free") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot checkout free plan" });

      const priceId = input.billingPeriod === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

      const origin = ctx.req.headers.origin || "http://localhost:5000";

      if (priceId) {
        // Use existing Stripe price ID
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          customer_email: ctx.user.email ?? undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_id: plan.id.toString(),
            plan_slug: plan.slug,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          allow_promotion_codes: true,
          success_url: `${origin}/dashboard/billing?success=1`,
          cancel_url: `${origin}/dashboard/billing?cancelled=1`,
        });
        return { url: session.url };
      } else {
        // Create price on-the-fly
        const amount = input.billingPeriod === "yearly"
          ? parseFloat(plan.priceYearly) * 100
          : parseFloat(plan.priceMonthly) * 100;

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: { name: `WrapperHub ${plan.name}`, description: plan.description ?? undefined },
              unit_amount: Math.round(amount),
              recurring: { interval: input.billingPeriod === "yearly" ? "year" : "month" },
            },
            quantity: 1,
          }],
          customer_email: ctx.user.email ?? undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_id: plan.id.toString(),
            plan_slug: plan.slug,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          allow_promotion_codes: true,
          success_url: `${origin}/dashboard/billing?success=1`,
          cancel_url: `${origin}/dashboard/billing?cancelled=1`,
        });
        return { url: session.url };
      }
    }),
});

// ─── Webhook handler (Express route, not tRPC) ────────────────────────────────
export async function handleStripeWebhook(req: import("express").Request, res: import("express").Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).send("Missing signature or webhook secret");
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.user_id ?? "0");
        const planId = parseInt(session.metadata?.plan_id ?? "0");
        if (userId && planId) {
          await assignUserPlan({
            userId,
            planId,
            status: "active",
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          });
          console.log(`[Stripe Webhook] Plan ${planId} assigned to user ${userId}`);
          // Notify admin about new payment
          const customerName = session.metadata?.customer_name || "Unknown";
          const customerEmail = session.metadata?.customer_email || "N/A";
          const planSlug = session.metadata?.plan_slug || "unknown";
          const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : "N/A";
          notifyOwner({
            title: `💰 New Payment — ${planSlug} plan`,
            content: `**Customer:** ${customerName}\n**Email:** ${customerEmail}\n**Plan:** ${planSlug}\n**Amount:** ${amount}\n**Subscription ID:** ${session.subscription || "N/A"}\n**Time:** ${new Date().toISOString()}`,
          }).catch(() => {});
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription cancelled: ${sub.id}`);
        // Could downgrade user to free plan here
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
  }

  res.json({ received: true });
}
