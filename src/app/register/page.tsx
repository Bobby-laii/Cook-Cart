"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { UtensilsCrossed, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dietary, setDietary] = useState("");
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          dietaryRestrictions: dietary,
          allergies,
          preferredLanguage: language,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        await refreshUser();
        // First-time users go straight to designing their personal chef.
        router.push("/onboarding/chef?next=/chat");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Network error");
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
            {language === "zh-HK" ? "建立 CookCart 帳號" : "Create your CookCart Account"}
          </h2>
          <p className="text-sm text-stone-600">
            {language === "zh-HK"
              ? "加入香港 AI 買餸社群，解鎖個人化食譜與格價"
              : "Join Hong Kong's AI cooking community for custom meals & shopping"}
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Chan"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.hk"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Password (Min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Dietary Restrictions (Optional)
            </label>
            <input
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. Vegetarian, Halal, None"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Food Allergies (Optional - kept strictly private)
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Peanuts, Shellfish, None"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? t("loading") : t("navRegister")}
          </button>

          <div className="pt-2 text-center text-xs text-stone-600">
            {language === "zh-HK" ? "已有帳號？" : "Already have an account?"}{" "}
            <Link href="/login" className="text-brand-600 font-bold hover:underline">
              {language === "zh-HK" ? "點此登入" : "Sign in here"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
