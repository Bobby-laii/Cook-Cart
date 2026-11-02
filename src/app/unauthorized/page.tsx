"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function UnauthorizedPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">
          {language === "zh-HK" ? "權限不足" : "Access Restricted"}
        </h2>
        <p className="text-sm text-stone-600">
          {language === "zh-HK"
            ? "您目前的帳號身分未能瀏覽此管理頁面。請使用頂部「Demo 角色切換」切換為「合作超市」或「管理員」。"
            : "Your account does not have permission to access this portal. Please use the top 'Demo Role Switcher' to switch to Store Partner or Admin."}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "zh-HK" ? "返回首頁" : "Back to Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
