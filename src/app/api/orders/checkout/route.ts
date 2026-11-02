import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { paymentProvider } from "@/lib/payments/paymentProvider";
import { APP_CONFIG } from "@/config/appConfig";
import { z } from "zod";

/**
 * Hardened Checkout Endpoint:
 * 1. Requires valid user authentication (`requireAuth`).
 * 2. Validates request payload with strict Zod schemas (no negative quantities or malformed IDs).
 * 3. Server-Side Price & Stock Verification: Looks up every productId in the DB
 *    belonging to `storeId`, ignoring any client-supplied price or store mismatch.
 * 4. Enforces store `minOrderAmount` before allowing checkout.
 * 5. Wraps stock decrements and order creation in an atomic Prisma `$transaction`.
 */

const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(999),
  // Client may pass display metadata, but price/name are authoritative from DB
  name: z.string().optional(),
  nameZh: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().optional(),
});

const checkoutPayloadSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  items: z.array(checkoutItemSchema).min(1, "Shopping cart cannot be empty").max(100),
  fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  deliveryAddress: z.string().trim().max(500).optional().nullable(),
  deliveryTimeSlot: z.string().trim().max(100).optional().nullable(),
  pickupStoreName: z.string().trim().max(200).optional().nullable(),
  pickupTimeSlot: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = checkoutPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid checkout payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      storeId,
      items,
      fulfillmentType,
      deliveryAddress,
      deliveryTimeSlot,
      pickupStoreName,
      pickupTimeSlot,
      notes,
    } = parsed.data;

    if (fulfillmentType === "DELIVERY" && (!deliveryAddress || deliveryAddress.length < 5)) {
      return NextResponse.json(
        { error: "A valid delivery address is required for home delivery" },
        { status: 400 }
      );
    }

    // 1. Fetch store details
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Selected store not found" }, { status: 404 });
    }

    if (fulfillmentType === "DELIVERY" && !store.deliveryAvailable) {
      return NextResponse.json(
        { error: `${store.name} does not currently offer home delivery` },
        { status: 400 }
      );
    }

    if (fulfillmentType === "PICKUP" && !store.pickupAvailable) {
      return NextResponse.json(
        { error: `${store.name} does not currently offer self-pickup` },
        { status: 400 }
      );
    }

    // 2. Deduplicate items by productId in case client sent duplicate rows
    const mergedQuantities = new Map<string, number>();
    for (const item of items) {
      mergedQuantities.set(
        item.productId,
        (mergedQuantities.get(item.productId) || 0) + item.quantity
      );
    }
    const uniqueProductIds = Array.from(mergedQuantities.keys());

    // 3. Fetch authoritative product records from database for this store
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        storeId: store.id,
      },
    });

    if (dbProducts.length !== uniqueProductIds.length) {
      const foundIds = new Set(dbProducts.map((p) => p.id));
      const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        {
          error: "One or more products were not found in the selected store's catalogue",
          missingProductIds: missingIds,
        },
        { status: 400 }
      );
    }

    // 4. Verify stock & compute authoritative subtotal using DB prices ONLY
    let subtotal = 0;
    const orderItemsData: {
      productId: string;
      productName: string;
      productNameZh: string;
      unit: string;
      price: number;
      quantity: number;
      total: number;
    }[] = [];

    for (const product of dbProducts) {
      const requestedQty = mergedQuantities.get(product.id)!;
      if (product.stock < requestedQty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Requested: ${requestedQty}, Available: ${product.stock}`,
          },
          { status: 409 }
        );
      }

      const lineTotal = Math.round(product.price * requestedQty * 10) / 10;
      subtotal += lineTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productNameZh: product.nameZh,
        unit: product.unit,
        price: product.price,
        quantity: requestedQty,
        total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 10) / 10;

    // 5. Enforce store minimum order amount
    if (subtotal < store.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Order subtotal (HK$${subtotal.toFixed(1)}) is below ${store.name}'s minimum order of HK$${store.minOrderAmount.toFixed(1)}`,
        },
        { status: 400 }
      );
    }

    // 6. Fetch configurable platform fees from AppSettings
    const feeSetting = await prisma.appSetting.findUnique({
      where: { key: "transaction_fee_percent" },
    });
    const feePercent = feeSetting
      ? parseFloat(feeSetting.value)
      : APP_CONFIG.fees.transactionFeePercent;

    // 7. Compute delivery fee & platform transaction fee
    let deliveryFee = 0;
    if (fulfillmentType === "DELIVERY") {
      deliveryFee = subtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee;
    }

    const transactionFee = Math.round(((subtotal * feePercent) / 100) * 10) / 10;
    const total = Math.round((subtotal + deliveryFee + transactionFee) * 10) / 10;

    const orderNumber = `CC-HK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // 8. Process Payment through Abstraction Layer
    const paymentResult = await paymentProvider.processPayment({
      orderNumber,
      amountHkd: total,
      currency: "HKD",
      customerEmail: auth.session.email,
      customerName: auth.session.name,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: "Payment authorization failed" },
        { status: 402 }
      );
    }

    // 9. Atomic Transaction: Decrement inventory stock & create Order
    const order = await prisma.$transaction(async (tx) => {
      for (const line of orderItemsData) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            storeId: store.id,
            stock: { gte: line.quantity },
          },
          data: {
            stock: { decrement: line.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error(`Stock exhausted during checkout for "${line.productName}"`);
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId: auth.session.userId,
          storeId: store.id,
          status: "PLACED",
          fulfillmentType,
          deliveryAddress: fulfillmentType === "DELIVERY" ? deliveryAddress : null,
          deliveryTimeSlot: fulfillmentType === "DELIVERY" ? deliveryTimeSlot : null,
          pickupStoreName:
            fulfillmentType === "PICKUP" ? pickupStoreName || store.name : null,
          pickupTimeSlot: fulfillmentType === "PICKUP" ? pickupTimeSlot : null,
          subtotal,
          deliveryFee,
          transactionFee,
          total,
          isPaid: true,
          paymentRef: paymentResult.transactionRef,
          paymentMethod: paymentResult.provider,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
          notifications: {
            create: {
              status: "PLACED",
              message: `Order #${orderNumber} placed successfully with ${store.name}. Total: HK$${total.toFixed(1)}`,
              messageZh: `訂單 #${orderNumber} 已成功於 ${store.nameZh} 下單。總金額：HK$${total.toFixed(1)}`,
            },
          },
        },
      });
    });

    console.log(
      `[Order Placed Notification Log] Order #${orderNumber} created for store: ${store.name}`
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      transactionFee: order.transactionFee,
      total: order.total,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    const status = err.message?.includes("Stock exhausted") ? 409 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
