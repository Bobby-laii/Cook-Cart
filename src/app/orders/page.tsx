"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Colour classes live in `bg` (they already include the text-* utility), so
    // there is no separate `text` field to supply.
    const map: Record<string, { bg: string; label: string }> = {
      PLACED: { bg: "bg-blue-50 border-blue-200 text-blue-700", label: t("orderStatusPlaced") },
      CONFIRMED: { bg: "bg-purple-50 border-purple-200 text-purple-700", label: t("orderStatusConfirmed") },
      PREPARING: { bg: "bg-amber-50 border-amber-200 text-amber-700", label: t("orderStatusPreparing") },
      OUT_FOR_DELIVERY: { bg: "bg-orange-50 border-orange-200 text-orange-700", label: t("orderStatusOutForDelivery") },
      READY_FOR_PICKUP: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", label: t("orderStatusReadyForPickup") },
      COMPLETED: { bg: "bg-green-50 border-green-200 text-green-700", label: t("orderStatusCompleted") },
      CANCELLED: { bg: "bg-red-50 border-red-200 text-red-700", label: t("orderStatusCancelled") },
    };

    const s = map[status] || { bg: "bg-stone-100 text-stone-700", label: status };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            {t("navOrders")}
          </h1>
        </div>
        <p className="text-sm text-stone-500">
          {language === "zh-HK" ? "追蹤您已訂購之超市買餸清單與進度" : "Track all your grocery orders & delivery timelines"}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-500">{t("loading")}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {language === "zh-HK" ? "尚未有任何訂單" : "No orders found"}
          </h3>
          <p className="text-xs text-stone-500">
            {language === "zh-HK" ? "當您從食譜加入食材並完成下單後，訂單將會顯示於此。" : "When you place an order, your tracking details will appear here."}
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md"
          >
            {language === "zh-HK" ? "挑選食材下單 →" : "Shop Ingredients →"}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-black text-stone-900">
                    {order.orderNumber}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-stone-600 flex items-center gap-4">
                  <span>
                    Store: <strong className="text-stone-900">{order.store?.name}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Fulfillment: <strong className="text-stone-900">{order.fulfillmentType}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Items: <strong className="text-stone-900">{order.items?.length || 0}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="sm:text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">
                    Total
                  </span>
                  <span className="text-lg font-black text-stone-900">
                    HK$ {order.total.toFixed(1)}
                  </span>
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm"
                >
                  <span>{language === "zh-HK" ? "查看進度追蹤" : "Track Order"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
