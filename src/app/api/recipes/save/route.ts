import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      titleZh,
      cuisine,
      cookTimeMinutes,
      difficulty,
      servings,
      description,
      descriptionZh,
      ingredients,
      extraIngredients,
      instructions,
      imageUrl,
      tips,
    } = body;

    // Create or find existing recipe
    const recipe = await prisma.recipe.create({
      data: {
        title: title || "Custom AI Recipe",
        titleZh: titleZh || title || "自訂 AI 食譜",
        cuisine: cuisine || "Cantonese",
        cookTimeMinutes: cookTimeMinutes || 20,
        difficulty: difficulty || "Easy",
        servings: servings || 2,
        description: description || "",
        descriptionZh: descriptionZh || "",
        ingredients: JSON.stringify(ingredients || []),
        extraIngredients: JSON.stringify(extraIngredients || []),
        instructions: JSON.stringify(instructions || []),
        // Live recipes record their source here (the schema has no dedicated
        // provenance column), so a saved copy keeps the attribution the recipe
        // API's terms ask for instead of silently losing it on save.
        tips: typeof tips === "string" && tips.length > 0 ? tips : null,
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
