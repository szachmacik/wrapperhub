// Stripe product/price definitions for WrapperHub plans
// These should match the plans in the database

export const STRIPE_PRODUCTS = {
  pro: {
    name: "WrapperHub Pro",
    description: "1000 requests/month, 2M tokens, all AI tools",
    priceMonthly: 2900, // cents
    priceYearly: 29000, // cents
  },
  business: {
    name: "WrapperHub Business",
    description: "Unlimited requests and tokens, all AI tools, priority support",
    priceMonthly: 9900, // cents
    priceYearly: 99000, // cents
  },
} as const;

export type PlanSlug = keyof typeof STRIPE_PRODUCTS;
