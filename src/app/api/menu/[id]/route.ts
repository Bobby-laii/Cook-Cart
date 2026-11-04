import { NextResponse } from "next/server";
import { fetchMenuDish } from "@/lib/recipes/mealdb";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dish = await fetchMenuDish(params.id);
  if (!dish) {
    return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, dish });
}
