import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Saved recipes:
 *  - GET  /api/recipes/saved/:id returns the user's own saved recipe as a dish
 *  - POST /api/recipes/save does not create a second copy of a recipe already saved
 */

const db = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  savedFindUnique: vi.fn(),
  savedFindMany: vi.fn(),
  savedUpsert: vi.fn(),
  recipeCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentSession: db.getCurrentSession }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    savedRecipe: {
      findUnique: db.savedFindUnique,
      findMany: db.savedFindMany,
      upsert: db.savedUpsert,
    },
    recipe: { create: db.recipeCreate },
  },
}));

import * as savedById from "@/app/api/recipes/saved/[id]/route";
import * as saveRoute from "@/app/api/recipes/save/route";
import { formatSourceTip, parseSourceTip, recipeRowToDish } from "@/lib/recipes/savedRecipe";

const USER = { userId: "user-1", email: "a@example.com", name: "A", role: "CUSTOMER" as const };

const ROW = {
  id: "rec_123",
  title: "Shakshuka",
  cuisine: "Tunisian",
  cookTimeMinutes: 30,
  difficulty: "Easy",
  servings: 2,
  description: "Eggs poached in spiced tomato.",
  ingredients: JSON.stringify([
    { name: "Eggs", amount: 4, unit: "" },
    { name: "Tomatoes", amount: 400, unit: "g" },
  ]),
  extraIngredients: JSON.stringify([{ name: "Tomatoes", amount: 400, unit: "g" }]),
  instructions: JSON.stringify([
    { step: 1, title: "Sauce", text: "Simmer the tomatoes.", timerSeconds: 600 },
    { step: 2, title: "Eggs", text: "Crack in the eggs." },
  ]),
  tips: "Recipe source: TheMealDB — https://www.themealdb.com/meal/52963",
  imageUrl: "https://www.themealdb.com/images/shakshuka.jpg",
};

function postJson(body: unknown): Request {
  return new Request("http://localhost/api/recipes/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.getCurrentSession.mockResolvedValue(null);
});

describe("GET /api/recipes/saved/:id", () => {
  const call = (id: string) => savedById.GET(new Request(`http://localhost/api/recipes/saved/${id}`), { params: { id } });

  it("rejects a signed-out caller with 401", async () => {
    const res = await call("rec_123");
    expect(res.status).toBe(401);
    expect(db.savedFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a recipe the user has not saved, looking only at their own saves", async () => {
    db.getCurrentSession.mockResolvedValue(USER);
    db.savedFindUnique.mockResolvedValue(null);
    const res = await call("rec_other");
    expect(res.status).toBe(404);
    expect(db.savedFindUnique.mock.calls[0][0].where).toEqual({
      userId_recipeId: { userId: "user-1", recipeId: "rec_other" },
    });
  });

  it("returns the saved recipe as a dish", async () => {
    db.getCurrentSession.mockResolvedValue(USER);
    db.savedFindUnique.mockResolvedValue({ id: "sr_1", recipe: ROW });
    const res = await call("rec_123");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dish).toMatchObject({
      id: "rec_123",
      title: "Shakshuka",
      cuisine: "Tunisian",
      difficulty: "Easy",
      usedUserIngredients: ["Eggs"],
      extraIngredientsNeeded: [{ name: "Tomatoes", amount: 400, unit: "g" }],
      imageUrl: ROW.imageUrl,
      sourceName: "TheMealDB",
      sourceUrl: "https://www.themealdb.com/meal/52963",
    });
    expect(data.dish.steps).toHaveLength(2);
    expect(data.dish.steps[0]).toMatchObject({ step: 1, title: "Sauce", timerSeconds: 600 });
  });
});

describe("recipeRowToDish", () => {
  it("survives broken JSON columns and an unknown difficulty", () => {
    const dish = recipeRowToDish({ ...ROW, ingredients: "{", extraIngredients: "nope", instructions: "", difficulty: "Wild", tips: null, imageUrl: null });
    expect(dish.extraIngredientsNeeded).toEqual([]);
    expect(dish.usedUserIngredients).toEqual([]);
    expect(dish.steps).toBeUndefined();
    expect(dish.difficulty).toBe("Easy");
    expect(dish.sourceUrl).toBeUndefined();
    expect(dish.imageUrl).toBeUndefined();
  });

  it("round-trips the source line", () => {
    expect(parseSourceTip(formatSourceTip("BBC Good Food", "https://example.com/r"))).toEqual({
      sourceName: "BBC Good Food",
      sourceUrl: "https://example.com/r",
    });
    expect(parseSourceTip("Add a pinch of salt")).toEqual({});
  });
});

describe("POST /api/recipes/save", () => {
  it("rejects a signed-out caller with 401", async () => {
    const res = await saveRoute.POST(postJson({ title: "Shakshuka" }));
    expect(res.status).toBe(401);
  });

  it("returns the existing recipe when the same title is saved again", async () => {
    db.getCurrentSession.mockResolvedValue(USER);
    db.savedFindMany.mockResolvedValue([{ recipeId: "rec_123", recipe: { tips: null } }]);
    const res = await saveRoute.POST(postJson({ title: "Shakshuka" }));
    expect(await res.json()).toEqual({ success: true, recipeId: "rec_123" });
    expect(db.savedFindMany.mock.calls[0][0].where).toEqual({ userId: "user-1", recipe: { title: "Shakshuka" } });
    expect(db.recipeCreate).not.toHaveBeenCalled();
  });

  it("creates a new recipe when the title matches but the source differs", async () => {
    db.getCurrentSession.mockResolvedValue(USER);
    db.savedFindMany.mockResolvedValue([
      { recipeId: "rec_123", recipe: { tips: formatSourceTip("A", "https://a.example/1") } },
    ]);
    db.recipeCreate.mockResolvedValue({ id: "rec_new" });
    const res = await saveRoute.POST(
      postJson({ title: "Shakshuka", tips: formatSourceTip("B", "https://b.example/2") })
    );
    expect(await res.json()).toEqual({ success: true, recipeId: "rec_new" });
    expect(db.recipeCreate).toHaveBeenCalledTimes(1);
    expect(db.savedUpsert).toHaveBeenCalledTimes(1);
  });

  it("matches on source when both saves have the same one", async () => {
    db.getCurrentSession.mockResolvedValue(USER);
    db.savedFindMany.mockResolvedValue([
      { recipeId: "rec_a", recipe: { tips: formatSourceTip("A", "https://a.example/1") } },
      { recipeId: "rec_b", recipe: { tips: formatSourceTip("B", "https://b.example/2") } },
    ]);
    const res = await saveRoute.POST(
      postJson({ title: "Shakshuka", sourceUrl: "https://b.example/2", sourceName: "B" })
    );
    expect(await res.json()).toEqual({ success: true, recipeId: "rec_b" });
    expect(db.recipeCreate).not.toHaveBeenCalled();
  });
});
