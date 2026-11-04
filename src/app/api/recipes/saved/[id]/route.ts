import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recipeRowToDish } from "@/lib/recipes/savedRecipe";

/**
 * GET /api/recipes/saved/:id — one of the signed-in user's saved recipes, as a dish.
 * `id` is the Recipe id (what My recipes links to). Recipes the user hasn't saved are
 * a 404, the same as recipes that don't exist, so ids can't be probed.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Sign in to see your saved recipes" }, { status: 401 });
    }

    const saved = await prisma.savedRecipe.findUnique({
      where: { userId_recipeId: { userId: session.userId, recipeId: params.id } },
      include: { recipe: true },
    });
    if (!saved) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, dish: recipeRowToDish(saved.recipe) });
  } catch (err) {
    console.error("Load saved recipe error:", err);
    return NextResponse.json({ success: false, error: "Could not load this recipe" }, { status: 500 });
  }
}
