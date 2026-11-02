"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShoppingBag,
  Clock,
  Truck,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Bell,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500">
        {t("loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Order Not Found</h2>
        <Link href="/orders" className="text-brand-600 font-bold hover:underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  // 5 Status Progression Steps
  const stages = [
    { key: "PLACED", label: t("orderStatusPlaced") },
    { key: "CONFIRMED", label: t("orderStatusConfirmed") },
    { key: "PREPARING", label: t("orderStatusPreparing") },
    {
      key: order.fulfillmentType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY_FOR_PICKUP",
      label: order.fulfillmentType === "DELIVERY" ? t("orderStatusOutForDelivery") : t("orderStatusReadyForPickup"),
    },
    { key: "COMPLETED", label: t("orderStatusCompleted") },
  ];

  const getStageIndex = (status: string) => {
    if (status === "CANCELLED") return -1;
    const idx = stages.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === "zh-HK" ? "返回訂單列表" : "Back to Orders"}</span>
        </Link>

        <button
          onClick={fetchOrder}
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Order Main Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
              {order.fulfillmentType === "DELIVERY" ? "🚚 Home Delivery" : "🏪 Store Pickup"}
            </span>
            <h1 className="text-2xl font-black text-stone-900">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-stone-500">
              Placed on {new Date(order.createdAt).toLocaleString()} • Store: <strong>{order.store?.name}</strong>
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-stone-400 uppercase font-bold block">
              Total Amount
            </span>
            <span className="text-3xl font-black text-brand-600">
              HK$ {order.total.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Paid via {order.paymentMethod}
            </span>
          </div>
        </div>

        {/* Visual Progress Timeline (Requirement 4.5) */}
        <div className="py-4">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-6">
            {t("orderTrackingTitle")}
          </h3>

          <div className="relative">
            {/* Progress bar line */}
            <div className="absolute top-4 left-0 right-0 h-1 bg-stone-200 z-0" />
            <div
              className="absolute top-4 left-0 h-1 bg-brand-500 z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%`,
              }}
            />

            {/* Stages icons & labels */}
            <div className="relative z-10 flex justify-between">
              {stages.map((stage, idx) => {
                const isPast = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="flex flex-col items-center text-center max-w-[80px]">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                        isCurrent
                          ? "bg-brand-500 text-white ring-4 ring-brand-100"
                          : isPast
                          ? "bg-brand-500 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 ${
                        isCurrent
                          ? "text-brand-700 font-bold"
                          : isPast
                          ? "text-stone-800"
                          : "text-stone-400"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Demo Interactive Status Simulator (Allows tester to simulate all order updates!) */}
        <div className="p-4 rounded-xl bg-stone-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              MVP Status Simulation Controls:
            </span>
            <span className="text-[11px] text-stone-400">
              Current: <strong>{order.status}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSimulateStatus("CONFIRMED")}
              disabled={updating}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700"
            >
              Confirm Order
            </button>
            <button
              onClick={() => handleSimulateStatus("PREPARING")}
              disabled={updating}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700"
            >
              Start Preparing
            </button>
            <button
              onClick={() =>
                handleSimulateStatus(
                  order.fulfillmentType === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY_FOR_PICKUP"
                )
              }
              disabled={updating}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700"
            >
              {order.fulfillmentType === "DELIVERY" ? "Out for Delivery" : "Ready for Pickup"}
            </button>
            <button
              onClick={() => handleSimulateStatus("COMPLETED")}
              disabled={updating}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
            >
              Mark Completed ✓
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid: Delivery / Pickup Details + Items + Notifications Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fulfillment & Items summary */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-2">
            Fulfillment Details
          </h3>

          <div className="text-xs text-stone-600 space-y-2">
            {order.fulfillmentType === "DELIVERY" ? (
              <>
                <p>
                  <strong>Delivery Address:</strong> {order.deliveryAddress}
                </p>
                <p>
                  <strong>Delivery Slot:</strong> {order.deliveryTimeSlot}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Store Pickup:</strong> {order.pickupStoreName}
                </p>
                <p>
                  <strong>Pickup Time:</strong> {order.pickupTimeSlot}
                </p>
              </>
            )}
            <p>
              <strong>Payment Reference:</strong>{" "}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">
                {order.paymentRef}
              </code>
            </p>
          </div>

          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider pt-2 border-t border-stone-100">
            Ordered Items ({order.items?.length})
          </h4>

          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-stone-900">
                    {language === "zh-HK" && item.productNameZh ? item.productNameZh : item.productName}
                  </span>
                  <span className="text-stone-400 ml-1">
                    x {item.quantity} ({item.unit})
                  </span>
                </div>
                <span className="font-bold text-stone-800">
                  HK$ {item.total.toFixed(1)}
                </span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>HK$ {order.subtotal.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>HK$ {order.deliveryFee.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Service Fee:</span>
              <span>HK$ {order.transactionFee.toFixed(1)}</span>
            </div>
            <div className="flex justify-between font-black text-stone-900 text-sm pt-1 border-t border-stone-100">
              <span>Total:</span>
              <span>HK$ {order.total.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Notifications & Status Log (Requirement 4.5) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600" />
            {t("orderNotificationHistory")}
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {order.notifications?.map((notif: any) => (
              <div
                key={notif.id}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-stone-400 text-[10px]">
                  <span className="font-bold uppercase text-brand-700">
                    {notif.status}
                  </span>
                  <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-stone-700 font-medium">
                  {language === "zh-HK" && notif.messageZh ? notif.messageZh : notif.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
