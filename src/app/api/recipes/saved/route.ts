import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      // For demo MVP, if unauthenticated, return initial sample recipes
      const sampleRecipes = await prisma.recipe.findMany({ take: 3 });
      return NextResponse.json({
        recipes: sampleRecipes.map((r) => ({
          id: "demo_" + r.id,
          rating: "UP",
          recipe: r,
        })),
      });
    }

    const saved = await prisma.savedRecipe.findMany({
      where: { userId: session.userId },
      include: { recipe: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recipes: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.savedRecipe.deleteMany({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
