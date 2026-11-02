import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getPartnerStoreId } from "@/lib/apiAuth";
import { z } from "zod";

/**
 * Store Partner inventory endpoints.
 *
 * Previously:
 *  - GET silently fell back to "the first store in the database" when
 *    unauthenticated, leaking inventory; and
 *  - PATCH had no authorization at all, so any anonymous caller could rewrite
 *    any product's price and stock by guessing a productId.
 *
 * Now both require STORE_PARTNER (or ADMIN), and a partner may only read or
 * mutate products belonging to the store they are bound to.
 */

const patchSchema = z.object({
  productId: z.string().min(1),
  price: z.coerce.number().positive().max(100000).optional(),
  stock: z.coerce.number().int().min(0).max(1000000).optional(),
});

export async function GET() {
  const auth = await requireRole(["STORE_PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const storeId =
      auth.session.role === "ADMIN"
        ? await getPartnerStoreId(auth.session).then(
          (ownStore) => ownStore ?? null
        )
        : await getPartnerStoreId(auth.session);

    if (!storeId) {
      return NextResponse.json(
        { error: "No store is assigned to this account" },
        { status: 403 }
      );
    }

    const [store, products] = await Promise.all([
      prisma.store.findUnique({ where: { id: storeId } }),
      prisma.product.findMany({
        where: { storeId },
        orderBy: { category: "asc" },
      }),
    ]);

    return NextResponse.json({ store, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["STORE_PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid product update payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, price, stock } = parsed.data;

    if (price === undefined && stock === undefined) {
      return NextResponse.json(
        { error: "Provide at least one of price or stock" },
        { status: 400 }
      );
    }

    // Ownership check: the product must belong to this partner's store.
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (auth.session.role !== "ADMIN") {
      const storeId = await getPartnerStoreId(auth.session);
      if (!storeId || existing.storeId !== storeId) {
        return NextResponse.json(
          { error: "Forbidden: this product belongs to another store" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(price !== undefined ? { price } : {}),
        ...(stock !== undefined ? { stock } : {}),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
