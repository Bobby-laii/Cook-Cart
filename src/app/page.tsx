"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Sparkles,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingDown,
  Compass,
  Store,
  ShieldCheck,
  User,
} from "lucide-react";

/**
 * Homepage designed with `design-cafe` tokens + `design-bento` modular grid:
 *   - Surface #F9F7F5 (stone-50), secondary cards #E9E3DD (stone-200),
 *     primary #5D4432 (brand-500), text #3E2B1E (stone-900).
 *   -Poppins display headings (3rem h1) + JetBrains Mono `.label-caps` kickers.
 *   - Asymmetric bento grid replaces the three identical feature boxes.
 */
export default function HomePage() {
  const { t, language } = useLanguage();
  const { switchDemoRole } = useAuth();
  const zh = language === "zh-HK";

  return (
    <div className="space-y-12 pb-16 pt-8">
      {/* ─── Hero + Live Kitchen Card ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left hero block (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-stone-200 p-8 sm:p-10 lg:p-12 shadow-cafe flex flex-col justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700">
                <span className="w-2 h-2 rounded-full bg-fresh-600" />
                <span className="label-caps">
                  {zh ? "香港家庭 AI 買餸廚房" : "Hong Kong Kitchen · AI + Groceries"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight leading-[1.12]">
                {zh ? (
                  <>
                    不知道今晚煮乜？
                    <span className="block text-brand-500 mt-1">
                      AI 幫你諗餸，一鍵格價買齊。
                    </span>
                  </>
                ) : (
                  <>
                    What’s in your kitchen
                    <span className="block text-brand-500 mt-1">
                      becomes dinner tonight.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
                {zh
                  ? "揀選菜系、輸入或拍照上載現有食材。Chef Cart 保證將所有指定食材全數入饌，即時比對香港四大超市格價，直送上門或門市自取。"
                  : "Pick a cuisine, tap your ingredients, or snap your fridge. CookCart crafts 3 recipes that use every item you entered and compares prices across Hong Kong supermarkets."}
              </p>
            </div>

            <div className="pt-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-stone-50 font-semibold text-base shadow-cafe transition"
                >
                  <Sparkles className="w-5 h-5" />
                  {zh ? "開始 AI 煮食對話" : "Start Cooking with AI"}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold text-base border border-stone-200 transition"
                >
                  <Compass className="w-5 h-5 text-brand-500" />
                  {zh ? "探索環球菜系" : "Explore Cuisines"}
                </Link>

                <Link
                  href="/my-recipes"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 font-medium text-sm transition"
                >
                  <ChefHat className="w-4 h-4 text-brand-500" />
                  {t("navMyRecipes")}
                </Link>
              </div>

              {/* Three guarantees strip */}
              <div className="pt-5 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                  <span>{zh ? "100% 用盡指定食材" : "Uses every entered ingredient"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-fresh-600 shrink-0" />
                  <span>{zh ? "香港 4 大超市即時格價" : "4 HK supermarkets compared"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-fresh-600 shrink-0" />
                  <span>{zh ? "逐步計時烹調模式" : "Step-by-step cooking timers"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right sample order card (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-stone-900 text-stone-50 p-7 sm:p-8 shadow-cafe-lg flex flex-col justify-between border border-stone-800">
            <div className="flex items-center justify-between pb-5 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-lg">
                  🍳
                </div>
                <div>
                  <span className="label-caps text-caramel-300 block">Live Preview</span>
                  <h2 className="text-base font-semibold text-stone-50">Chef Cart · Tonight’s Ticket</h2>
                </div>
              </div>
              <span className="label-caps px-2.5 py-1 rounded-full bg-stone-800 text-stone-200 border border-stone-700">
                HK$
              </span>
            </div>

            <div className="my-5 space-y-3.5">
              {/* Pantry items */}
              <div className="p-4 rounded-2xl bg-stone-800/70 border border-stone-700/70 space-y-2">
                <span className="label-caps text-stone-400">
                  {zh ? "已選食材" : "01 · Your Pantry"}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 text-xs font-medium border border-stone-700">
                    🐔 {zh ? "雞腿肉" : "Chicken Thighs"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 text-xs font-medium border border-stone-700">
                    🥬 {zh ? "白菜仔" : "Bok Choy"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-stone-100 text-xs font-medium border border-stone-700">
                    🧄 {zh ? "大蒜" : "Garlic"}
                  </span>
                </div>
              </div>

              {/* Dish suggestion */}
              <div className="p-4 rounded-2xl bg-brand-500/30 border border-brand-400/30 space-y-1">
                <span className="label-caps text-caramel-300">
                  {zh ? "AI 推薦菜式 #1" : "02 · Dish Match · 20 mins"}
                </span>
                <p className="font-semibold text-stone-50 text-sm">
                  {zh
                    ? "蒜香白菜滑雞煲"
                    : "Garlic-Glazed Chicken Thighs with Baby Bok Choy"}
                </p>
                <p className="text-stone-300 text-xs">
                  {zh
                    ? "✓ 全數用盡 3 款食材 · 額外只需生抽及紹興酒"
                    : "✓ Uses all 3 items · only needs soy sauce & Shaoxing wine"}
                </p>
              </div>

              {/* Store comparison */}
              <div className="p-4 rounded-2xl bg-stone-50 text-stone-900 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="label-caps text-stone-500">
                    {zh ? "超市格價" : "03 · Best Basket"}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-fresh-700 bg-fresh-100 px-2 py-0.5 rounded-full">
                    {zh ? "節省 18%" : "Save 18%"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 px-3 rounded-xl bg-stone-200/70 font-semibold text-xs">
                  <span>WellMart HK · {zh ? "最抵" : "Lowest"}</span>
                  <span className="font-mono">HK$ 48.50</span>
                </div>
                <div className="flex justify-between items-center px-3 text-xs text-stone-500">
                  <span>ParkGrocer HK</span>
                  <span className="font-mono">HK$ 52.00</span>
                </div>
              </div>
            </div>

            <Link
              href="/chat"
              className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-200 text-stone-900 text-xs font-bold tracking-wide uppercase text-center transition block"
            >
              {zh ? "輸入你的食材試試 →" : "Try With Your Own Ingredients →"}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid: How CookCart Works ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="label-caps text-brand-500">Workflow · 3 Steps</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {zh ? "由雪櫃到餐桌，三步搞掂" : "From fridge to table in three moves"}
            </h2>
          </div>
          <p className="text-sm text-stone-600 max-w-md">
            {zh
              ? "不浪費任何一棵菜，亦不用逐間超市格價。"
              : "Designed around zero food waste and transparent Hong Kong grocery pricing."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Step 1 — wide bento block (5 cols) */}
          <div className="md:col-span-5 rounded-3xl bg-white border border-stone-200 p-7 shadow-cafe flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-stone-500">Step 01</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  17 Cuisines · Top 50 EU
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                {zh ? "點選菜系與現有食材" : "Tap your cuisine & ingredients"}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {zh
                  ? "快選香港家常食材或歐洲 Top 10 經典配料、輸入首兩個字母即時搜尋，或直接拍一張雪櫃相。"
                  : "Quick-tap regional staples (Cantonese or European Top 10), type two letters to search 90+ items, or upload a fridge photo."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
              {["Butter · 牛油", "Olive Oil · 橄欖油", "Bok Choy · 白菜仔", "Parmigiano", "Firm Tofu · 豆腐"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    + {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Step 2 — warm secondary surface block (4 cols) */}
          <div className="md:col-span-4 rounded-3xl bg-stone-200/75 border border-stone-300/80 p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="label-caps text-brand-600">Step 02</span>
              <h3 className="text-xl font-bold text-stone-900">
                {zh ? "AI 度身設計 3 款食譜" : "3 tailored recipes + AI Sous-Chef"}
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                {zh
                  ? "嚴格保證用晒你揀嘅食材，提供香港本地替代建議，並由你自訂造型嘅 AI 大廚逐步帶住煮。"
                  : "Every suggestion incorporates 100% of your items, notes HK local substitutes, and guides you with built-in step timers."}
              </p>
            </div>
            <Link
              href="/chef-settings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              {zh ? "自訂你的 AI 大廚造型 →" : "Customise your AI Chef avatar →"}
            </Link>
          </div>

          {/* Step 3 — espresso accent block (3 cols) */}
          <div className="md:col-span-3 rounded-3xl bg-brand-500 text-stone-50 p-7 shadow-cafe flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="label-caps text-caramel-300">Step 03</span>
              <h3 className="text-xl font-bold">
                {zh ? "超市格價 · 一鍵落單" : "Compare 4 stores & checkout"}
              </h3>
              <p className="text-sm text-stone-200 leading-relaxed">
                {zh
                  ? "剔除屋企已有調味料，即時比較香港超市總價，選擇送貨或自取。"
                  : "Subtract what’s already in your pantry, pick the cheapest HK store, and choose delivery or pickup."}
              </p>
            </div>
            <div className="pt-2 border-t border-brand-400/30 flex items-center justify-between text-xs text-stone-200 font-mono">
              <span>Free delivery</span>
              <span>≥ HK$350</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Evaluator Role Switcher (Bento Strip) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-stone-100 border border-stone-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="label-caps text-brand-500">
                {zh ? "MVP 評審快速體驗" : "Demo Sandbox · Instant Role Switch"}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
                {zh ? "一鍵切換三種帳戶視角" : "Inspect all three portals without logging in"}
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              {zh ? "顧客 · 超市商戶 · 平台管理員" : "Customer · Store Partner · Platform Admin"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => switchDemoRole("CUSTOMER")}
              className="group p-5 rounded-2xl bg-white hover:bg-brand-500 hover:text-stone-50 border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-caramel-300">
                    Customer
                  </span>
                  <User className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
                </div>
                <h4 className="text-base font-bold mt-2">Alice Chan</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-200 mt-0.5">
                  customer@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-600 group-hover:text-stone-50 mt-4 inline-flex items-center gap-1">
                {zh ? "切換至顧客視角 →" : "Switch to Customer →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("STORE_PARTNER")}
              className="group p-5 rounded-2xl bg-white hover:bg-brand-500 hover:text-stone-50 border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-caramel-300">
                    Store Partner
                  </span>
                  <Store className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
                </div>
                <h4 className="text-base font-bold mt-2">ParkGrocer HK</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-200 mt-0.5">
                  store@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-600 group-hover:text-stone-50 mt-4 inline-flex items-center gap-1">
                {zh ? "切換至商戶後台 →" : "Switch to Partner →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("ADMIN")}
              className="group p-5 rounded-2xl bg-white hover:bg-brand-500 hover:text-stone-50 border border-stone-200 text-left transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-caramel-300">
                    Admin
                  </span>
                  <ShieldCheck className="w-4 h-4 text-stone-400 group-hover:text-stone-200" />
                </div>
                <h4 className="text-base font-bold mt-2">CookCart Admin</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-200 mt-0.5">
                  admin@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-600 group-hover:text-stone-50 mt-4 inline-flex items-center gap-1">
                {zh ? "切換至管理員 →" : "Switch to Admin →"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
