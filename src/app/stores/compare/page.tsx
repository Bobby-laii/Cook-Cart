"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCart } from "@/lib/cart/CartContext";
import { StoreCatalogComparison } from "@/lib/connectors/storeConnector";
import {
  Store,
  Clock,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function StoreComparePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { addItem, clearCart } = useCart();

  const [shoppingList, setShoppingList] = useState<{ name: string; amount?: number; unit?: string }[]>([]);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [storeComparisons, setStoreComparisons] = useState<StoreCatalogComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Read shopping list from session storage
    let list: any[] = [];
    try {
      const cachedList = sessionStorage.getItem("cookcart_shopping_list");
      if (cachedList) {
        list = JSON.parse(cachedList);
      }
      const title = sessionStorage.getItem("cookcart_recipe_title");
      if (title) setRecipeTitle(title);
    } catch (e) {
      console.error(e);
    }

    if (list.length === 0) {
      // Default demo list if opened directly
      list = [
        { name: "Chicken Thigh Fillets", amount: 400, unit: "g" },
        { name: "Fresh Shiitake Mushrooms", amount: 4, unit: "pcs" },
        { name: "Ginger", amount: 15, unit: "g" },
        { name: "Spring Onions", amount: 2, unit: "stalks" },
      ];
    }
    setShoppingList(list);

    // 2. Fetch comparison from API
    fetchStoreComparison(list);
  }, []);

  const fetchStoreComparison = async (ingredients: any[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stores/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoreComparisons(data.stores || []);
        // Expand the cheapest store by default
        const cheapest = data.stores?.find((s: any) => s.isCheapest);
        if (cheapest) {
          setExpandedStoreId(cheapest.storeId);
        }
      }
    } catch (e) {
      console.error("Store comparison fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: StoreCatalogComparison) => {
    // Clear and populate cart with the matched products from this store
    clearCart();
    store.matches.forEach((m) => {
      if (m.product && m.isAvailable) {
        addItem({
          id: `cart_${m.product.id}`,
          productId: m.product.id,
          name: m.product.name,
          nameZh: m.product.nameZh,
          price: m.product.price,
          unit: m.product.unit,
          quantity: 1,
          storeId: store.storeId,
          storeName: store.storeName,
          storeNameZh: store.storeNameZh,
        });
      }
    });

    router.push("/cart");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            {t("storeComparisonTitle")}
          </h1>
        </div>
        <p className="text-sm text-stone-500 max-w-2xl">
          {t("storeComparisonSubtitle")}
        </p>
        {recipeTitle && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
            <span>Recipe: {recipeTitle}</span>
            <span>({shoppingList.length} items to buy)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-500">
            {language === "zh-HK" ? "正在為您比對全港各大超市價格..." : "Comparing prices across Hong Kong supermarkets..."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {storeComparisons.map((store) => {
            const isExpanded = expandedStoreId === store.storeId;
            const displayName = language === "zh-HK" ? store.storeNameZh || store.storeName : store.storeName;

            return (
              <div
                key={store.storeId}
                className={`rounded-2xl border transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
                  store.isCheapest
                    ? "bg-gradient-to-br from-emerald-50/50 via-white to-white border-emerald-300 shadow-md ring-1 ring-emerald-400/30"
                    : "bg-white border-stone-200 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Store Header & Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {store.isCheapest && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {t("cheapestStoreBadge")}
                          </span>
                        )}
                        {store.isMostComplete && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            {t("mostCompleteStoreBadge")}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-stone-900">
                        {displayName}
                      </h3>
                      <p className="text-xs text-stone-500 truncate max-w-sm">
                        {store.address}
                      </p>
                    </div>

                    {/* Total Price Display */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] text-stone-400 uppercase font-bold block">
                        Estimated Basket
                      </span>
                      <span className="text-2xl font-black text-stone-900">
                        HK$ {store.totalBasketPrice.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        (Subtotal: ${store.basketSubtotal.toFixed(1)})
                      </span>
                    </div>
                  </div>

                  {/* Delivery & Fulfillment Details */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">
                        {t("availability")}
                      </span>
                      <strong className="text-emerald-700 font-bold">
                        {store.itemsAvailableCount} / {store.totalItemsCount} {t("itemsInStock")}
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">
                        {t("deliveryFeeLabel")}
                      </span>
                      <strong className="text-stone-800">
                        {store.effectiveDeliveryFee === 0 ? (
                          <span className="text-emerald-600 font-bold">{t("freeDelivery")}</span>
                        ) : (
                          `HK$ ${store.effectiveDeliveryFee}`
                        )}
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">
                        Est. Time
                      </span>
                      <strong className="text-stone-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {store.deliveryTimeEstimate}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Collapsible Matched Products Breakdown */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setExpandedStoreId(isExpanded ? null : store.storeId)}
                    className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 py-1"
                  >
                    <span>
                      {language === "zh-HK" ? "查看食材配對詳情" : "View Matched Products"} ({store.matches.length})
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-stone-100 max-h-60 overflow-y-auto">
                      {store.matches.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50"
                        >
                          <div className="flex items-center gap-2">
                            {m.isAvailable ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-stone-800">
                                {m.product ? (language === "zh-HK" ? m.product.nameZh || m.product.name : m.product.name) : m.ingredientName}
                              </p>
                              {!m.isAvailable && (
                                <p className="text-[10px] text-amber-700 italic">
                                  {m.substituteSuggestion}
                                </p>
                              )}
                            </div>
                          </div>

                          {m.product && (
                            <div className="text-right font-bold text-stone-800">
                              HK$ {m.product.price.toFixed(1)}
                              <span className="text-[10px] text-stone-400 block font-normal">
                                {m.product.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Store CTA */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    {store.pickupAvailable && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        ✓ {t("pickupOption")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectStore(store)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    <span>{t("selectStoreBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
