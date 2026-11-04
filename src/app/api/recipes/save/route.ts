import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSourceTip, parseSourceTip } from "@/lib/recipes/savedRecipe";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      cuisine,
      cookTimeMinutes,
      difficulty,
      servings,
      description,
      ingredients,
      extraIngredients,
      instructions,
      imageUrl,
      tips,
      sourceUrl,
      sourceName,
    } = body;

    const recipeTitle = typeof title === "string" && title.trim() ? title.trim() : "Custom AI Recipe";
    // Attribution: an explicit source wins, otherwise whatever the client wrote in tips.
    const tipsText =
      typeof sourceUrl === "string" && /^https?:\/\//i.test(sourceUrl)
        ? formatSourceTip(typeof sourceName === "string" ? sourceName : undefined, sourceUrl)
        : typeof tips === "string" && tips.length > 0
          ? tips
          : null;
    const recipeSourceUrl = parseSourceTip(tipsText).sourceUrl;

    // Saving the same dish twice returns the copy the user already has instead of
    // adding a duplicate row: same title, and the same source when this save has one.
    const alreadySaved = await prisma.savedRecipe.findMany({
      where: { userId: session.userId, recipe: { title: recipeTitle } },
      select: { recipeId: true, recipe: { select: { tips: true } } },
      orderBy: { createdAt: "asc" },
    });
    const duplicate = alreadySaved.find(
      (s) => !recipeSourceUrl || parseSourceTip(s.recipe.tips).sourceUrl === recipeSourceUrl
    );
    if (duplicate) {
      return NextResponse.json({ success: true, recipeId: duplicate.recipeId });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: recipeTitle,
        // Legacy translation columns (still NOT NULL in the schema); the app is English only.
        titleZh: "",
        cuisine: cuisine || "Home cooking",
        // 0 means "not known" (menu recipes have no cook time); never invent one.
        cookTimeMinutes: typeof cookTimeMinutes === "number" && cookTimeMinutes > 0 ? Math.round(cookTimeMinutes) : 0,
        difficulty: difficulty || "Easy",
        servings: servings || 2,
        description: description || "",
        descriptionZh: "",
        ingredients: JSON.stringify(ingredients || []),
        extraIngredients: JSON.stringify(extraIngredients || []),
        instructions: JSON.stringify(instructions || []),
        // Live recipes record their source here (the schema has no dedicated
        // provenance column), so a saved copy keeps the attribution the recipe
        // API's terms ask for instead of silently losing it on save.
        tips: tipsText,
        // Store the resolved photo so the saved-recipes grid does not have to
        // re-query a provider on every page view.
        imageUrl: typeof imageUrl === "string" && imageUrl.length > 0 ? imageUrl : null,
        isAIRecommended: true,
      },
    });

    // Link to user's saved recipes
    await prisma.savedRecipe.upsert({
      where: {
        userId_recipeId: {
          userId: session.userId,
          recipeId: recipe.id,
        },
      },
      update: {},
      create: {
        userId: session.userId,
        recipeId: recipe.id,
        rating: "NONE",
      },
    });

    return NextResponse.json({ success: true, recipeId: recipe.id });
  } catch (err: any) {
    console.error("Save recipe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
