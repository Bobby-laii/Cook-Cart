import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getPartnerStoreId } from "@/lib/apiAuth";
import { z } from "zod";

/**
 * Order detail is personal data: it includes the delivery address, the full
 * basket, and the customer's notes. Access is therefore limited to:
 *   - the customer who owns the order
 *   - the partner store that must fulfil it
 *   - an admin
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        store: true,
        items: true,
        notifications: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Return 404 rather than 403 for non-owners so order IDs cannot be probed.
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (auth.session.role !== "ADMIN" && order.userId !== auth.session.userId) {
      if (auth.session.role !== "STORE_PARTNER") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const partnerStoreId = await getPartnerStoreId(auth.session);
      if (!partnerStoreId || order.storeId !== partnerStoreId) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const statusUpdateSchema = z.object({
  status: z.enum([
    "PLACED",
    "CONFIRMED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(["STORE_PARTNER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status update payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, note } = parsed.data;

    // A partner may only advance orders belonging to their own store.
    if (auth.session.role !== "ADMIN") {
      const existing = await prisma.order.findUnique({
        where: { id: params.id },
        select: { storeId: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const partnerStoreId = await getPartnerStoreId(auth.session);
      if (!partnerStoreId || existing.storeId !== partnerStoreId) {
        return NextResponse.json(
          { error: "Forbidden: this order belongs to another store" },
          { status: 403 }
        );
      }
    }

    const statusMessages: Record<string, { en: string; zh: string }> = {
      CONFIRMED: {
        en: "Order confirmed by the supermarket. Preparing your ingredients.",
        zh: "超市門市已接單確認，正開始揀選新鮮食材。",
      },
      PREPARING: {
        en: "Groceries are being carefully picked, inspected, and packed.",
        zh: "工作人員正在仔細挑選包裝生鮮及日用百貨。",
      },
      OUT_FOR_DELIVERY: {
        en: "Your groceries are on the way with the courier!",
        zh: "訂單食材已交由專人配送，正在送往您的地址！",
      },
      READY_FOR_PICKUP: {
        en: "Your order is ready for pickup at the store counter.",
        zh: "食材已打包完成，隨時可於指定門市自取服務台領取。",
      },
      COMPLETED: {
        en: "Order successfully delivered/picked up. Thank you for using CookCart!",
        zh: "訂單已順利交付完成，祝您烹飪愉快！",
      },
      CANCELLED: {
        en: "Order has been cancelled.",
        zh: "此訂單已被取消。",
      },
    };

    const msg = statusMessages[status] || {
      en: `Order status changed to ${status}`,
      zh: `訂單狀態已更新為 ${status}`,
    };

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        notifications: {
          create: {
            status,
            message: note ? `${msg.en} (${note})` : msg.en,
            messageZh: note ? `${msg.zh} (${note})` : msg.zh,
          },
        },
      },
      include: {
        notifications: { orderBy: { createdAt: "desc" } },
      },
    });

    console.log(`[Order Status Update Log] Order ${params.id} -> ${status}: ${msg.en}`);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
