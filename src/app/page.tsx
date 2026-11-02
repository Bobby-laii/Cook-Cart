"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Sparkles,
  ShoppingBag,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingDown,
  Layers,
  Sparkle,
} from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();
  const { user, switchDemoRole } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-stone-50 to-white pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 text-brand-800 text-xs sm:text-sm font-semibold border border-brand-200/60 shadow-sm">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>
                  {language === "zh-HK"
                    ? "專為香港家庭與都市人設計的 AI 買餸神器"
                    : "Tailored for Hong Kong home cooks & busy residents"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.15]">
                {language === "zh-HK" ? (
                  <>
                    不知道煮乜好？
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-amber-600">
                      AI 幫你諗餸兼格價買齊
                    </span>
                  </>
                ) : (
                  <>
                    Decide what to cook.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-amber-600">
                      Buy the ingredients in 1-click.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {language === "zh-HK"
                  ? "選擇菜系、輸入或拍照上載現有食材。Chef Cart 嚴格保證將所有指定食材全數入饌，即時比對香港各大超市價格，直送上門或門市自取。"
                  : "Pick a cuisine, type your ingredients or upload a photo of your fridge. AI suggests recipes using ALL your ingredients, compares HK supermarket prices, and delivers to your door."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href="/chat"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5" />
                  {language === "zh-HK" ? "開始 AI 煮食對話" : "Start AI Cooking Chat"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/my-recipes"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-semibold text-base border border-stone-300 shadow-sm transition"
                >
                  <ChefHat className="w-5 h-5 text-brand-600" />
                  {t("navMyRecipes")}
                </Link>
              </div>

              {/* Guarantees checklist */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm font-medium text-stone-600">
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === "zh-HK" ? "必用盡所有指定食材" : "Uses ALL chosen ingredients"}
                  </span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === "zh-HK" ? "香港 4 大超市即時格價" : "Live price comparison (4 stores)"}
                  </span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === "zh-HK" ? "沉浸式步驟計時烹飪" : "Interactive cooking timers"}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200/80">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold">
                      🍳
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Chef Cart AI</h3>
                      <p className="text-[11px] text-emerald-600 font-medium">● Hong Kong Groceries Ready</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    HKD $
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <span className="font-semibold text-stone-700">
                      {language === "zh-HK" ? "指定現有食材：" : "Your ingredients:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                        🐔 {language === "zh-HK" ? "雞腿肉" : "Chicken Thighs"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        🥬 {language === "zh-HK" ? "白菜仔" : "Bok Choy"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">
                        🧄 {language === "zh-HK" ? "大蒜" : "Garlic"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs space-y-1">
                    <span className="font-bold text-brand-900">
                      {language === "zh-HK" ? "AI 推薦菜式 #1：" : "AI Dish Suggestion #1:"}
                    </span>
                    <p className="font-semibold text-stone-900">
                      {language === "zh-HK"
                        ? "蒜香白菜滑雞煲 (耗時 20 分鐘)"
                        : "Garlic Sautéed Chicken & Bok Choy (20 mins)"}
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      {language === "zh-HK"
                        ? "✓ 全數使用 3 種食材，額外僅需紹興酒及生抽"
                        : "✓ Includes all 3 items; only needs soy sauce & Shaoxing wine"}
                    </p>
                  </div>

                  {/* Supermarket price comparison sample */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-stone-500 font-medium">
                      <span>{language === "zh-HK" ? "超市格價：" : "Store comparison:"}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {language === "zh-HK" ? "最平節省 18%" : "Save up to 18%"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1 px-2 rounded bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200">
                        <span>WellMart HK (最平)</span>
                        <span>HK$ 48.5</span>
                      </div>
                      <div className="flex justify-between items-center py-1 px-2 text-stone-600">
                        <span>ParkGrocer HK</span>
                        <span>HK$ 52.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  <Link
                    href="/chat"
                    className="w-full block text-center py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition"
                  >
                    {language === "zh-HK" ? "立即輸入你的食材體驗 →" : "Try with your ingredients →"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Process Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            {language === "zh-HK" ? "CookCart 如何運作？" : "How CookCart Works"}
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto text-sm sm:text-base">
            {language === "zh-HK"
              ? "由決定煮甚麼到買齊餸菜，只需 3 個簡單步驟"
              : "From recipe idea to delivered groceries in 3 seamless steps."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {language === "zh-HK" ? "選取食材與菜系" : "Pick Ingredients & Cuisine"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {language === "zh-HK"
                ? "鍵入、點選食材標籤，或直接拍照上載雪櫃。設定人數、時間與廚房設備。"
                : "Type ingredients, tap chips, or upload a fridge photo. Set servings, prep time limit, and kitchen tools."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {language === "zh-HK" ? "AI 建議 3 款必用盡食譜" : "AI Meal Suggestions"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {language === "zh-HK"
                ? "嚴格採用所有您指定的食材，提供香港本地替代品，附詳細份量與逐步料理指引。"
                : "Strictly incorporates every selected item. Provides local Hong Kong substitutes and scaled step-by-step recipes."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {language === "zh-HK" ? "超市格價與一鍵下單" : "Compare Stores & Order"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {language === "zh-HK"
                ? "自動扣減家中已有材料，即時比較百佳、惠康、city'super 等各大超市，選擇送貨或自取。"
                : "Deducts what you already have at home. Compares HK supermarkets, and lets you choose home delivery or pickup."}
            </p>
          </div>
        </div>
      </section>

      {/* Demo Role Switcher Quick Access Section for Evaluator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-2xl space-y-2 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {language === "zh-HK" ? "MVP 評審快速體驗" : "MVP Evaluator Quick Access"}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">
              {language === "zh-HK" ? "隨時切換 3 種帳號角色" : "Switch Between 3 Roles Instantly"}
            </h3>
            <p className="text-sm text-stone-300">
              {language === "zh-HK"
                ? "點擊以下按鈕即可即時登入不同身分，測試顧客下單、商戶接單及總管理員權限："
                : "Click any button to switch roles without manual login, testing customer orders, store inventory, and admin reports:"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => switchDemoRole("CUSTOMER")}
              className="p-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold">
                  CUSTOMER
                </span>
                <h4 className="text-base font-bold mt-2">Alice Chan</h4>
                <p className="text-xs text-stone-400 mt-1">customer@cookcart.hk</p>
              </div>
              <span className="text-xs text-amber-300 font-semibold mt-3">
                {language === "zh-HK" ? "切換至顧客 →" : "Login as Customer →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("STORE_PARTNER")}
              className="p-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  STORE PARTNER
                </span>
                <h4 className="text-base font-bold mt-2">ParkGrocer HK</h4>
                <p className="text-xs text-stone-400 mt-1">store@cookcart.hk</p>
              </div>
              <span className="text-xs text-amber-300 font-semibold mt-3">
                {language === "zh-HK" ? "切換至商戶 →" : "Login as Partner →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("ADMIN")}
              className="p-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
                  ADMIN
                </span>
                <h4 className="text-base font-bold mt-2">CookCart Admin</h4>
                <p className="text-xs text-stone-400 mt-1">admin@cookcart.hk</p>
              </div>
              <span className="text-xs text-amber-300 font-semibold mt-3">
                {language === "zh-HK" ? "切換至管理員 →" : "Login as Admin →"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
