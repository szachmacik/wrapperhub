import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Plans (pakiety subskrypcyjne) ────────────────────────────────────────────
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(), // "Free", "Pro", "Business"
  slug: varchar("slug", { length: 32 }).notNull().unique(), // "free", "pro", "business"
  description: text("description"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).default("0").notNull(),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }).default("0").notNull(),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 128 }),
  stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 128 }),
  // Limity miesięczne (null = unlimited)
  monthlyRequestLimit: int("monthlyRequestLimit"), // null = unlimited
  monthlyTokenLimit: int("monthlyTokenLimit"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ─── User Plans (przypisanie użytkownika do pakietu) ──────────────────────────
export const userPlans = mysqlTable("user_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  planId: int("planId").notNull().references(() => plans.id),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "trialing"]).default("active").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = typeof userPlans.$inferInsert;

// ─── Wrappers (definicje narzędzi AI) ─────────────────────────────────────────
export const wrappers = mysqlTable("wrappers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  category: mysqlEnum("category", [
    "chat",
    "image",
    "document",
    "code",
    "audio",
    "video",
    "search",
    "custom",
  ]).default("chat").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(), // "openai", "anthropic", "stability", etc.
  modelId: varchar("modelId", { length: 128 }), // "gpt-4o", "dall-e-3", etc.
  icon: varchar("icon", { length: 64 }).default("bot"), // lucide icon name
  color: varchar("color", { length: 32 }).default("#6366f1"), // accent color
  // Konfiguracja wrappera (parametry modelu, system prompt, etc.)
  config: json("config").$type<Record<string, unknown>>(),
  // Koszty bazowe (ile płacimy dostawcy)
  costPerRequest: decimal("costPerRequest", { precision: 12, scale: 6 }).default("0").notNull(),
  costPer1kTokens: decimal("costPer1kTokens", { precision: 12, scale: 6 }).default("0").notNull(),
  // Marża (mnożnik, np. 1.5 = 50% marży)
  marginMultiplier: decimal("marginMultiplier", { precision: 6, scale: 3 }).default("1.500").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wrapper = typeof wrappers.$inferSelect;
export type InsertWrapper = typeof wrappers.$inferInsert;

// ─── Wrapper Plan Access (które wrappery dostępne w jakim planie) ──────────────
export const wrapperPlanAccess = mysqlTable("wrapper_plan_access", {
  id: int("id").autoincrement().primaryKey(),
  wrapperId: int("wrapperId").notNull().references(() => wrappers.id),
  planId: int("planId").notNull().references(() => plans.id),
  // Opcjonalne nadpisanie limitu per wrapper per plan
  requestLimitOverride: int("requestLimitOverride"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WrapperPlanAccess = typeof wrapperPlanAccess.$inferSelect;
export type InsertWrapperPlanAccess = typeof wrapperPlanAccess.$inferInsert;

// ─── API Keys (klucze API dostawców, zarządzane przez admina) ─────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(), // "openai", "anthropic", etc.
  label: varchar("label", { length: 128 }), // opis klucza
  keyHash: varchar("keyHash", { length: 256 }).notNull(), // zaszyfrowany klucz
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Usage Logs (logi użycia — widoczne dla admina z kosztem i marżą) ─────────
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  wrapperId: int("wrapperId").notNull().references(() => wrappers.id),
  // Dane requestu
  requestType: varchar("requestType", { length: 64 }).notNull(), // "chat", "image", "document"
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  // Koszty (niewidoczne dla klienta)
  baseCostUsd: decimal("baseCostUsd", { precision: 12, scale: 6 }).default("0").notNull(),
  marginUsd: decimal("marginUsd", { precision: 12, scale: 6 }).default("0").notNull(),
  totalChargedUsd: decimal("totalChargedUsd", { precision: 12, scale: 6 }).default("0").notNull(),
  // Status
  status: mysqlEnum("status", ["success", "error", "rate_limited"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

// ─── Conversations (historia rozmów AI Chat) ──────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  wrapperId: int("wrapperId").notNull().references(() => wrappers.id),
  title: varchar("title", { length: 256 }).default("New conversation").notNull(),
  messages: json("messages").$type<Array<{ role: "user" | "assistant" | "system"; content: string; timestamp: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
