"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BonTasteLogo } from "@/components/BonTasteLogo";

export function Footer() {
  const { t, language } = useLanguage();
  const zh = language === "zh-HK";

  const links = [
    { href: "/", label: zh ? "餐牌" : "Menu" },
    { href: "/chat", label: zh ? "問大廚" : "Ask the chef" },
    { href: "/my-recipes", label: t("navMyRecipes") },
    { href: "/privacy", label: t("privacyPolicy") },
    { href: "/terms", label: t("termsOfService") },
  ];

  // Phones get the bottom tab bar instead; a footer only appears from md up.
  return (
    <footer className="hidden md:block mt-auto border-t border-stone-200 bg-stone-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 grid gap-8 grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 max-w-md">
          <BonTasteLogo />
          <p className="text-sm text-stone-500">
            {zh ? "揀一道菜，跟住大廚一步步煮，慢慢享受。" : "Pick a dish, cook it step by step with your chef, and take your time."}
          </p>
          <p className="text-sm text-stone-500">
            {zh
              ? "Bon Taste 目前為試用版本。食譜由 AI 建議時會清楚標示，請自行確保食物煮熟。"
              : "Bon Taste is an early version. AI-suggested recipes are labelled; always make sure food is cooked through."}
          </p>
          <p className="text-sm text-stone-500">© {new Date().getFullYear()} Bon Taste</p>
        </div>

        <ul className="grid grid-cols-2 gap-x-8 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center min-h-10 rounded-md text-stone-600 hover:text-brand-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
