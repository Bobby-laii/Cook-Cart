"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { UtensilsCrossed, AlertCircle, ArrowRight } from "lucide-react";

function LoginPageContent() {
  const { login, switchDemoRole } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-brand-500 items-center justify-center text-white shadow-md">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            {language === "zh-HK" ? "登入 CookCart" : "Sign In to CookCart"}
          </h2>
          <p className="text-sm text-stone-600">
            {language === "zh-HK"
              ? "登入以儲存食譜，同你嘅大廚傾偈"
              : "Sign in to save recipes and chat with your chef"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@cookcart.hk"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? t("loading") : t("navLogin")}
          </button>

          <div className="pt-2 text-center text-xs text-stone-600">
            {language === "zh-HK" ? "未有帳號？" : "Don't have an account?"}{" "}
            <Link href="/register" className="text-brand-600 font-bold hover:underline">
              {language === "zh-HK" ? "立即免費註冊" : "Register now"}
            </Link>
          </div>
        </form>

        {/* Quick Demo Logins */}
        <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 space-y-2">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider text-center">
            ⚡ Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => switchDemoRole("CUSTOMER")}
              className="px-2 py-2 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 transition"
            >
              👤 Customer
            </button>
            <button
              onClick={() => switchDemoRole("STORE_PARTNER")}
              className="px-2 py-2 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 transition"
            >
              🏪 Partner
            </button>
            <button
              onClick={() => switchDemoRole("ADMIN")}
              className="px-2 py-2 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 transition"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
