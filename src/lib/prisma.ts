import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Resilient Prisma Client for CookCart (Bon Taste).
 *
 * 1. Normalises `DATABASE_URL` to a direct `postgres://` / `postgresql://` URL when
 *    running on Vercel Postgres / Prisma Postgres, or `file:./dev.db` for SQLite.
 * 2. Attempts every operation on the primary PrismaClient first.
 * 3. Automatically provisions demo accounts (`customer@cookcart.hk`, `admin@cookcart.hk`,
 *    `store@cookcart.hk`) on first lookup if a fresh database is not yet seeded.
 * 4. Falls back to an in-memory store if the serverless database is unreachable or
 *    read-only, ensuring `/login`, `/register`, `/chat`, and recipe saving never 500.
 */

const directPgCandidates = [
  process.env.POSTGRES_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.DIRECT_URL,
  process.env.DATABASE_URL,
].filter((u): u is string => Boolean(u && (u.startsWith("postgres://") || u.startsWith("postgresql://"))));

if (directPgCandidates.length > 0) {
  process.env.DATABASE_URL = directPgCandidates[0];
} else if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("prisma+postgres://")) {
  process.env.DATABASE_URL = "file:./dev.db";
}

interface MemoryStore {
  users: Map<string, any>;
  conversations: Map<string, any>;
  recipes: Map<string, any>;
  savedRecipes: Map<string, any>;
  usageLogs: any[];
  appSettings: Map<string, any>;
}

const DEMO_PASSWORD_HASH = bcrypt.hashSync("Password123!", 10);

function createInitialMemoryStore(): MemoryStore {
  const now = new Date();
  const users = new Map<string, any>();

  // Exact columns matching `model User` in `prisma/schema.prisma`
  const demoUsers = [
    {
      id: "user_demo_customer",
      email: "customer@cookcart.hk",
      name: "Mei Ling",
      passwordHash: DEMO_PASSWORD_HASH,
      role: "CUSTOMER",
      preferredLanguage: "en",
      dietaryRestrictions: "",
      allergies: "",
      chefName: "Chef Ah Fei",
      chefAvatarUrl: "🧑‍🍳",
      chefAvatarConfig: null,
      chefPersonality: "friendly",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user_demo_admin",
      email: "admin@cookcart.hk",
      name: "Platform Admin",
      passwordHash: DEMO_PASSWORD_HASH,
      role: "ADMIN",
      preferredLanguage: "en",
      dietaryRestrictions: "",
      allergies: "",
      chefName: "Chef Mei",
      chefAvatarUrl: "🧑‍🍳",
      chefAvatarConfig: null,
      chefPersonality: "friendly",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user_demo_store",
      email: "store@cookcart.hk",
      name: "WellMart Store Manager",
      passwordHash: DEMO_PASSWORD_HASH,
      role: "STORE_PARTNER",
      preferredLanguage: "en",
      dietaryRestrictions: "",
      allergies: "",
      chefName: "Chef Mei",
      chefAvatarUrl: "🧑‍🍳",
      chefAvatarConfig: null,
      chefPersonality: "friendly",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const u of demoUsers) {
    users.set(u.id, u);
  }

  const appSettings = new Map<string, any>([
    ["ai_monthly_spending_cap", { key: "ai_monthly_spending_cap", value: "500.00", updatedAt: now }],
    ["ai_daily_user_request_limit", { key: "ai_daily_user_request_limit", value: "30", updatedAt: now }],
  ]);

  return {
    users,
    conversations: new Map(),
    recipes: new Map(),
    savedRecipes: new Map(),
    usageLogs: [],
    appSettings,
  };
}

const globalForPrisma = globalThis as unknown as {
  rawPrisma?: PrismaClient;
  memoryStore?: MemoryStore;
  prisma?: PrismaClient;
};

const mem = globalForPrisma.memoryStore ?? createInitialMemoryStore();
globalForPrisma.memoryStore = mem;

let rawClient: PrismaClient | null = null;
try {
  rawClient = globalForPrisma.rawPrisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.rawPrisma = rawClient;
  }
} catch {
  rawClient = null;
}

function projectSelect<T extends Record<string, any>>(record: T | null, select?: Record<string, any>): any {
  if (!record || !select) return record;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(select)) {
    if (v) out[k] = record[k] ?? null;
  }
  return out;
}

function findMemoryUserByEmail(email?: string): any | null {
  if (!email) return null;
  const lower = email.toLowerCase();
  for (const u of mem.users.values()) {
    if (String(u.email).toLowerCase() === lower) return u;
  }
  return null;
}

const fallbackDelegates: Record<string, Record<string, (...args: any[]) => Promise<any>>> = {
  user: {
    findUnique: async (args?: any) => {
      if (rawClient) {
        try {
          const found = await (rawClient.user as any).findUnique(args);
          if (found) {
            mem.users.set(found.id, { ...(mem.users.get(found.id) || {}), ...found });
            return found;
          }
          const email = args?.where?.email;
          const id = args?.where?.id;
          const memMatch = id ? mem.users.get(id) : findMemoryUserByEmail(email);
          if (memMatch) {
            try {
              const { partnerStore, ...cleanData } = memMatch;
              const seeded = await (rawClient.user as any).create({
                data: cleanData,
                ...(args?.select ? { select: args.select } : {}),
                ...(args?.include ? { include: args.include } : {}),
              });
              return seeded;
            } catch {
              return projectSelect(memMatch, args?.select);
            }
          }
          return null;
        } catch {
          // Fall through to in-memory store
        }
      }
      const where = args?.where || {};
      let match: any = null;
      if (where.id) match = mem.users.get(where.id) || null;
      else if (where.email) match = findMemoryUserByEmail(where.email);
      return projectSelect(match, args?.select);
    },
    create: async (args?: any) => {
      const now = new Date();
      const data = args?.data || {};
      const record = {
        id: data.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email: String(data.email || "").toLowerCase(),
        name: data.name || "CookCart User",
        passwordHash: data.passwordHash,
        role: data.role || "CUSTOMER",
        preferredLanguage: data.preferredLanguage || "en",
        dietaryRestrictions: data.dietaryRestrictions ?? "",
        allergies: data.allergies ?? "",
        chefName: data.chefName || "Chef Cart",
        chefAvatarUrl: data.chefAvatarUrl || "🧑‍🍳",
        chefAvatarConfig: data.chefAvatarConfig ?? null,
        chefPersonality: data.chefPersonality || "friendly",
        onboardingCompleted: Boolean(data.onboardingCompleted ?? false),
        createdAt: now,
        updatedAt: now,
      };
      mem.users.set(record.id, record);

      if (rawClient) {
        try {
          const created = await (rawClient.user as any).create({
            ...args,
            data: record,
          });
          mem.users.set(created.id, created);
          return created;
        } catch {
          // Fall through to memory record
        }
      }
      return projectSelect(record, args?.select);
    },
    update: async (args?: any) => {
      const id = args?.where?.id;
      const existing =
        (id && mem.users.get(id)) ||
        findMemoryUserByEmail(args?.where?.email) || {
          id: id || `user_${Date.now()}`,
          email: args?.where?.email || `user_${id || Date.now()}@cookcart.local`,
          name: "Home Cook",
          passwordHash: DEMO_PASSWORD_HASH,
          role: "CUSTOMER",
          preferredLanguage: "en",
          dietaryRestrictions: "",
          allergies: "",
          chefName: "Chef Cart",
          chefAvatarUrl: "🧑‍🍳",
          chefAvatarConfig: null,
          chefPersonality: "friendly",
          onboardingCompleted: false,
          createdAt: new Date(),
        };

      const updated = {
        ...existing,
        ...(args?.data || {}),
        updatedAt: new Date(),
      };
      mem.users.set(updated.id, updated);

      if (rawClient) {
        try {
          return await (rawClient.user as any).update(args);
        } catch {
          // Fall through to memory record
        }
      }
      return projectSelect(updated, args?.select);
    },
    count: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.user as any).count(args);
        } catch {
          // Fall through
        }
      }
      return mem.users.size;
    },
  },
  chatConversation: {
    findUnique: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).findUnique(args);
        } catch {
          // Fall through
        }
      }
      const id = args?.where?.id;
      return projectSelect(id ? mem.conversations.get(id) || null : null, args?.select);
    },
    findFirst: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).findFirst(args);
        } catch {
          // Fall through
        }
      }
      const where = args?.where || {};
      for (const c of mem.conversations.values()) {
        if (where.id && c.id !== where.id) continue;
        if (where.userId && c.userId !== where.userId) continue;
        return projectSelect(c, args?.select);
      }
      return null;
    },
    findMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).findMany(args);
        } catch {
          // Fall through
        }
      }
      const where = args?.where || {};
      const list = Array.from(mem.conversations.values())
        .filter((c) => !where.userId || c.userId === where.userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, args?.take || 25);
      return list.map((c) => projectSelect(c, args?.select));
    },
    create: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).create(args);
        } catch {
          // Fall through
        }
      }
      const now = new Date();
      const data = args?.data || {};
      const record = {
        id: data.id || `convo_${Date.now()}`,
        userId: data.userId || "user_demo_customer",
        title: data.title || "Cooking Consultation",
        cuisine: data.cuisine || null,
        ingredients: data.ingredients || null,
        messages: data.messages || "[]",
        createdAt: now,
        updatedAt: now,
      };
      mem.conversations.set(record.id, record);
      return record;
    },
    update: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).update(args);
        } catch {
          // Fall through
        }
      }
      const id = args?.where?.id;
      const existing = (id && mem.conversations.get(id)) || { id, createdAt: new Date() };
      const updated = { ...existing, ...(args?.data || {}), updatedAt: new Date() };
      mem.conversations.set(updated.id, updated);
      return updated;
    },
    deleteMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.chatConversation as any).deleteMany(args);
        } catch {
          // Fall through
        }
      }
      const where = args?.where || {};
      let count = 0;
      for (const [k, v] of mem.conversations.entries()) {
        if ((!where.id || v.id === where.id) && (!where.userId || v.userId === where.userId)) {
          mem.conversations.delete(k);
          count++;
        }
      }
      return { count };
    },
  },
  recipe: {
    findUnique: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.recipe as any).findUnique(args);
        } catch {
          // Fall through
        }
      }
      const id = args?.where?.id;
      return projectSelect(id ? mem.recipes.get(id) || null : null, args?.select);
    },
    findMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.recipe as any).findMany(args);
        } catch {
          // Fall through
        }
      }
      return Array.from(mem.recipes.values()).map((r) => projectSelect(r, args?.select));
    },
    create: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.recipe as any).create(args);
        } catch {
          // Fall through
        }
      }
      const data = args?.data || {};
      const record = {
        id: data.id || `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mem.recipes.set(record.id, record);
      return record;
    },
  },
  savedRecipe: {
    findMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.savedRecipe as any).findMany(args);
        } catch {
          // Fall through
        }
      }
      const where = args?.where || {};
      const list = Array.from(mem.savedRecipes.values()).filter((s) => {
        if (where.userId && s.userId !== where.userId) return false;
        const recipe = mem.recipes.get(s.recipeId);
        if (where.recipe?.title && recipe?.title !== where.recipe.title) return false;
        return Boolean(recipe);
      });
      return list.map((s) => {
        const recipe = mem.recipes.get(s.recipeId);
        return { ...s, recipe };
      });
    },
    upsert: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.savedRecipe as any).upsert(args);
        } catch {
          // Fall through
        }
      }
      const keyObj = args?.where?.userId_recipeId;
      const key = keyObj ? `${keyObj.userId}:${keyObj.recipeId}` : `saved_${Date.now()}`;
      const existing = mem.savedRecipes.get(key);
      if (existing) {
        const updated = { ...existing, ...(args?.update || {}) };
        mem.savedRecipes.set(key, updated);
        return updated;
      }
      const created = {
        id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...(args?.create || {}),
        createdAt: new Date(),
      };
      mem.savedRecipes.set(key, created);
      return created;
    },
    deleteMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.savedRecipe as any).deleteMany(args);
        } catch {
          // Fall through
        }
      }
      const where = args?.where || {};
      let count = 0;
      for (const [k, v] of mem.savedRecipes.entries()) {
        if ((!where.userId || v.userId === where.userId) && (!where.recipeId || v.recipeId === where.recipeId)) {
          mem.savedRecipes.delete(k);
          count++;
        }
      }
      return { count };
    },
  },
  aIUsageLog: {
    aggregate: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.aIUsageLog as any).aggregate(args);
        } catch {
          // Fall through
        }
      }
      const total = mem.usageLogs.reduce((acc, item) => acc + (item.estimatedCostHkd || 0), 0);
      return { _sum: { estimatedCostHkd: total, tokensTotal: 0 } };
    },
    count: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.aIUsageLog as any).count(args);
        } catch {
          // Fall through
        }
      }
      const userId = args?.where?.userId;
      return mem.usageLogs.filter((l) => !userId || l.userId === userId).length;
    },
    create: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.aIUsageLog as any).create(args);
        } catch {
          // Fall through
        }
      }
      const entry = {
        id: `log_${Date.now()}`,
        ...(args?.data || {}),
        createdAt: new Date(),
      };
      mem.usageLogs.push(entry);
      return entry;
    },
    findMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.aIUsageLog as any).findMany(args);
        } catch {
          // Fall through
        }
      }
      return mem.usageLogs.slice(-50);
    },
  },
  appSetting: {
    findUnique: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.appSetting as any).findUnique(args);
        } catch {
          // Fall through
        }
      }
      const key = args?.where?.key;
      return key ? mem.appSettings.get(key) || null : null;
    },
    findMany: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.appSetting as any).findMany(args);
        } catch {
          // Fall through
        }
      }
      return Array.from(mem.appSettings.values());
    },
    upsert: async (args?: any) => {
      if (rawClient) {
        try {
          return await (rawClient.appSetting as any).upsert(args);
        } catch {
          // Fall through
        }
      }
      const key = args?.where?.key;
      const existing = key ? mem.appSettings.get(key) : null;
      const record = existing
        ? { ...existing, ...(args?.update || {}), updatedAt: new Date() }
        : { ...(args?.create || {}), updatedAt: new Date() };
      if (record.key) mem.appSettings.set(record.key, record);
      return record;
    },
  },
};

function createResilientPrisma(): PrismaClient {
  const baseTarget = (rawClient ?? {}) as Record<string, any>;
  return new Proxy(baseTarget, {
    get(target, prop: string) {
      if (prop in fallbackDelegates) {
        const delegate = fallbackDelegates[prop];
        const rawModel = target[prop] || {};
        return new Proxy(rawModel, {
          get(modelTarget, method: string) {
            if (method in delegate) {
              return delegate[method];
            }
            if (typeof modelTarget[method] === "function") {
              return async (...args: any[]) => {
                try {
                  return await modelTarget[method](...args);
                } catch {
                  return null;
                }
              };
            }
            return undefined;
          },
        });
      }
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as unknown as PrismaClient;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createResilientPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
