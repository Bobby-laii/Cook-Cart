import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Route-level authorization regression tests.
 *
 * These import the real route handlers and drive them through the real
 * `requireRole` helper. Only the session source and the database are mocked, so
 * a regression that removes an auth check — or narrows it — fails here rather
 * than passing silently.
 *
 * Coverage targets the three endpoints that were previously open:
 *   - GET/POST /api/admin/settings   (was: empty authorization `if` block)
 *   - GET      /api/admin/reports    (was: no session check whatsoever)
 *   - GET/PATCH /api/partner/products (was: no auth on PATCH, silent store fallback)
 * Plus /api/orders/[id], which leaked delivery addresses to anonymous callers.
 */

// `vi.mock` is hoisted above all imports, so the fns it closes over must be
// created inside `vi.hoisted` — otherwise the factory runs before the
// declarations and throws "Cannot access ... before initialization".
const db = vi.hoisted(() => ({
    storeFindFirst: vi.fn(),
    storeFindUnique: vi.fn(),
    productFindMany: vi.fn(),
    productFindUnique: vi.fn(),
    productUpdate: vi.fn(),
    appSettingFindMany: vi.fn(),
    appSettingUpsert: vi.fn(),
    orderFindUnique: vi.fn(),
    orderFindMany: vi.fn(),
    aIUsageLogFindMany: vi.fn(),
    aIUsageLogAggregate: vi.fn(),
    savedRecipeGroupBy: vi.fn(),
    recipeFindMany: vi.fn(),
    chatConversationGroupBy: vi.fn(),
    getCurrentSession: vi.fn(),
}));

const {
    storeFindFirst,
    storeFindUnique,
    productFindMany,
    productFindUnique,
    productUpdate,
    appSettingFindMany,
    appSettingUpsert,
    orderFindUnique,
    orderFindMany,
    aIUsageLogFindMany,
    aIUsageLogAggregate,
    savedRecipeGroupBy,
    recipeFindMany,
    chatConversationGroupBy,
    getCurrentSession,
} = db;

vi.mock("@/lib/prisma", () => ({
    prisma: {
        store: { findFirst: db.storeFindFirst, findUnique: db.storeFindUnique },
        product: {
            findMany: db.productFindMany,
            findUnique: db.productFindUnique,
            update: db.productUpdate,
        },
        appSetting: { findMany: db.appSettingFindMany, upsert: db.appSettingUpsert },
        order: { findUnique: db.orderFindUnique, findMany: db.orderFindMany },
        aIUsageLog: {
            findMany: db.aIUsageLogFindMany,
            aggregate: db.aIUsageLogAggregate,
        },
        savedRecipe: { groupBy: db.savedRecipeGroupBy },
        recipe: { findMany: db.recipeFindMany },
        chatConversation: { groupBy: db.chatConversationGroupBy },
    },
}));

vi.mock("@/lib/auth", () => ({ getCurrentSession: db.getCurrentSession }));

import * as adminSettings from "@/app/api/admin/settings/route";
import * as adminReports from "@/app/api/admin/reports/route";
import * as partnerProducts from "@/app/api/partner/products/route";
import * as orderById from "@/app/api/orders/[id]/route";

const ADMIN = {
    userId: "user-admin",
    email: "admin@cookcart.test",
    name: "Admin",
    role: "ADMIN" as const,
};

const CUSTOMER = {
    userId: "user-customer",
    email: "customer@cookcart.test",
    name: "Customer",
    role: "CUSTOMER" as const,
};

const PARTNER = {
    userId: "user-partner",
    email: "partner@cookcart.test",
    name: "Partner",
    role: "STORE_PARTNER" as const,
    storeId: "store-own",
};

function jsonRequest(url: string, body: unknown, method = "PATCH"): Request {
    return new Request(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    getCurrentSession.mockResolvedValue(null);
});

describe("/api/admin/settings", () => {
    it("rejects anonymous GET with 401 and never reads settings", async () => {
        const res = await adminSettings.GET();
        expect(res.status).toBe(401);
        expect(appSettingFindMany).not.toHaveBeenCalled();
    });

    it("rejects a CUSTOMER GET with 403", async () => {
        getCurrentSession.mockResolvedValue(CUSTOMER);
        const res = await adminSettings.GET();
        expect(res.status).toBe(403);
        expect(appSettingFindMany).not.toHaveBeenCalled();
    });

    it("rejects an anonymous POST that tries to change the transaction fee", async () => {
        const res = await adminSettings.POST(
            jsonRequest("http://localhost/api/admin/settings", {
                transaction_fee_percent: 0,
            }, "POST")
        );
        expect(res.status).toBe(401);
        // The critical assertion: the write never happened.
        expect(appSettingUpsert).not.toHaveBeenCalled();
    });

    it("rejects a CUSTOMER POST with 403 and performs no upsert", async () => {
        getCurrentSession.mockResolvedValue(CUSTOMER);
        const res = await adminSettings.POST(
            jsonRequest("http://localhost/api/admin/settings", {
                transaction_fee_percent: 0,
            }, "POST")
        );
        expect(res.status).toBe(403);
        expect(appSettingUpsert).not.toHaveBeenCalled();
    });

    it("allows ADMIN to persist an allowed key", async () => {
        getCurrentSession.mockResolvedValue(ADMIN);
        appSettingUpsert.mockResolvedValue({ key: "default_delivery_fee", value: "45" });

        const res = await adminSettings.POST(
            jsonRequest("http://localhost/api/admin/settings", {
                default_delivery_fee: 45,
            }, "POST")
        );

        expect(res.status).toBe(200);
        expect(appSettingUpsert).toHaveBeenCalledTimes(1);
        const arg = appSettingUpsert.mock.calls[0][0];
        expect(arg.where).toEqual({ key: "default_delivery_fee" });
        expect(arg.create).toEqual({ key: "default_delivery_fee", value: "45" });
    });

    it("allows ADMIN but rejects an out-of-range fee value with 400", async () => {
        getCurrentSession.mockResolvedValue(ADMIN);
        const res = await adminSettings.POST(
            jsonRequest("http://localhost/api/admin/settings", {
                transaction_fee_percent: 99,
            }, "POST")
        );
        expect(res.status).toBe(400);
        expect(appSettingUpsert).not.toHaveBeenCalled();
    });
});

describe("/api/admin/reports", () => {
    it("rejects anonymous access with 401 and returns no customer data", async () => {
        const res = await adminReports.GET();
        expect(res.status).toBe(401);
        expect(orderFindMany).not.toHaveBeenCalled();
        expect(aIUsageLogFindMany).not.toHaveBeenCalled();
    });

    it("rejects a CUSTOMER with 403", async () => {
        getCurrentSession.mockResolvedValue(CUSTOMER);
        const res = await adminReports.GET();
        expect(res.status).toBe(403);
        expect(orderFindMany).not.toHaveBeenCalled();
    });

    it("returns masked emails to an ADMIN", async () => {
        getCurrentSession.mockResolvedValue(ADMIN);
        orderFindMany.mockResolvedValue([]);
        aIUsageLogFindMany.mockResolvedValue([
            {
                id: "log-1",
                tokensTotal: 100,
                estimatedCostHkd: 0.5,
                createdAt: new Date(),
                user: { email: "alice@example.com", name: "Alice" },
            },
        ]);
        aIUsageLogAggregate.mockResolvedValue({
            _sum: { tokensTotal: 100, estimatedCostHkd: 0.5 },
            _count: { _all: 1 },
        });
        savedRecipeGroupBy.mockResolvedValue([]);
        recipeFindMany.mockResolvedValue([]);
        chatConversationGroupBy.mockResolvedValue([]);

        const res = await adminReports.GET();
        expect(res.status).toBe(200);

        const body = await res.json();
        // maskEmail keeps the first two characters and stars the remainder of the
        // local part: "alice" -> "al***".
        expect(body.aiLogs[0].user.email).toBe("al***@example.com");
        // Full address must never be serialised to the client.
        expect(JSON.stringify(body)).not.toContain("alice@example.com");
    });
});

describe("/api/partner/products", () => {
    it("rejects anonymous GET with 401 and never enumerates products", async () => {
        const res = await partnerProducts.GET();
        expect(res.status).toBe(401);
        expect(productFindMany).not.toHaveBeenCalled();
    });

    it("rejects anonymous PATCH — the original hole — without touching the DB", async () => {
        const res = await partnerProducts.PATCH(
            jsonRequest("http://localhost/api/partner/products", {
                productId: "prod-1",
                price: 0.01,
            })
        );
        expect(res.status).toBe(401);
        expect(productUpdate).not.toHaveBeenCalled();
    });

    it("rejects a CUSTOMER PATCH with 403", async () => {
        getCurrentSession.mockResolvedValue(CUSTOMER);
        const res = await partnerProducts.PATCH(
            jsonRequest("http://localhost/api/partner/products", {
                productId: "prod-1",
                price: 0.01,
            })
        );
        expect(res.status).toBe(403);
        expect(productUpdate).not.toHaveBeenCalled();
    });

    it("forbids a partner from editing another store's product", async () => {
        getCurrentSession.mockResolvedValue(PARTNER);
        productFindUnique.mockResolvedValue({ id: "prod-other", storeId: "store-other" });
        storeFindFirst.mockResolvedValue({ id: "store-own" });

        const res = await partnerProducts.PATCH(
            jsonRequest("http://localhost/api/partner/products", {
                productId: "prod-other",
                price: 0.01,
            })
        );

        expect(res.status).toBe(403);
        expect(productUpdate).not.toHaveBeenCalled();
    });

    it("allows a partner to edit their own product", async () => {
        getCurrentSession.mockResolvedValue(PARTNER);
        productFindUnique.mockResolvedValue({ id: "prod-own", storeId: "store-own" });
        storeFindFirst.mockResolvedValue({ id: "store-own" });
        productUpdate.mockResolvedValue({ id: "prod-own", price: 42, stock: 7 });

        const res = await partnerProducts.PATCH(
            jsonRequest("http://localhost/api/partner/products", {
                productId: "prod-own",
                price: 42,
            })
        );

        expect(res.status).toBe(200);
        expect(productUpdate).toHaveBeenCalledTimes(1);
        expect(productUpdate.mock.calls[0][0].where).toEqual({ id: "prod-own" });
    });

    it("rejects a payload with neither price nor stock", async () => {
        getCurrentSession.mockResolvedValue(PARTNER);
        const res = await partnerProducts.PATCH(
            jsonRequest("http://localhost/api/partner/products", { productId: "prod-own" })
        );
        expect(res.status).toBe(400);
        expect(productUpdate).not.toHaveBeenCalled();
    });
});

describe("/api/orders/[id]", () => {
    it("rejects anonymous access with 401", async () => {
        const res = await orderById.GET(new Request("http://localhost/api/orders/o-1"), {
            params: { id: "o-1" },
        });
        expect(res.status).toBe(401);
        expect(orderFindUnique).not.toHaveBeenCalled();
    });

    it("returns 404 (not 403) for another customer's order so IDs cannot be probed", async () => {
        getCurrentSession.mockResolvedValue({ ...CUSTOMER, userId: "someone-else" });
        orderFindUnique.mockResolvedValue({
            id: "o-1",
            userId: "user-customer",
            storeId: "store-1",
            items: [],
            store: {},
            notifications: [],
        });

        const res = await orderById.GET(new Request("http://localhost/api/orders/o-1"), {
            params: { id: "o-1" },
        });

        expect(res.status).toBe(404);
        expect((await res.json()).error).toBe("Order not found");
    });

    it("allows the owner to read their own order", async () => {
        getCurrentSession.mockResolvedValue(CUSTOMER);
        orderFindUnique.mockResolvedValue({
            id: "o-1",
            userId: "user-customer",
            storeId: "store-1",
            items: [],
            store: {},
            notifications: [],
        });

        const res = await orderById.GET(new Request("http://localhost/api/orders/o-1"), {
            params: { id: "o-1" },
        });

        expect(res.status).toBe(200);
    });
});
