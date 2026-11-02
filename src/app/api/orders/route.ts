import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getPartnerStoreId } from "@/lib/apiAuth";

/**
 * Order list endpoint:
 * - Unauthenticated requests are rejected with 401 (never fall back to a demo
 *   account's order history, which leaks personal addresses and order records).
 * - CUSTOMER: only sees orders they placed.
 * - STORE_PARTNER: only sees orders assigned to their bound store (returns [] if
 *   no store is bound, never falling through to `{}`).
 * - ADMIN: sees all platform orders.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { session } = auth;
    let whereClause: Record<string, unknown>;

    if (session.role === "ADMIN") {
      whereClause = {};
    } else if (session.role === "STORE_PARTNER") {
      const storeId = await getPartnerStoreId(session);
      if (!storeId) {
        return NextResponse.json({ orders: [] });
      }
      whereClause = { storeId };
    } else {
      whereClause = { userId: session.userId };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        store: { select: { name: true, nameZh: true, slug: true, address: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
