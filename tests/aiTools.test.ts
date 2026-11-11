import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  appSettingFindUnique: vi.fn().mockResolvedValue(null),
  usageAggregate: vi.fn().mockResolvedValue({ _sum: { estimatedCostHkd: 0 } }),
  usageCount: vi.fn().mockResolvedValue(0),
  usageCreate: vi.fn().mockResolvedValue({}),
  productFindFirst: vi.fn(),
  cartItemUpsert: vi.fn(),
  cartItemDeleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: { findUnique: prismaMocks.appSettingFindUnique },
    aIUsageLog: {
      aggregate: prismaMocks.usageAggregate,
      count: prismaMocks.usageCount,
      create: prismaMocks.usageCreate,
    },
    product: {
      findFirst: prismaMocks.productFindFirst,
    },
    cartItem: {
      upsert: prismaMocks.cartItemUpsert,
      deleteMany: prismaMocks.cartItemDeleteMany,
    },
  },
}));

import { executeChefTool, GEMINI_FUNCTION_DECLARATIONS } from "@/lib/ai/tools";
import { executeAIChat } from "@/lib/ai/aiService";

describe("Native Gemini Function Calling & Kitchen Tools (Phase 5)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "AIzaSyTestKeyForTools";
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    fetchMock.mockReset();
    prismaMocks.productFindFirst.mockReset();
    prismaMocks.cartItemUpsert.mockReset();
    prismaMocks.cartItemDeleteMany.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    vi.unstubAllGlobals();
  });

  it("exposes all 7 required tool declarations for Gemini", () => {
    const names = GEMINI_FUNCTION_DECLARATIONS.map((d) => d.name);
    expect(names).toEqual([
      "search_recipes",
      "check_ingredients",
      "calculate_servings",
      "convert_units",
      "add_to_shopping_list",
      "remove_from_shopping_list",
      "search_missing_ingredients",
    ]);
  });

  it("executes convert_units accurately for metric and US systems + temperatures", async () => {
    const res = await executeChefTool(
      "convert_units",
      {
        targetSystem: "metric",
        items: [
          { name: "flour", amount: 2, unit: "cups" },
          { name: "butter", amount: 4, unit: "oz" },
        ],
        temperatureText: "Bake at 350°F for 25 minutes",
      },
      { userId: "u1", conversationId: "c1" }
    );

    expect(res.success).toBe(true);
    expect(res.data?.convertedTemperatureText).toBe("Bake at 175°C for 25 minutes");
    const items = res.data?.convertedItems as any[];
    expect(items[0].convertedUnit).toBe("ml");
    expect(items[0].convertedAmount).toBe(480);
    expect(items[1].convertedUnit).toBe("g");
  });

  it("executes calculate_servings and formats kitchen fractions cleanly", async () => {
    const res = await executeChefTool(
      "calculate_servings",
      {
        currentServings: 2,
        targetServings: 5,
        ingredients: [
          { name: "soy sauce", amount: 1, unit: "tbsp" },
          { name: "chicken breast", amount: 200, unit: "g" },
        ],
      },
      { userId: "u1", conversationId: "c1" }
    );

    expect(res.success).toBe(true);
    expect(res.data?.scaleFactor).toBe(2.5);
    const scaled = res.data?.scaledIngredients as any[];
    expect(scaled[0].formatted).toContain("2½ tbsp soy sauce");
    expect(scaled[1].scaledAmount).toBe(500);
  });

  it("executes check_ingredients and suggests culinary substitutes for missing items", async () => {
    const res = await executeChefTool(
      "check_ingredients",
      {
        availableIngredients: ["chicken", "garlic"],
        requiredIngredients: ["chicken", "garlic", "shaoxing wine", "butter"],
      },
      { userId: "u1", conversationId: "c1" }
    );

    expect(res.success).toBe(true);
    expect(res.data?.canCookNow).toBe(false);
    expect(res.data?.matchedIngredients).toEqual(["chicken", "garlic"]);
    const missing = res.data?.missingIngredients as any[];
    expect(missing).toHaveLength(2);
    expect(missing[0].substitute).toContain("sherry");
  });

  it("enforces authentication and backend userId on add_to_shopping_list and remove_from_shopping_list", async () => {
    // Unauthenticated call must fail
    const unauth = await executeChefTool(
      "add_to_shopping_list",
      { items: [{ name: "Garlic", quantity: 2 }] },
      { userId: undefined, conversationId: "c1" }
    );
    expect(unauth.success).toBe(false);
    expect(unauth.error).toContain("Sign in is required");

    // Authenticated call uses backend context.userId
    prismaMocks.productFindFirst.mockResolvedValueOnce({
      id: "prod_garlic",
      name: "Fresh Garlic Bulb",
      price: 12.0,
    });
    prismaMocks.cartItemUpsert.mockResolvedValueOnce({});

    const authAdd = await executeChefTool(
      "add_to_shopping_list",
      { items: [{ name: "Garlic", quantity: 2 }] },
      { userId: "verified_user_99", conversationId: "c1" }
    );
    expect(authAdd.success).toBe(true);
    expect(prismaMocks.cartItemUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_productId: {
            userId: "verified_user_99",
            productId: "prod_garlic",
          },
        },
      })
    );

    // Remove item
    prismaMocks.cartItemDeleteMany.mockResolvedValueOnce({ count: 1 });
    const authRemove = await executeChefTool(
      "remove_from_shopping_list",
      { itemNames: ["Garlic"] },
      { userId: "verified_user_99", conversationId: "c1" }
    );
    expect(authRemove.success).toBe(true);
    expect(prismaMocks.cartItemDeleteMany).toHaveBeenCalled();
  });

  it("executes search_missing_ingredients against store products and falls back to substitutes", async () => {
    prismaMocks.productFindFirst
      .mockResolvedValueOnce({
        id: "p1",
        name: "Premium Oyster Sauce",
        price: 28,
        unit: "bottle",
        store: { name: "City Market" },
      })
      .mockResolvedValueOnce(null);

    const res = await executeChefTool(
      "search_missing_ingredients",
      { ingredients: ["Oyster Sauce", "Buttermilk"] },
      { userId: "u1", conversationId: "c1" }
    );

    expect(res.success).toBe(true);
    const results = res.data?.results as any[];
    expect(results[0].availableInStore).toBe(true);
    expect(results[0].priceHkd).toBe(28);
    expect(results[1].availableInStore).toBe(false);
    expect(results[1].substitute).toContain("lemon juice");
  });

  it("rejects unknown tools and invalid Zod arguments cleanly", async () => {
    const unknown = await executeChefTool("drop_database", {}, { userId: "u1", conversationId: "c1" });
    expect(unknown.success).toBe(false);
    expect(unknown.error).toContain("Unauthorized or unknown tool");

    const invalidArgs = await executeChefTool(
      "calculate_servings",
      { currentServings: -5, targetServings: 0, ingredients: [] },
      { userId: "u1", conversationId: "c1" }
    );
    expect(invalidArgs.success).toBe(false);
    expect(invalidArgs.error).toContain("Invalid tool arguments");
  });

  it("runs multi-turn Gemini function calling loop and returns final answer", async () => {
    // 1st Gemini call returns a functionCall to convert_units
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "convert_units",
                      args: {
                        targetSystem: "metric",
                        items: [{ name: "milk", amount: 1, unit: "cup" }],
                      },
                    },
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 15 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    // 2nd Gemini call receives functionResponse and produces natural text
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "One cup of milk is 240 ml." }],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 65, candidatesTokenCount: 12 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await executeAIChat({
      userId: "user-1",
      conversationId: "convo-fc",
      messages: [{ role: "user", content: "How many ml is 1 cup of milk?" }],
    });

    expect(result.message).toBe("One cup of milk is 240 ml.");
    expect(result.toolCallsExecuted).toEqual(["convert_units"]);
    expect(result.tokensUsed.total).toBe(40 + 15 + 65 + 12);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
