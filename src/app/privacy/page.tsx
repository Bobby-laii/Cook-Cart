"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          Hong Kong Legal Review Required Before Production Launch
        </div>
        <h1 className="text-3xl font-black text-stone-900">
          {language === "zh-HK" ? "私隱政策 (香港特別行政區)" : "Privacy Policy (Hong Kong SAR)"}
        </h1>
        <p className="text-xs text-stone-500">Last updated: October 2026 (CookCart MVP)</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 text-sm text-stone-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">1. Data Collection & Purpose</h2>
          <p>
            CookCart collects only information necessary to deliver recipe recommendations and facilitate grocery deliveries within the Hong Kong Special Administrative Region, conforming with the Personal Data (Privacy) Ordinance (Cap. 486).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">2. Dietary & Health Information Privacy</h2>
          <p>
            Dietary restrictions, food preferences, and allergy flags provided by users are treated as confidential. This data is strictly accessible only by the account holder and platform system administrators. It is never sold or transferred to advertisers or third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">3. Artificial Intelligence Processing</h2>
          <p>
            When utilizing CookCart AI culinary suggestions, only ingredient names, selected cuisine, and cooking equipment are processed by the AI engine. Personally identifiable details (such as your delivery address, phone number, and name) are strictly stripped and never transmitted to the language model.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">4. Payment Information</h2>
          <p>
            CookCart MVP utilizes a mock payment simulation. In future production releases, credit card information will be processed via PCI-DSS compliant third-party payment gateways and will never be stored on our servers.
          </p>
        </section>
      </div>
    </div>
  );
}
