"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShieldCheck,
  Settings,
  BarChart3,
  Cpu,
  Save,
  Check,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  PieChart,
} from "lucide-react";

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"settings" | "reports" | "ai_logs">("settings");
  const [loading, setLoading] = useState(true);

  // Settings state
  const [transactionFee, setTransactionFee] = useState("5.0");
  const [deliveryFee, setDeliveryFee] = useState("30.0");
  const [freeThreshold, setFreeThreshold] = useState("350.0");
  const [aiModel, setAiModel] = useState("gemini-1.5-flash");
  const [monthlyCap, setMonthlyCap] = useState("100.0");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Reports state
  const [metrics, setMetrics] = useState<any>({});
  const [topCuisines, setTopCuisines] = useState<any[]>([]);
  const [topRecipes, setTopRecipes] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  useEffect(() => {
    loadSettingsAndReports();
  }, [user]);

  const loadSettingsAndReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch settings
      const setRes = await fetch("/api/admin/settings");
      if (setRes.ok) {
        const sData = await setRes.json();
        const s = sData.settings || {};
        if (s.transaction_fee_percent) setTransactionFee(s.transaction_fee_percent);
        if (s.default_delivery_fee) setDeliveryFee(s.default_delivery_fee);
        if (s.free_delivery_threshold) setFreeThreshold(s.free_delivery_threshold);
        if (s.ai_model_name) setAiModel(s.ai_model_name);
        if (s.ai_monthly_spending_cap) setMonthlyCap(s.ai_monthly_spending_cap);
        if (s.system_prompt) setSystemPrompt(s.system_prompt);
      }

      // 2. Fetch reports
      const repRes = await fetch("/api/admin/reports");
      if (repRes.ok) {
        const rData = await repRes.json();
        setMetrics(rData.metrics || {});
        setTopCuisines(rData.topCuisines || []);
        setTopRecipes(rData.topCookedRecipes || []);
        setAiLogs(rData.aiLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_fee_percent: transactionFee,
          default_delivery_fee: deliveryFee,
          free_delivery_threshold: freeThreshold,
          ai_model_name: aiModel,
          ai_monthly_spending_cap: monthlyCap,
          system_prompt: systemPrompt,
        }),
      });

      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (e) {
      console.error("Save settings error", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              {t("adminDashboardTitle")}
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Platform governance, business models, AI spending caps, and Hong Kong grocery operations
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "settings"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t("adminSettingsTab")}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "reports"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t("adminReportsTab")}
          </button>
          <button
            onClick={() => setActiveTab("ai_logs")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "ai_logs"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t("adminAiLogsTab")} ({aiLogs.length})
          </button>
        </div>
      </div>

      {/* Top Level KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
            {t("totalRevenue")}
          </span>
          <span className="text-2xl font-black text-stone-900">
            HK$ {metrics.totalGrossRevenue?.toFixed(1) || "0.0"}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            From fees & deliveries
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
            {t("totalOrders")}
          </span>
          <span className="text-2xl font-black text-stone-900">
            {metrics.totalOrders || 0}
          </span>
          <span className="text-[11px] text-stone-500 font-medium block">
            Avg Basket: HK$ {metrics.avgBasketSize?.toFixed(1) || "0.0"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
            AI Tokens Processed
          </span>
          <span className="text-2xl font-black text-purple-700">
            {metrics.totalAITokens?.toLocaleString() || 0}
          </span>
          <span className="text-[11px] text-stone-500 font-medium block">
            Across {metrics.totalConversations || 0} chat sessions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
            Estimated AI Cost
          </span>
          <span className="text-2xl font-black text-amber-600">
            HK$ {metrics.totalAICostHkd?.toFixed(2) || "0.00"}
          </span>
          <span className="text-[11px] text-stone-500 font-medium block">
            Cap: HK$ {monthlyCap} / mo
          </span>
        </div>
      </div>

      {settingsSaved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Platform settings and live system prompt updated successfully!</span>
        </div>
      )}

      {/* Tab 1: Platform & AI Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3">
            {t("adminSettingsTab")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t("transactionFeeRate")}
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={transactionFee}
                onChange={(e) => setTransactionFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
              />
              <p className="text-[11px] text-stone-400 mt-1">Platform commission on order subtotal</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t("defaultDeliveryFeeHKD")}
              </label>
              <input
                type="number"
                step="1"
                required
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
              />
              <p className="text-[11px] text-stone-400 mt-1">Flat courier delivery fee</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t("freeDeliveryThresholdHKD")}
              </label>
              <input
                type="number"
                step="10"
                required
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
              />
              <p className="text-[11px] text-stone-400 mt-1">Orders above this qualify for free delivery</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t("aiModelSelection")}
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white font-semibold"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Fast & Low Cost)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (High Reasoning)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="cookcart-local-engine">CookCart Hong Kong Offline Engine (Zero Cost)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t("monthlySpendingCap")}
              </label>
              <input
                type="number"
                step="10"
                required
                value={monthlyCap}
                onChange={(e) => setMonthlyCap(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
              />
              <p className="text-[11px] text-stone-400 mt-1">Stops AI completions when monthly spending exceeds cap</p>
            </div>
          </div>

          {/* Live Editable System Prompt (Requirement 4.2 & 4.7) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              {t("systemPromptTitle")}
            </label>
            <textarea
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs font-mono bg-stone-50 leading-relaxed focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Controls topic restrictions (food only), "use all ingredients" enforcement, safety reminders, and language tone.
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{t("saveSettingsBtn")}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Reports & Analytics */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cuisines */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              {t("topCuisines")}
            </h3>
            <div className="space-y-3">
              {topCuisines.map((c) => (
                <div key={c.cuisine} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{c.cuisine}</span>
                    <span>{c.requests} requests ({c.percentage})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: c.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cooked Dishes */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              {t("topRecipes")}
            </h3>
            <div className="space-y-3">
              {topRecipes.map((r, idx) => (
                <div key={r.title} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-900">{r.title}</span>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {r.cooksCount} cooked
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Usage & Budget Log */}
      {activeTab === "ai_logs" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              AI Token & Cost Log History
            </span>
            <span className="text-xs text-stone-500">
              Total Logged: {aiLogs.length} queries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Model Name</th>
                  <th className="py-3 px-4">Prompt Tokens</th>
                  <th className="py-3 px-4">Completion Tokens</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4 text-right">Est. Cost (HKD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {aiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">
                      {log.user?.email || "Anonymous"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[11px]">
                        {log.modelName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{log.tokensPrompt}</td>
                    <td className="py-3 px-4 text-stone-600">{log.tokensCompletion}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{log.tokensTotal}</td>
                    <td className="py-3 px-4 text-right font-black text-amber-700">
                      HK$ {log.estimatedCostHkd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
