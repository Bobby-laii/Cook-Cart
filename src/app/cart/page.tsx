"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCart } from "@/lib/cart/CartContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { APP_CONFIG } from "@/config/appConfig";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [address, setAddress] = useState("Flat B, 16/F, Tower 2, Hennessy Road, Wan Chai, Hong Kong");
  const [timeSlot, setTimeSlot] = useState("18:00 - 20:00 (Today)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fee calculation (Requirement 2 & Section 4.5)
  const storeId = items[0]?.storeId || "parkgrocer-hk";
  const storeName = items[0]?.storeName || "ParkGrocer HK";

  const freeDeliveryThreshold = 350.0;
  const standardDeliveryFee = 30.0;
  const deliveryFee =
    fulfillmentType === "DELIVERY"
      ? subtotal >= freeDeliveryThreshold
        ? 0
        : standardDeliveryFee
      : 0; // Self pickup is always HK$0

  const transactionFeePercent = 5.0; // 5%
  const transactionFee = Math.round(((subtotal * transactionFeePercent) / 100) * 10) / 10;
  const total = Math.round((subtotal + deliveryFee + transactionFee) * 10) / 10;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items,
          fulfillmentType,
          deliveryAddress: address,
          deliveryTimeSlot: timeSlot,
          pickupStoreName: storeName,
          pickupTimeSlot: timeSlot,
          notes,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.orderId) {
        clearCart();
        router.push(`/orders/${data.orderId}`);
      } else {
        setError(data.error || "Checkout failed");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Network error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">
          {t("cartEmpty")}
        </h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          {language === "zh-HK"
            ? "您的購物車尚未加入食材。去 AI 煮食對話推薦菜式，或比對超市格價加入商品！"
            : "Explore dishes with Chef Cart or compare supermarkets to add ingredients here."}
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition"
        >
          {t("navChat")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            {t("cartTitle")} ({itemCount})
          </h1>
          <p className="text-xs text-stone-500">
            {language === "zh-HK" ? "由合作門市直送：" : "Supplied by partner:"} <strong className="text-stone-800">{storeName}</strong>
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-red-600 font-semibold transition"
        >
          {language === "zh-HK" ? "清空購物車" : "Clear All"}
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Items List & Fulfillment Choice */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.productId} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-stone-900">
                    {language === "zh-HK" && item.nameZh ? item.nameZh : item.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    HK$ {item.price.toFixed(1)} / {item.unit}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-stone-600 hover:bg-stone-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-stone-600 hover:bg-stone-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-20 text-right text-sm font-black text-stone-900">
                    HK$ {(item.price * item.quantity).toFixed(1)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fulfillment Selection (Home Delivery vs Self Pickup) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-600" />
              {t("fulfillmentOptionTitle")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setFulfillmentType("DELIVERY")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                  fulfillmentType === "DELIVERY"
                    ? "border-brand-500 bg-brand-50/40 text-brand-900"
                    : "border-stone-200 hover:border-stone-300 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillmentType === "DELIVERY"}
                  onChange={() => setFulfillmentType("DELIVERY")}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-bold block">{t("deliveryOption")}</span>
                  <span className="text-xs text-stone-500">
                    {deliveryFee === 0 ? "✓ Free (Over HK$350)" : "HK$ 30 Flat Fee"}
                  </span>
                </div>
              </label>

              <label
                onClick={() => setFulfillmentType("PICKUP")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                  fulfillmentType === "PICKUP"
                    ? "border-brand-500 bg-brand-50/40 text-brand-900"
                    : "border-stone-200 hover:border-stone-300 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  checked={fulfillmentType === "PICKUP"}
                  onChange={() => setFulfillmentType("PICKUP")}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-bold block">{t("pickupOption")}</span>
                  <span className="text-xs text-emerald-600 font-semibold">
                    ✓ HK$ 0.00 Delivery Fee
                  </span>
                </div>
              </label>
            </div>

            {/* Address & Slot inputs */}
            {fulfillmentType === "DELIVERY" ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {t("deliveryAddressLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("deliveryAddressPlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {t("timeSlotLabel")}
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="14:00 - 16:00 (Today)">14:00 - 16:00 (Today)</option>
                    <option value="18:00 - 20:00 (Today)">18:00 - 20:00 (Today - Evening Cook)</option>
                    <option value="10:00 - 12:00 (Tomorrow)">10:00 - 12:00 (Tomorrow Morning)</option>
                    <option value="14:00 - 16:00 (Tomorrow)">14:00 - 16:00 (Tomorrow Afternoon)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                  <span className="font-bold text-stone-800">{t("pickupLocationLabel")}:</span>
                  <p className="text-stone-600">{storeName} - Customer Service Counter, Hong Kong</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Pickup Time
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option value="Ready in 45 mins (Today)">Ready in 45 mins (Today)</option>
                    <option value="18:30 (Today)">18:30 (Today)</option>
                    <option value="12:00 (Tomorrow)">12:00 (Tomorrow)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Order Summary & Checkout CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3">
              {t("orderSummary")}
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>{t("subtotal")}</span>
                <span className="font-semibold text-stone-900">HK$ {subtotal.toFixed(1)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <div className="flex items-center gap-1">
                  <span>{t("deliveryFeeLabel")}</span>
                  {deliveryFee === 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                      FREE
                    </span>
                  )}
                </div>
                <span className="font-semibold text-stone-900">
                  HK$ {deliveryFee.toFixed(1)}
                </span>
              </div>

              <div className="flex justify-between text-stone-600">
                <div className="flex items-center gap-1">
                  <span>{t("transactionFee")}</span>
                  <span className="text-[10px] text-stone-400">({transactionFeePercent}%)</span>
                </div>
                <span className="font-semibold text-stone-900">
                  HK$ {transactionFee.toFixed(1)}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <span className="text-base font-black text-stone-900">{t("totalAmount")}</span>
                <span className="text-2xl font-black text-brand-600">
                  HK$ {total.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Mock Payment Simulation Notice */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500 space-y-1">
              <div className="flex items-center gap-1 font-bold text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mock Payment Provider</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {t("paymentSimulated")}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-base shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? t("loading") : t("placeOrderBtn")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
