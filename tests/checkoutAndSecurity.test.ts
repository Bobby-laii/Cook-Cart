import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Security & Integrity Regression Suite for:
 *  - POST /api/orders/checkout (price tampering, stock exhaustion, min order, auth)
 *  - GET  /api/orders          (unauthenticated leak, store partner isolation)
 *  - POST /api/ai/chat         (conversation IDOR prevention)
 *  - GET  /api/ai/conversations (single thread history scoped to owner)
 */

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  storeFindUnique: vi.fn(),
  storeFindFirst: vi.fn(),
  productFindMany: vi.fn(),
  productUpdateMany: vi.fn(),
  appSettingFindUnique: vi.fn(),
  orderCreate: vi.fn(),
  orderFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  chatConvoFindUnique: vi.fn(),
  chatConvoFindFirst: vi.fn(),
  chatConvoFindMany: vi.fn(),
  chatConvoUpdate: vi.fn(),
  chatConvoCreate: vi.fn(),
  transaction: vi.fn(),
  processPayment: vi.fn(),
  executeAIChat: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/lib/payments/paymentProvider", () => ({
  paymentProvider: {
    processPayment: mocks.processPayment,
  },
}));

vi.mock("@/lib/ai/aiService", () => ({
  executeAIChat: mocks.executeAIChat,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    store: {
      findUnique: mocks.storeFindUnique,
      findFirst: mocks.storeFindFirst,
    },
    product: {
      findMany: mocks.productFindMany,
      updateMany: mocks.productUpdateMany,
    },
    appSetting: {
      findUnique: mocks.appSettingFindUnique,
    },
    order: {
      create: mocks.orderCreate,
      findMany: mocks.orderFindMany,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
    chatConversation: {
      findUnique: mocks.chatConvoFindUnique,
      findFirst: mocks.chatConvoFindFirst,
      findMany: mocks.chatConvoFindMany,
      update: mocks.chatConvoUpdate,
      create: mocks.chatConvoCreate,
    },
    $transaction: mocks.transaction,
  },
}));

import * as checkoutRoute from "@/app/api/orders/checkout/route";
import * as ordersRoute from "@/app/api/orders/route";
import * as chatRoute from "@/app/api/ai/chat/route";
import * as convosRoute from "@/app/api/ai/conversations/route";

const CUSTOMER = {
  userId: "cust-1",
  email: "cust1@cookcart.test",
  name: "Alice",
  role: "CUSTOMER" as const,
};

const PARTNER_UNBOUND = {
  userId: "partner-unbound",
  email: "partner@cookcart.test",
  name: "Unbound Partner",
  role: "STORE_PARTNER" as const,
};

const STORE = {
  id: "store-hk-1",
  name: "ParkGrocer HK",
  nameZh: "百佳超級市場",
  deliveryFee: 30,
  freeDeliveryThreshold: 350,
  minOrderAmount: 80,
  deliveryAvailable: true,
  pickupAvailable: true,
};

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentSession.mockResolvedValue(null);
  mocks.appSettingFindUnique.mockResolvedValue({ key: "transaction_fee_percent", value: "5.0" });
  mocks.processPayment.mockResolvedValue({
    success: true,
    transactionRef: "MOCK-REF-1",
    provider: "MockPay",
  });
  mocks.transaction.mockImplementation(async (cb: any) =>
    cb({
      product: { updateMany: mocks.productUpdateMany },
      order: { create: mocks.orderCreate },
    })
  );
});

describe("POST /api/orders/checkout — Price & Inventory Integrity", () => {
  it("rejects unauthenticated checkout with 401", async () => {
    const res = await checkoutRoute.POST(
      postJson("http://localhost/api/orders/checkout", {
        storeId: STORE.id,
        items: [{ productId: "prod-1", quantity: 2 }],
        fulfillmentType: "PICKUP",
      })
    );
    expect(res.status).toBe(401);
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it("ignores client-tampered price (0.01) and charges authoritative DB price (50.0)", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.storeFindUnique.mockResolvedValue(STORE);
    mocks.productFindMany.mockResolvedValue([
      {
        id: "prod-wagyu",
        storeId: STORE.id,
        name: "A5 Wagyu Beef",
        nameZh: "A5和牛",
        unit: "pack",
        price: 50.0,
        stock: 10,
      },
    ]);
    mocks.productUpdateMany.mockResolvedValue({ count: 1 });
    mocks.orderCreate.mockImplementation(async ({ data }: any) => ({
      id: "ord-123",
      ...data,
    }));

    const res = await checkoutRoute.POST(
      postJson("http://localhost/api/orders/checkout", {
        storeId: STORE.id,
        fulfillmentType: "PICKUP",
        items: [
          {
            productId: "prod-wagyu",
            name: "Hacked Wagyu",
            price: 0.01, // Tampered price!
            quantity: 2,
          },
        ],
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // 2 * 50.0 = 100.0 subtotal + 5% fee (5.0) = 105.0 total
    expect(body.subtotal).toBe(100.0);
    expect(body.transactionFee).toBe(5.0);
    expect(body.total).toBe(105.0);

    // Verify stock was decremented by 2 inside the transaction
    expect(mocks.productUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "prod-wagyu",
        storeId: STORE.id,
        stock: { gte: 2 },
      },
      data: {
        stock: { decrement: 2 },
      },
    });
  });

  it("rejects checkout with 409 when requested quantity exceeds stock", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.storeFindUnique.mockResolvedValue(STORE);
    mocks.productFindMany.mockResolvedValue([
      {
        id: "prod-1",
        storeId: STORE.id,
        name: "Fresh Milk",
        nameZh: "鮮奶",
        unit: "bottle",
        price: 45.0,
        stock: 2, // Only 2 left
      },
    ]);

    const res = await checkoutRoute.POST(
      postJson("http://localhost/api/orders/checkout", {
        storeId: STORE.id,
        fulfillmentType: "PICKUP",
        items: [{ productId: "prod-1", quantity: 5 }],
      })
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("Insufficient stock");
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it("enforces store minimum order amount (HK$80)", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.storeFindUnique.mockResolvedValue(STORE);
    mocks.productFindMany.mockResolvedValue([
      {
        id: "prod-garlic",
        storeId: STORE.id,
        name: "Garlic",
        nameZh: "蒜頭",
        unit: "pack",
        price: 12.0,
        stock: 50,
      },
    ]);

    const res = await checkoutRoute.POST(
      postJson("http://localhost/api/orders/checkout", {
        storeId: STORE.id,
        fulfillmentType: "PICKUP",
        items: [{ productId: "prod-garlic", quantity: 1 }], // Subtotal HK$12 < HK$80 min
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("minimum order");
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });
});

describe("GET /api/orders — Access Isolation", () => {
  it("rejects anonymous caller with 401 instead of leaking demo customer orders", async () => {
    const res = await ordersRoute.GET();
    expect(res.status).toBe(401);
    expect(mocks.orderFindMany).not.toHaveBeenCalled();
  });

  it("returns empty array for an unbound STORE_PARTNER instead of all platform orders", async () => {
    mocks.getCurrentSession.mockResolvedValue(PARTNER_UNBOUND);
    mocks.storeFindFirst.mockResolvedValue(null);

    const res = await ordersRoute.GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toEqual([]);
    expect(mocks.orderFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/ai/chat & GET /api/ai/conversations — Conversation IDOR Protection", () => {
  it("rejects an anonymous chat with 401 and never calls the AI", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const res = await chatRoute.POST(
      postJson("http://localhost/api/ai/chat", {
        messages: [{ role: "user", content: "What can I cook?" }],
      })
    );

    // Without a user the daily message limit cannot be counted, so the AI must not run.
    expect(res.status).toBe(401);
    expect(mocks.executeAIChat).not.toHaveBeenCalled();
  });

  it("allocates a new conversationId if user tries to overwrite another user's conversation", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.userFindUnique.mockResolvedValue({
      chefName: "Chef Mei",
      chefAvatarUrl: "👩‍🍳",
      chefPersonality: "friendly",
    });
    // Existing conversation belongs to someone else!
    mocks.chatConvoFindUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === "victim_convo_id") {
        return { id: "victim_convo_id", userId: "other-user-999" };
      }
      return null;
    });
    mocks.executeAIChat.mockResolvedValue({
      message: "Hello!",
      tokensUsed: { prompt: 10, completion: 10, total: 20 },
      modelUsed: "test-model",
    });

    const res = await chatRoute.POST(
      postJson("http://localhost/api/ai/chat", {
        conversationId: "victim_convo_id",
        messages: [{ role: "user", content: "Hijack attempt" }],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.conversationId).not.toBe("victim_convo_id");
    expect(mocks.chatConvoUpdate).not.toHaveBeenCalled();
    expect(mocks.chatConvoCreate).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when requesting another user's conversation via GET /api/ai/conversations?id=...", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.chatConvoFindFirst.mockResolvedValue(null);

    const res = await convosRoute.GET(
      new Request("http://localhost/api/ai/conversations?id=victim_convo_id")
    );
    expect(res.status).toBe(404);
  });
});

