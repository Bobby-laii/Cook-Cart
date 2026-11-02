"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Store,
  Package,
  ShoppingBag,
  Clock,
  Edit2,
  Check,
  RefreshCw,
  AlertCircle,
  Truck,
  Building,
} from "lucide-react";

export default function StorePartnerPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state for products
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch store inventory
      const prodRes = await fetch("/api/partner/products");
      if (prodRes.ok) {
        const pData = await prodRes.json();
        setStore(pData.store);
        setProducts(pData.products || []);
      }

      // 2. Fetch incoming orders
      const orderRes = await fetch("/api/orders");
      if (orderRes.ok) {
        const oData = await orderRes.json();
        setOrders(oData.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
    setSaveSuccess(false);
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      const res = await fetch("/api/partner/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          price: editPrice,
          stock: editStock,
        }),
      });

      if (res.ok) {
        setProducts(
          products.map((p) =>
            p.id === productId
              ? { ...p, price: parseFloat(editPrice), stock: parseInt(editStock, 10) }
              : p
          )
        );
        setEditingId(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Save product error", e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders(
          orders.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              {t("partnerDashboardTitle")}
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Store: <strong className="text-stone-800">{store?.name || "ParkGrocer HK"}</strong> • {store?.address}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "inventory"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t("manageInventory")} ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "orders"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t("incomingOrders")} ({orders.length})
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Product price and stock updated successfully!</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-stone-500">{t("loading")}</div>
      ) : activeTab === "inventory" ? (
        /* Inventory Catalog Table */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Supermarket Product Catalog
            </span>
            <span className="text-xs text-stone-500">
              {language === "zh-HK" ? "點擊「編輯」即時修改售價與庫存" : "Click 'Edit' to change price or stock live"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Price (HKD)</th>
                  <th className="py-3 px-4">Stock Count</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {p.name}
                        <span className="text-stone-400 block text-[11px] font-normal">
                          {p.nameZh}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{p.category}</td>
                      <td className="py-3 px-4 text-stone-500">{p.unit}</td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 px-2 py-1 rounded border border-brand-500 font-bold text-xs"
                          />
                        ) : (
                          <span className="font-bold text-stone-900">
                            HK$ {p.price.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-brand-500 font-bold text-xs"
                          />
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.stock > 10
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-red-50 text-red-800"
                            }`}
                          >
                            {p.stock} units
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveProduct(p.id)}
                              className="px-2.5 py-1 rounded bg-brand-500 text-white font-bold text-[11px] hover:bg-brand-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded bg-stone-200 text-stone-700 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Incoming Orders Management */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
              No orders placed for this store yet.
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-stone-900">
                        {o.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-stone-100 text-stone-800">
                        {o.fulfillmentType}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      {new Date(o.createdAt).toLocaleString()} • {o.items?.length || 0} items
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Update Status:</span>
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
                    >
                      <option value="PLACED">PLACED (已下單)</option>
                      <option value="CONFIRMED">CONFIRMED (門市已確認)</option>
                      <option value="PREPARING">PREPARING (揀選包裝中)</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (配送中)</option>
                      <option value="READY_FOR_PICKUP">READY_FOR_PICKUP (待自取)</option>
                      <option value="COMPLETED">COMPLETED (已完成)</option>
                      <option value="CANCELLED">CANCELLED (已取消)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                  <div>
                    <p>
                      <strong>Destination:</strong> {o.deliveryAddress || o.pickupStoreName}
                    </p>
                    <p>
                      <strong>Slot:</strong> {o.deliveryTimeSlot || o.pickupTimeSlot}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p>
                      <strong>Total Amount:</strong>{" "}
                      <span className="text-brand-600 font-bold text-sm">
                        HK$ {o.total.toFixed(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
