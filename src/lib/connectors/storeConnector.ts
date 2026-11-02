/**
 * Store Connector Abstraction Layer
 * Requirement 4.4: Build a "store connector" abstraction layer so real store,
 * price, and delivery APIs can replace mock data later without changing the rest of the app.
 */

import { prisma } from "@/lib/prisma";
import { StoreComparisonResult } from "@/types";

export interface IngredientMatchQuery {
  name: string;
  amount?: number;
  unit?: string;
}

export interface MatchedProductDetail {
  ingredientName: string;
  product: {
    id: string;
    name: string;
    nameZh: string;
    price: number;
    unit: string;
    stock: number;
    imageUrl: string;
  } | null;
  isAvailable: boolean;
  substituteSuggestion?: string;
}

export interface StoreCatalogComparison {
  storeId: string;
  storeName: string;
  storeNameZh: string;
  slug: string;
  address: string;
  logoUrl: string;
  deliveryTimeEstimate: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  itemsAvailableCount: number;
  totalItemsCount: number;
  basketSubtotal: number;
  effectiveDeliveryFee: number;
  totalBasketPrice: number;
  isCheapest: boolean;
  isMostComplete: boolean;
  matches: MatchedProductDetail[];
}

export interface IStoreConnector {
  compareStoresForShoppingList(
    ingredients: IngredientMatchQuery[]
  ): Promise<StoreCatalogComparison[]>;
  searchStoreProducts(storeId: string, query: string): Promise<any[]>;
}

export class MockHongKongStoreConnector implements IStoreConnector {
  /**
   * Fuzzy matches an ingredient against store products using substring / category / keyword matching
   */
  private matchProductInStore(ingredientName: string, products: any[]): any | null {
    const ing = ingredientName.trim().toLowerCase();

    // 1. Direct includes in English name or Chinese name
    let match = products.find(
      (p) =>
        p.name.toLowerCase().includes(ing) ||
        p.nameZh.toLowerCase().includes(ing)
    );
    if (match) return match;

    // 2. Keyword fallback mappings for common kitchen ingredients
    const keywordMap: Record<string, string[]> = {
      chicken: ["chicken", "雞"],
      egg: ["egg", "蛋"],
      tofu: ["tofu", "豆腐"],
      bok: ["bok choy", "pak choi", "白菜"],
      gai: ["gai lan", "broccoli", "芥蘭"],
      choy: ["choy sum", "菜心"],
      broccoli: ["broccoli", "西蘭花"],
      garlic: ["garlic", "蒜"],
      ginger: ["ginger", "薑"],
      onion: ["onion", "洋蔥"],
      pork: ["pork", "豬肉"],
      beef: ["beef", "牛肉"],
      salmon: ["salmon", "三文魚"],
      prawn: ["prawn", "蝦"],
      rice: ["rice", "米"],
      noodle: ["noodle", "麵"],
      soy: ["soy sauce", "生抽", "老抽"],
      oyster: ["oyster sauce", "蠔油"],
      wine: ["shaoxing", "wine", "花雕", "廚酒"],
      sesame: ["sesame oil", "芝麻油", "麻油"],
      sugar: ["sugar", "糖"],
      salt: ["salt", "鹽"],
      pepper: ["pepper", "胡椒"],
      cornstarch: ["cornstarch", "生粉", "粟粉"],
      milk: ["milk", "牛奶"],
      butter: ["butter", "牛油"],
      curry: ["curry", "咖喱"],
      tomato: ["tomato", "蕃茄"],
    };

    for (const [key, searchTerms] of Object.entries(keywordMap)) {
      if (ing.includes(key)) {
        match = products.find((p) =>
          searchTerms.some(
            (term) =>
              p.name.toLowerCase().includes(term) ||
              p.nameZh.toLowerCase().includes(term)
          )
        );
        if (match) return match;
      }
    }

    return null;
  }

  async compareStoresForShoppingList(
    ingredients: IngredientMatchQuery[]
  ): Promise<StoreCatalogComparison[]> {
    const stores = await prisma.store.findMany({
      include: {
        products: true,
      },
    });

    const storeResults: StoreCatalogComparison[] = stores.map((store) => {
      const matches: MatchedProductDetail[] = ingredients.map((ing) => {
        const found = this.matchProductInStore(ing.name, store.products);
        if (found) {
          return {
            ingredientName: ing.name,
            product: {
              id: found.id,
              name: found.name,
              nameZh: found.nameZh,
              price: found.price,
              unit: found.unit,
              stock: found.stock,
              imageUrl: found.imageUrl,
            },
            isAvailable: found.stock > 0,
          };
        } else {
          return {
            ingredientName: ing.name,
            product: null,
            isAvailable: false,
            substituteSuggestion: `Try local wet market or substitute with general alternative in Hong Kong.`,
          };
        }
      });

      const itemsAvailableCount = matches.filter((m) => m.isAvailable).length;
      const basketSubtotal = matches.reduce((acc, m) => acc + (m.product?.price || 0), 0);

      const effectiveDeliveryFee =
        basketSubtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee;

      const totalBasketPrice = Math.round((basketSubtotal + effectiveDeliveryFee) * 10) / 10;

      return {
        storeId: store.id,
        storeName: store.name,
        storeNameZh: store.nameZh,
        slug: store.slug,
        address: store.address,
        logoUrl: store.logoUrl,
        deliveryTimeEstimate: store.deliveryTimeEstimate,
        deliveryFee: store.deliveryFee,
        freeDeliveryThreshold: store.freeDeliveryThreshold,
        pickupAvailable: store.pickupAvailable,
        deliveryAvailable: store.deliveryAvailable,
        itemsAvailableCount,
        totalItemsCount: ingredients.length,
        basketSubtotal: Math.round(basketSubtotal * 10) / 10,
        effectiveDeliveryFee,
        totalBasketPrice,
        isCheapest: false,
        isMostComplete: false,
        matches,
      };
    });

    // Identify Cheapest store (minimum total basket price among stores with matching items)
    let minPrice = Infinity;
    let maxComplete = -1;

    for (const res of storeResults) {
      if (res.itemsAvailableCount > 0 && res.totalBasketPrice < minPrice) {
        minPrice = res.totalBasketPrice;
      }
      if (res.itemsAvailableCount > maxComplete) {
        maxComplete = res.itemsAvailableCount;
      }
    }

    for (const res of storeResults) {
      if (res.totalBasketPrice === minPrice && minPrice !== Infinity) {
        res.isCheapest = true;
      }
      if (res.itemsAvailableCount === maxComplete && maxComplete > 0) {
        res.isMostComplete = true;
      }
    }

    return storeResults;
  }

  async searchStoreProducts(storeId: string, query: string): Promise<any[]> {
    const q = query.trim().toLowerCase();
    return prisma.product.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: q } },
          { nameZh: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: 20,
    });
  }
}

// Global singleton instance of StoreConnector
export const storeConnector: IStoreConnector = new MockHongKongStoreConnector();
