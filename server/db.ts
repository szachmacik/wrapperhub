import { and, desc, eq, gte, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertConversation,
  InsertPlan,
  InsertUsageLog,
  InsertUser,
  InsertUserPlan,
  InsertWrapper,
  InsertWrapperPlanAccess,
  apiKeys,
  conversations,
  plans,
  usageLogs,
  userPlans,
  users,
  wrapperPlanAccess,
  wrappers,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export async function getPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
}

export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans).orderBy(plans.sortOrder);
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result[0];
}

export async function upsertPlan(plan: InsertPlan & { id?: number }) {
  const db = await getDb();
  if (!db) return;
  if (plan.id) {
    const { id, ...rest } = plan;
    await db.update(plans).set(rest).where(eq(plans.id, id));
  } else {
    await db.insert(plans).values(plan);
  }
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(plans).where(eq(plans.id, id));
}

// ─── User Plans ───────────────────────────────────────────────────────────────
export async function getUserActivePlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ userPlan: userPlans, plan: plans })
    .from(userPlans)
    .innerJoin(plans, eq(userPlans.planId, plans.id))
    .where(and(eq(userPlans.userId, userId), eq(userPlans.status, "active")))
    .limit(1);
  return result[0];
}

export async function assignUserPlan(data: InsertUserPlan) {
  const db = await getDb();
  if (!db) return;
  // Deactivate existing plans
  await db.update(userPlans).set({ status: "cancelled" }).where(eq(userPlans.userId, data.userId!));
  await db.insert(userPlans).values(data);
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────
export async function getActiveWrappers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wrappers).where(eq(wrappers.isActive, true)).orderBy(wrappers.sortOrder);
}

export async function getAllWrappers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wrappers).orderBy(wrappers.sortOrder);
}

export async function getWrapperBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wrappers).where(eq(wrappers.slug, slug)).limit(1);
  return result[0];
}

export async function getWrapperById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wrappers).where(eq(wrappers.id, id)).limit(1);
  return result[0];
}

export async function upsertWrapper(wrapper: InsertWrapper & { id?: number }) {
  const db = await getDb();
  if (!db) return;
  if (wrapper.id) {
    const { id, ...rest } = wrapper;
    await db.update(wrappers).set(rest).where(eq(wrappers.id, id));
  } else {
    await db.insert(wrappers).values(wrapper);
  }
}

export async function deleteWrapper(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(wrappers).where(eq(wrappers.id, id));
}

// ─── Wrapper Plan Access ──────────────────────────────────────────────────────
export async function getWrappersForPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ wrapper: wrappers, access: wrapperPlanAccess })
    .from(wrapperPlanAccess)
    .innerJoin(wrappers, eq(wrapperPlanAccess.wrapperId, wrappers.id))
    .where(eq(wrapperPlanAccess.planId, planId));
}

export async function setWrapperPlanAccess(data: InsertWrapperPlanAccess) {
  const db = await getDb();
  if (!db) return;
  await db.insert(wrapperPlanAccess).values(data);
}

export async function removeWrapperPlanAccess(wrapperId: number, planId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(wrapperPlanAccess).where(
    and(eq(wrapperPlanAccess.wrapperId, wrapperId), eq(wrapperPlanAccess.planId, planId))
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────
export async function getActiveApiKey(provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.provider, provider), eq(apiKeys.isActive, true)))
    .limit(1);
  if (result[0]) {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, result[0].id));
  }
  return result[0];
}

export async function getAllApiKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function upsertApiKey(data: { provider: string; label?: string; keyHash: string; id?: number }) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(apiKeys).set({ provider: data.provider, label: data.label, keyHash: data.keyHash }).where(eq(apiKeys.id, data.id));
  } else {
    await db.insert(apiKeys).values({ provider: data.provider, label: data.label, keyHash: data.keyHash });
  }
}

export async function deleteApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export async function logUsage(data: InsertUsageLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageLogs).values(data);
}

export async function getUserUsageLogs(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ log: usageLogs, wrapper: wrappers })
    .from(usageLogs)
    .innerJoin(wrappers, eq(usageLogs.wrapperId, wrappers.id))
    .where(eq(usageLogs.userId, userId))
    .orderBy(desc(usageLogs.createdAt))
    .limit(limit);
}

export async function getAdminUsageStats(days = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [totals] = await db
    .select({
      totalRequests: sql<number>`COUNT(*)`,
      totalBaseCost: sum(usageLogs.baseCostUsd),
      totalMargin: sum(usageLogs.marginUsd),
      totalRevenue: sum(usageLogs.totalChargedUsd),
      totalTokens: sql<number>`SUM(${usageLogs.inputTokens} + ${usageLogs.outputTokens})`,
    })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, since));
  return totals;
}

export async function getUsageByWrapper(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      wrapperId: usageLogs.wrapperId,
      wrapperName: wrappers.name,
      totalRequests: sql<number>`COUNT(*)`,
      totalRevenue: sum(usageLogs.totalChargedUsd),
      totalMargin: sum(usageLogs.marginUsd),
    })
    .from(usageLogs)
    .innerJoin(wrappers, eq(usageLogs.wrapperId, wrappers.id))
    .where(gte(usageLogs.createdAt, since))
    .groupBy(usageLogs.wrapperId, wrappers.name)
    .orderBy(desc(sql`COUNT(*)`));
}

export async function getAllUsageLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ log: usageLogs, wrapper: wrappers, user: users })
    .from(usageLogs)
    .innerJoin(wrappers, eq(usageLogs.wrapperId, wrappers.id))
    .innerJoin(users, eq(usageLogs.userId, users.id))
    .orderBy(desc(usageLogs.createdAt))
    .limit(limit);
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ conv: conversations, wrapper: wrappers })
    .from(conversations)
    .innerJoin(wrappers, eq(conversations.wrapperId, wrappers.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return result[0];
}

export async function upsertConversation(data: InsertConversation & { id?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  if (data.id) {
    await db.update(conversations).set({ messages: data.messages, title: data.title, updatedAt: new Date() }).where(eq(conversations.id, data.id));
    return data.id;
  } else {
    const result = await db.insert(conversations).values(data);
    return (result as unknown as { insertId: number }).insertId;
  }
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

// ─── Seed default data ────────────────────────────────────────────────────────
export async function seedDefaultData() {
  const db = await getDb();
  if (!db) return;

  // Seed default plans
  const existingPlans = await db.select().from(plans).limit(1);
  if (existingPlans.length === 0) {
    await db.insert(plans).values([
      { name: "Free", slug: "free", description: "Get started with basic AI tools", priceMonthly: "0", priceYearly: "0", monthlyRequestLimit: 50, monthlyTokenLimit: 100000, sortOrder: 0 },
      { name: "Pro", slug: "pro", description: "For power users and professionals", priceMonthly: "29", priceYearly: "290", monthlyRequestLimit: 1000, monthlyTokenLimit: 2000000, sortOrder: 1 },
      { name: "Business", slug: "business", description: "Unlimited access for teams", priceMonthly: "99", priceYearly: "990", monthlyRequestLimit: null, monthlyTokenLimit: null, sortOrder: 2 },
    ]);
  }

  // Seed default wrappers
  const existingWrappers = await db.select().from(wrappers).limit(1);
  if (existingWrappers.length === 0) {
    await db.insert(wrappers).values([
      { name: "AI Chat", slug: "ai-chat", description: "Powerful conversational AI powered by GPT-4o", category: "chat", provider: "openai", modelId: "gpt-4o", icon: "message-square", color: "#6366f1", costPer1kTokens: "0.005", marginMultiplier: "2.000", isFeatured: true, sortOrder: 0 },
      { name: "Image Generator", slug: "image-gen", description: "Create stunning images from text descriptions", category: "image", provider: "openai", modelId: "dall-e-3", icon: "image", color: "#ec4899", costPerRequest: "0.040", marginMultiplier: "2.500", isFeatured: true, sortOrder: 1 },
      { name: "Document Analyzer", slug: "doc-analyzer", description: "Extract insights from PDFs and documents", category: "document", provider: "openai", modelId: "gpt-4o", icon: "file-text", color: "#10b981", costPer1kTokens: "0.010", marginMultiplier: "2.000", isFeatured: true, sortOrder: 2 },
      { name: "Code Assistant", slug: "code-assistant", description: "Write, review and debug code with AI", category: "code", provider: "openai", modelId: "gpt-4o", icon: "code-2", color: "#f59e0b", costPer1kTokens: "0.005", marginMultiplier: "2.000", sortOrder: 3 },
    ]);

    // Assign all wrappers to all plans
    const allPlans = await db.select().from(plans);
    const allWrappers = await db.select().from(wrappers);
    for (const plan of allPlans) {
      for (const wrapper of allWrappers) {
        // Free plan only gets chat and code
        if (plan.slug === "free" && !["ai-chat", "code-assistant"].includes(wrapper.slug)) continue;
        await db.insert(wrapperPlanAccess).values({ wrapperId: wrapper.id, planId: plan.id });
      }
    }
  }
}
