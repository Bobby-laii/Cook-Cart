"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CONTINENT_CUISINES, ContinentCategory, CountryCuisine } from "@/config/cuisineHierarchy";
import {
  Globe2,
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  ChevronRight,
  Flame,
  Clock,
  Compass,
} from "lucide-react";

export default function ExploreCuisinesPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [selectedContinent, setSelectedContinent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCountry, setActiveCountry] = useState<CountryCuisine | null>(null);

  // Filter continents and countries
  const filteredContinents = CONTINENT_CUISINES.map((continent) => {
    if (selectedContinent !== "all" && continent.id !== selectedContinent) {
      return null;
    }

    const filteredCountries = continent.countries.filter((country) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        country.name.toLowerCase().includes(q) ||
        country.nameZh.includes(q) ||
        country.popularDishes.some((d) => d.toLowerCase().includes(q))
      );
    });

    if (filteredCountries.length === 0) return null;
    return { ...continent, countries: filteredCountries };
  }).filter(Boolean) as ContinentCategory[];

  const handleStartChatWithCuisine = (country: CountryCuisine) => {
    // Navigate to chat pre-filled with this cuisine
    const cuisineParam = encodeURIComponent(country.spoonacularCuisine || country.name);
    router.push(`/chat?cuisine=${cuisineParam}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-stone-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            {language === "zh-HK" ? "環球美食分類庫" : "Global Recipe Catalogue"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
            {language === "zh-HK" ? "按大洲與國家探索全球料理" : "Explore World Cuisines by Continent & Country"}
          </h1>
          <p className="text-base text-stone-600 leading-relaxed">
            {language === "zh-HK"
              ? "從亞洲鑊氣快炒、歐洲經典慢燉到南美直火炭烤，系統化瀏覽世界各國特色菜譜，一鍵呼叫 AI 大廚親身教授！"
              : "Structured by continent and country. Browse signature dishes, explore regional ingredients, and chat with your AI Chef to cook them!"}
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "zh-HK"
                  ? "搜尋國家、菜系或菜式 (例如: Spain, Paella, 日本, 泰國)..."
                  : "Search country, cuisine, or dish (e.g. Spain, Paella, Pasta, Tacos)..."
              }
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-900 text-sm"
            />
          </div>
        </div>

        {/* Continent Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setSelectedContinent("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              selectedContinent === "all"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {language === "zh-HK" ? "全部大洲 (All Continents)" : "All Continents"}
          </button>
          {CONTINENT_CUISINES.map((continent) => (
            <button
              key={continent.id}
              onClick={() => setSelectedContinent(continent.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                selectedContinent === continent.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span>{continent.emoji}</span>
              <span>{language === "zh-HK" ? continent.nameZh : continent.name}</span>
            </button>
          ))}
        </div>

        {/* Continents Grid */}
        <div className="space-y-12">
          {filteredContinents.map((continent) => (
            <section key={continent.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80">
              {/* Continent Header Folder */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-100">
                    {continent.emoji}
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                      {language === "zh-HK" ? continent.nameZh : continent.name}
                      <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {continent.countries.length} {language === "zh-HK" ? "個國家/地區" : "Countries"}
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      {language === "zh-HK" ? continent.descriptionZh : continent.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Country Cards (Sub-folders) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {continent.countries.map((country) => (
                  <div
                    key={country.id}
                    className="flex flex-col justify-between p-5 rounded-2xl border border-stone-200/80 hover:border-amber-300 hover:shadow-md transition bg-gradient-to-br from-white to-stone-50/50 group"
                  >
                    <div>
                      {/* Country Flag & Title */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{country.flag}</span>
                          <div>
                            <h3 className="font-bold text-stone-900 group-hover:text-amber-700 transition">
                              {language === "zh-HK" ? country.nameZh : country.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {language === "zh-HK" ? country.descriptionZh : country.description}
                      </p>

                      {/* Signature Dishes */}
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {language === "zh-HK" ? "代表名菜" : "Signature Dishes"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {country.popularDishes.map((dish, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 hover:bg-amber-100/60 text-stone-700 transition"
                            >
                              {dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => handleStartChatWithCuisine(country)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        {language === "zh-HK" ? "讓 AI 大廚教我煮" : "Cook with AI Chef"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

