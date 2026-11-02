import { NextResponse } from "next/server";
import { storeConnector } from "@/lib/connectors/storeConnector";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredients } = body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of ingredients to compare" },
        { status: 400 }
      );
    }

    const comparison = await storeConnector.compareStoresForShoppingList(ingredients);
    return NextResponse.json({ success: true, stores: comparison });
  } catch (err: any) {
    console.error("Store compare error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
