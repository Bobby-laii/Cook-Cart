"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ShieldAlert } from "lucide-react";
import { BonTasteLogo } from "@/components/BonTasteLogo";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <BonTasteLogo variant="footer" />
            <p className="text-sm text-stone-400 max-w-md">
              {t("tagline")}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800 text-xs text-amber-400 border border-stone-700">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t("legalNotice")}</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              CookCart Features
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/chat" className="hover:text-white transition">
                  {t("navChat")}
                </Link>
              </li>
              <li>
                <Link href="/my-recipes" className="hover:text-white transition">
                  {t("navMyRecipes")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  {t("navCart")}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  {t("navOrders")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              Hong Kong Legal
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  {t("termsOfService")}
                </Link>
              </li>
              <li>
                <span className="text-xs text-stone-500">
                  Target Market: Hong Kong SAR (HKD)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} {t("footerCopyright")}</p>
          <p>AI Cooking & Supermarket Aggregation MVP</p>
        </div>
      </div>
    </footer>
  );
}
