/**
 * Server-side validated AI tools (Function Calling)
 * Requirement 5: Tool calling so the AI can call app functions.
 */

import { prisma } from "@/lib/prisma";

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Tool: search_products
 * Searches products available in Hong Kong mock grocers
 */
export async function toolSearchProducts(query: string, storeId?: string): Promise<ToolCallResult> {
  try {
    const q = query.trim().toLowerCase();
    const products = await prisma.product.findMany({
      where: {
        AND: [
          storeId ? { storeId } : {},
          {
            OR: [
              { name: { contains: q } },
              { nameZh: { contains: q } },
              { category: { contains: q } },
            ],
          },
        ],
      },
      include: {
        store: { select: { name: true, nameZh: true, slug: true } },
      },
      take: 8,
    });

    return {
      toolName: "search_products",
      success: true,
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        nameZh: p.nameZh,
        priceHkd: p.price,
        unit: p.unit,
        store: p.store.name,
        stock: p.stock,
      })),
    };
  } catch (error: any) {
    return {
      toolName: "search_products",
      success: false,
      data: null,
      message: error.message,
    };
  }
}

/**
 * Tool: get_store_prices
 * Compares total cost of a list of ingredient names across the 4 stores
 */
export async function toolGetStorePrices(ingredientNames: string[]): Promise<ToolCallResult> {
  try {
    const stores = await prisma.store.findMany({
      include: {
        products: true,
      },
    });

    const comparison = stores.map((store) => {
      let matchedItems = 0;
      let estimatedSubtotal = 0;
      const matchedProducts: any[] = [];

      for (const ing of ingredientNames) {
        const cleanIng = ing.trim().toLowerCase();
        const found = store.products.find(
          (p) =>
            p.name.toLowerCase().includes(cleanIng) ||
            p.nameZh.toLowerCase().includes(cleanIng)
        );
        if (found) {
          matchedItems++;
          estimatedSubtotal += found.price;
          matchedProducts.push({ ingredient: ing, product: found.name, price: found.price });
        }
      }

      const deliveryFee =
        estimatedSubtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee;

      return {
        storeId: store.id,
        storeName: store.name,
        storeNameZh: store.nameZh,
        matchedCount: `${matchedItems} / ${ingredientNames.length}`,
        estimatedSubtotal: Math.round(estimatedSubtotal * 10) / 10,
        deliveryFee,
        freeDeliveryThreshold: store.freeDeliveryThreshold,
        estimatedTotal: Math.round((estimatedSubtotal + deliveryFee) * 10) / 10,
        pickupAvailable: store.pickupAvailable,
        matchedProducts,
      };
    });

    return {
      toolName: "get_store_prices",
      success: true,
      data: comparison,
    };
  } catch (error: any) {
    return {
      toolName: "get_store_prices",
      success: false,
      data: null,
      message: error.message,
    };
  }
}
