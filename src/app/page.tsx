"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { BonTasteLogo, BonTastePlateIcon } from "@/components/BonTasteLogo";
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
 * Homepage designed with the `design-clean` skill (.agents/skills/design-clean)
 * tailored to the BON TASTE brand identity:
 *   - Surface #FFFFFF on #F8F9FA porcelain canvas, ample whitespace, 8pt grid
 *   - Primary slate-blue #4E7B94 ("T A S T E") & deep midnight navy #0F2A3D ("B O N")
 *   - Double hairline rule motif & concentric plate "O" emblem from the logo
 *   - Roboto body, Poppins headings, Cormorant Garamond editorial display, Inconsolata label-caps
 */
export default function HomePage() {
  const { t, language } = useLanguage();
  const { switchDemoRole } = useAuth();
  const zh = language === "zh-HK";

  return (
    <div className="space-y-16 pb-20">
      {/* ─── Clean Hero Section with Official BON TASTE Lockup ─── */}
      <section className="bg-white border-b border-stone-200 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (7 cols): Brand Lockup + Clean Editorial Copy */}
            <div className="lg:col-span-7 space-y-8">
              {/* Official BON TASTE Double-Rule Logo Lockup */}
              <div className="space-y-4">
                <BonTasteLogo variant="hero" />
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 rounded-full bg-fresh-600" />
                  <span className="label-caps text-stone-500">
                    {zh
                      ? "香港 AI 智能料理與超市格價禮賓平台"
                      : "HONG KONG · AI CULINARY & GROCERY CONCIERGE"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold text-stone-900 tracking-tight leading-[1.2]">
                  {zh ? (
                    <>
                      以現有食材，烹調恰到好處的日常品味。
                      <span className="block text-brand-500 font-normal mt-1">
                        AI 度身設計食譜 · 四大超市即時格價。
                      </span>
                    </>
                  ) : (
                    <>
                      Refined everyday cooking, tailored to what you have.
                      <span className="block text-brand-500 font-normal mt-1">
                        Zero-waste AI recipes & live HK grocery comparison.
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-base text-stone-600 max-w-xl leading-relaxed">
                  {zh
                    ? "選擇菜系、點選或拍照上載雪櫃現有食材。BON TASTE 嚴格保證將您指定的所有食材全數入饌，並即時比對香港各大超市價格，一鍵直送或自取。"
                    : "Select a cuisine, tap regional ingredients, or upload a photo of your fridge. BON TASTE crafts 3 dishes using 100% of your items and compares prices across Hong Kong supermarkets."}
                </p>
              </div>

              {/* Clean 8pt-grid Action Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-stone-900 hover:bg-brand-600 text-white font-medium text-sm sm:text-base shadow-clean transition"
                >
                  <Sparkles className="w-4 h-4 text-brand-300" />
                  {zh ? "開始 AI 煮食諮詢" : "Start AI Cooking Chat"}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-white hover:bg-stone-50 text-stone-900 font-medium text-sm sm:text-base border border-stone-300 transition"
                >
                  <Compass className="w-4 h-4 text-brand-500" />
                  {zh ? "探索環球菜系" : "Explore Cuisines"}
                </Link>

                <Link
                  href="/my-recipes"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium text-sm transition"
                >
                  <ChefHat className="w-4 h-4 text-brand-500" />
                  {t("navMyRecipes")}
                </Link>
              </div>

              {/* Three Core Guarantees */}
              <div className="pt-6 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0" />
                  <span>{zh ? "100% 用盡指定食材" : "Uses every entered ingredient"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{zh ? "香港 4 大超市即時格價" : "4 HK supermarkets compared"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{zh ? "沉浸式步驟計時烹調" : "Guided step-by-step timers"}</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Clean Porcelain Tasting Menu & Basket Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl bg-white border border-stone-200 shadow-clean-lg p-6 sm:p-8 space-y-6">
                {/* Card Header with BON TASTE Plate Emblem */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BonTastePlateIcon size={32} />
                      <div>
                        <span className="label-caps text-brand-500 block">
                          {zh ? "今日主廚餐單預覽" : "LIVE MENU PREVIEW"}
                        </span>
                        <h2 className="font-serif text-xl font-semibold text-stone-900 tracking-wide">
                          BON TASTE · Menu du Jour
                        </h2>
                      </div>
                    </div>
                    <span className="label-caps px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      HKD $
                    </span>
                  </div>
                  <div className="bon-double-rule" />
                </div>

                {/* Step 01: Selected Ingredients */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-stone-500">
                      {zh ? "01 · 您現有的食材" : "01 · Selected Ingredients"}
                    </span>
                    <span className="font-mono text-xs text-fresh-600 font-semibold">
                      3 / 3 matched
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded bg-stone-50 text-stone-900 text-xs font-medium border border-stone-200">
                      {zh ? "雞腿肉 · Chicken Thighs" : "Chicken Thighs"}
                    </span>
                    <span className="px-3 py-1 rounded bg-stone-50 text-stone-900 text-xs font-medium border border-stone-200">
                      {zh ? "白菜仔 · Bok Choy" : "Bok Choy"}
                    </span>
                    <span className="px-3 py-1 rounded bg-stone-50 text-stone-900 text-xs font-medium border border-stone-200">
                      {zh ? "大蒜 · Garlic" : "Garlic"}
                    </span>
                  </div>
                </div>

                {/* Step 02: AI Dish Match */}
                <div className="p-4 rounded-lg bg-brand-50/70 border border-brand-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-brand-600">
                      {zh ? "02 · AI 推薦菜式" : "02 · Recommended Dish"}
                    </span>
                    <span className="font-mono text-xs text-stone-500">20 mins · Easy</span>
                  </div>
                  <p className="font-display font-semibold text-stone-900 text-sm sm:text-base">
                    {zh
                      ? "蒜香白菜嫩煎雞腿"
                      : "Pan-Seared Garlic Chicken Thighs & Baby Bok Choy"}
                  </p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    {zh
                      ? "✓ 全數入饌 3 款指定食材 · 額外僅需生抽及紹興酒"
                      : "✓ Incorporates all 3 ingredients; only needs light soy sauce & Shaoxing wine"}
                  </p>
                </div>

                {/* Step 03: Supermarket Comparison */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="label-caps text-stone-500">
                      {zh ? "03 · 香港超市即時格價" : "03 · Store Price Comparison"}
                    </span>
                    <span className="font-mono text-xs font-semibold text-fresh-600">
                      {zh ? "最抵節省 18%" : "Save 18%"}
                    </span>
                  </div>
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden text-xs">
                    <div className="flex justify-between items-center py-2.5 px-3.5 bg-stone-50 font-semibold text-stone-900">
                      <span>WellMart HK · {zh ? "最優惠" : "Best Price"}</span>
                      <span className="font-mono">HK$ 48.50</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 bg-white text-stone-600">
                      <span>ParkGrocer HK</span>
                      <span className="font-mono">HK$ 52.00</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/chat"
                  className="w-full py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold tracking-wider uppercase text-center transition block"
                >
                  {zh ? "立即輸入你的食材體驗 →" : "Compose Your Menu Now →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Clean 3-Column Workflow Section (8pt Baseline Grid) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="label-caps text-brand-500">
                {zh ? "精簡三步流程" : "THE BON TASTE WORKFLOW"}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
                {zh ? "簡潔、精準，由雪櫃直達餐桌" : "Minimal, precise, from pantry to plate"}
              </h2>
            </div>
            <p className="text-sm text-stone-600 max-w-md">
              {zh
                ? "零多餘干擾，專注於食材原味與最透明的香港超市格價。"
                : "Clutter-free planning focused on culinary quality and transparent grocery pricing."}
            </p>
          </div>
          <div className="bon-double-rule" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 01 */}
          <div className="rounded-xl bg-white border border-stone-200 p-6 sm:p-8 shadow-clean flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-brand-500">01 / INPUT</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                  17 Cuisines · Top 50 EU
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900">
                {zh ? "選取菜系與現有食材" : "Select Cuisine & Ingredients"}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {zh
                  ? "一鍵快選中歐各國代表食材（包括歐洲權威 Top 10 配料）、輸入首兩個字母即時搜尋，或上載雪櫃相片。"
                  : "Quick-tap regional staples (including the Top 10 European benchmark), type two letters to search 90+ items, or snap your fridge."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-stone-100">
              {["Butter · 牛油", "Olive Oil · 橄欖油", "Parmigiano", "Bok Choy · 白菜仔"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="px-2.5 py-1 rounded bg-stone-50 border border-stone-200 text-stone-700 text-xs"
                  >
                    + {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Card 02 */}
          <div className="rounded-xl bg-white border border-stone-200 p-6 sm:p-8 shadow-clean flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-brand-500">02 / CURATION</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                  Zero Waste
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900">
                {zh ? "AI 主廚度身設計三款食譜" : "3 Tailored Recipes & Guided Timers"}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {zh
                  ? "保證 100% 用盡您輸入的食材，附上香港本地替代食材建議，並提供逐步互動計時烹調模式。"
                  : "Every dish uses 100% of your entered items, suggests Hong Kong local substitutes, and guides you step by step with built-in timers."}
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100">
              <Link
                href="/chef-settings"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-stone-900 transition"
              >
                {zh ? "自訂專屬 AI 主廚造型 →" : "Personalize your AI Chef companion →"}
              </Link>
            </div>
          </div>

          {/* Card 03 */}
          <div className="rounded-xl bg-white border border-stone-200 p-6 sm:p-8 shadow-clean flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-brand-500">03 / FULFILLMENT</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-fresh-50 text-fresh-700 border border-fresh-100">
                  4 HK Stores
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-stone-900">
                {zh ? "超市即時格價與一鍵買齊" : "Compare Supermarkets & Order"}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {zh
                  ? "自動扣除家中已有材料，即時比較香港各大超市總價，選擇送貨上門或門市自取。"
                  : "Check off pantry items you already own, compare live basket totals across Hong Kong supermarkets, and choose delivery or pickup."}
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>{zh ? "免運費門檻" : "Free delivery"}</span>
              <span className="text-stone-900 font-semibold">≥ HK$ 350</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Clean Role Switcher Strip for MVP Evaluation ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border border-stone-200 p-6 sm:p-8 shadow-clean">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-stone-200">
            <div>
              <span className="label-caps text-brand-500">
                {zh ? "MVP 評審快速體驗" : "DEMO SANDBOX · ROLE SWITCHER"}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-stone-900 mt-0.5">
                {zh ? "一鍵切換三種平台身分" : "Test Customer, Partner, and Admin views instantly"}
              </h3>
            </div>
            <span className="font-mono text-xs text-stone-500">
              {zh ? "免密碼即時切換" : "One-click session switch"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <button
              onClick={() => switchDemoRole("CUSTOMER")}
              className="group p-5 rounded-lg bg-stone-50 hover:bg-stone-900 hover:text-white border border-stone-200 text-left transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-brand-300">
                    CUSTOMER
                  </span>
                  <User className="w-4 h-4 text-stone-400 group-hover:text-stone-300" />
                </div>
                <h4 className="font-display text-base font-semibold mt-2">Alice Chan</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-300 mt-0.5">
                  customer@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-medium text-brand-600 group-hover:text-white mt-4 inline-flex items-center gap-1">
                {zh ? "切換至顧客視角 →" : "Switch to Customer →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("STORE_PARTNER")}
              className="group p-5 rounded-lg bg-stone-50 hover:bg-stone-900 hover:text-white border border-stone-200 text-left transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-brand-300">
                    STORE PARTNER
                  </span>
                  <Store className="w-4 h-4 text-stone-400 group-hover:text-stone-300" />
                </div>
                <h4 className="font-display text-base font-semibold mt-2">ParkGrocer HK</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-300 mt-0.5">
                  store@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-medium text-brand-600 group-hover:text-white mt-4 inline-flex items-center gap-1">
                {zh ? "切換至商戶後台 →" : "Switch to Partner →"}
              </span>
            </button>

            <button
              onClick={() => switchDemoRole("ADMIN")}
              className="group p-5 rounded-lg bg-stone-50 hover:bg-stone-900 hover:text-white border border-stone-200 text-left transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-brand-500 group-hover:text-brand-300">
                    ADMIN
                  </span>
                  <ShieldCheck className="w-4 h-4 text-stone-400 group-hover:text-stone-300" />
                </div>
                <h4 className="font-display text-base font-semibold mt-2">BON TASTE Admin</h4>
                <p className="font-mono text-xs text-stone-500 group-hover:text-stone-300 mt-0.5">
                  admin@cookcart.hk
                </p>
              </div>
              <span className="text-xs font-medium text-brand-600 group-hover:text-white mt-4 inline-flex items-center gap-1">
                {zh ? "切換至管理員 →" : "Switch to Admin →"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
