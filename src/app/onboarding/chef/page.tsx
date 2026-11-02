"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Dices, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ChefAvatar } from "@/components/avatar/ChefAvatar";
import { ChefAvatarCustomizer } from "@/components/avatar/ChefAvatarCustomizer";
import {
  CHEF_PERSONALITIES,
  ChefAvatarConfig,
  ChefPersonalityId,
  DEFAULT_CHEF_AVATAR,
  isValidPersonality,
  parseChefAvatarConfig,
  randomChefAvatar,
} from "@/lib/avatar/chefAvatar";

type Step = 1 | 2 | 3;

/** Little reactions from the chef while you customise them. */
const REACTIONS: Partial<Record<keyof ChefAvatarConfig, { en: string[]; zh: string[] }>> = {
  hairStyle: { en: ["Fresh cut! Ready for service.", "Ooh, I like this hair.", "Stylish AND hygienic."], zh: ["新髮型！準備開工。", "嘩，呢個髮型幾好睇！", "型格又衛生！"] },
  hairColor: { en: ["Bold colour choice!", "That shade suits me."], zh: ["好大膽嘅顏色！", "呢個顏色好襯我。"] },
  outfit: { en: ["Looking like a Michelin-star chef!", "Dressed for the dinner rush."], zh: ["好似米芝蓮星級大廚！", "準備好應付晚市！"] },
  outfitColor: { en: ["Very sharp.", "This colour hides sauce stains... mostly."], zh: ["好醒目！", "呢個顏色唔怕汁漬……大概啦。"] },
  headwear: { en: ["A chef is nothing without the hat!", "Hat on, heat on."], zh: ["大廚點可以冇帽！", "帽子戴好，開火！"] },
  eyes: { en: ["I'm watching that pan closely.", "Eyes on the prize — dinner."], zh: ["我會好留意個鑊。", "目標：晚餐！"] },
  mouth: { en: ["Say cheese! (Parmesan, ideally.)", "Can't stop smiling."], zh: ["笑一個！", "忍唔住笑。"] },
  facialHair: { en: ["Très distingué!", "Very distinguished."], zh: ["好有型格！", "成熟穩重！"] },
  glasses: { en: ["Now I can read the tiny recipe print.", "Smart look!"], zh: ["而家睇食譜細字都清楚晒。", "好斯文！"] },
  skinTone: { en: ["Looking great!", "That's me!"], zh: ["好看！", "就係我啦！"] },
  backdrop: { en: ["Nice vibe!", "Love this setting."], zh: ["好有氣氛！", "鍾意呢個背景。"] },
};

function pickReaction(field: keyof ChefAvatarConfig, zh: boolean): string | null {
  const set = REACTIONS[field];
  if (!set) return null;
  const list = zh ? set.zh : set.en;
  return list[Math.floor(Math.random() * list.length)];
}

function safeNext(next: string | null): string {
  // Only allow same-origin relative paths to avoid open redirects.
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/onboarding")) return next;
  return "/chat";
}

function ChefOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeNext(searchParams.get("next"));
  const { user, loading, refreshUser } = useAuth();
  const { language } = useLanguage();
  const zh = language === "zh-HK";
  const L = (en: string, zhText: string) => (zh ? zhText : en);

  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<ChefAvatarConfig>(DEFAULT_CHEF_AVATAR);
  const [chefName, setChefName] = useState("");
  const [personality, setPersonality] = useState<ChefPersonalityId>("friendly");
  const [bubble, setBubble] = useState<string>("");
  const [popKey, setPopKey] = useState(0);
  const [diceSpin, setDiceSpin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initialised = useRef(false);
  const initialConfig = useRef<ChefAvatarConfig>(DEFAULT_CHEF_AVATAR);

  const isEditing = user?.onboardingCompleted === true;

  // Seed the editor from the user's saved chef once the session has loaded.
  useEffect(() => {
    if (loading || initialised.current) return;
    initialised.current = true;
    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/onboarding/chef")}`);
      return;
    }
    const saved = parseChefAvatarConfig(user.chefAvatarConfig);
    const start = saved ?? DEFAULT_CHEF_AVATAR;
    setConfig(start);
    initialConfig.current = start;
    const savedName = user.chefName && user.chefName !== "Chef Cart" ? user.chefName : "";
    setChefName(savedName);
    if (isValidPersonality(user.chefPersonality)) setPersonality(user.chefPersonality);
  }, [loading, user, router]);

  useEffect(() => {
    setBubble(L("Hi! Design me however you like — I'll be your kitchen buddy.", "你好！隨你喜歡打扮我——我會係你嘅廚房好拍檔。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleChange = (next: ChefAvatarConfig, field: keyof ChefAvatarConfig) => {
    setConfig(next);
    setPopKey((k) => k + 1);
    const r = pickReaction(field, zh);
    if (r) setBubble(r);
  };

  const randomize = () => {
    setConfig(randomChefAvatar());
    setPopKey((k) => k + 1);
    setDiceSpin(true);
    setTimeout(() => setDiceSpin(false), 500);
    setBubble(L("Surprise! A whole new me.", "驚喜！全新嘅我！"));
  };

  const reset = () => {
    setConfig(initialConfig.current);
    setPopKey((k) => k + 1);
    setBubble(L("Back to the original recipe.", "返去原本嘅樣。"));
  };

  const displayName = chefName.trim() || L("Your Chef", "你的大廚");
  const personalityInfo = CHEF_PERSONALITIES.find((p) => p.id === personality) ?? CHEF_PERSONALITIES[0];

  const save = async () => {
    const name = chefName.trim();
    if (!name) {
      setError(L("Please give your chef a name.", "請為你的大廚取個名字。"));
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chefName: name,
          chefPersonality: personality,
          chefAvatarConfig: config,
          completeOnboarding: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refreshUser();
      setStep(3);
    } catch (e: any) {
      setError(e?.message || L("Could not save. Please try again.", "儲存失敗，請再試一次。"));
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completeOnboarding: true }),
      });
      await refreshUser();
    } finally {
      setSaving(false);
      router.push(nextUrl);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-stone-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> {L("Preparing the kitchen...", "正在準備廚房...")}
      </div>
    );
  }

  /* ------------------------------ Step 3: Meet ------------------------------ */
  if (step === 3) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-amber-300/40 blur-2xl animate-pulse" />
            <ChefAvatar config={config} size={220} className="relative rounded-full shadow-xl ring-8 ring-white cc-pop" title={displayName} />
          </div>
          <div className="relative bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-left">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-l border-t border-stone-200" />
            <p className="text-xs font-bold text-amber-700 mb-1">{displayName}</p>
            <p className="text-stone-800 leading-relaxed">{zh ? personalityInfo.greetingZh : personalityInfo.greeting}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(nextUrl)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg transition group"
          >
            {L(`Start cooking with ${displayName}`, `開始與 ${displayName} 一齊煮`)}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------- Steps 1 & 2 layout --------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header + progress */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isEditing ? L("Chef Studio", "大廚工作室") : L("Welcome to CookCart", "歡迎來到 CookCart")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
              {step === 1 ? L("Design your personal chef", "設計你的專屬大廚") : L("Give your chef a personality", "為大廚注入個性")}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                    step > n ? "bg-emerald-500 text-white" : step === n ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {step > n ? <Check className="w-4 h-4" /> : n}
                </span>
                <span className={step === n ? "text-stone-900" : "text-stone-400"}>{n === 1 ? L("Look", "外觀") : L("Identity", "身份")}</span>
                {n === 1 && <span className="w-8 h-px bg-stone-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live preview */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col items-center">
              {/* speech bubble */}
              <div className="relative w-full mb-5 min-h-[56px] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-stone-800 text-center">
                <span key={bubble} className="cc-fade-in inline-block">{bubble}</span>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-amber-50 border-r border-b border-amber-200" />
              </div>

              <div className="relative">
                <div className="absolute inset-4 rounded-full bg-amber-300/30 blur-2xl" />
                <div key={popKey} className="cc-pop relative">
                  <ChefAvatar config={config} size={step === 1 ? 260 : 200} className="rounded-full shadow-lg ring-8 ring-white" title={displayName} />
                </div>
              </div>

              <p className="mt-4 text-lg font-black text-stone-900">{displayName}</p>
              {step === 2 && <p className="text-xs text-amber-700 font-semibold">{personalityInfo.emoji} {zh ? personalityInfo.labelZh : personalityInfo.label}</p>}

              {step === 1 && (
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={randomize}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition"
                  >
                    <Dices className={`w-4 h-4 transition-transform duration-500 ${diceSpin ? "rotate-[360deg]" : ""}`} />
                    {L("Randomize", "隨機造型")}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {L("Reset", "重設")}
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Editor column */}
          <div className="lg:col-span-7 space-y-5">
            {step === 1 ? (
              <ChefAvatarCustomizer value={config} onChange={handleChange} language={language} />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-7">
                <div>
                  <label htmlFor="chef-name" className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    {L("Chef name", "大廚名字")}
                  </label>
                  <input
                    id="chef-name"
                    type="text"
                    value={chefName}
                    onChange={(e) => {
                      setChefName(e.target.value);
                      if (error) setError("");
                    }}
                    maxLength={30}
                    autoFocus
                    placeholder={L("e.g. Chef Oliver, Nonna Rosa, Sous-Chef Kai", "例如：Oliver 大廚、陳師傅、Kai 副廚")}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 text-lg font-semibold"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(zh ? ["陳師傅", "Mei 大廚", "Oliver 大廚", "阿嫲"] : ["Chef Oliver", "Nonna Rosa", "Chef Mei", "Sous-Chef Kai"]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setChefName(n)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 transition"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">{L("Cooking personality", "烹飪性格")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CHEF_PERSONALITIES.map((p) => {
                      const active = personality === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPersonality(p.id);
                            setBubble(zh ? p.greetingZh : p.greeting);
                          }}
                          aria-pressed={active}
                          className={`text-left p-4 rounded-xl border transition ${
                            active ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/30 shadow-sm" : "border-stone-200 hover:border-amber-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-stone-900">
                              {p.emoji} {zh ? p.labelZh : p.label}
                            </span>
                            {active && (
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">{zh ? p.descriptionZh : p.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3">
              {step === 1 ? (
                isEditing ? (
                  <button type="button" onClick={() => router.push(nextUrl)} className="text-sm font-semibold text-stone-500 hover:text-stone-800 transition">
                    {L("Cancel", "取消")}
                  </button>
                ) : (
                  <button type="button" onClick={skip} disabled={saving} className="text-sm font-semibold text-stone-500 hover:text-stone-800 transition disabled:opacity-50">
                    {L("Skip for now", "稍後再設定")}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {L("Back to look", "返回外觀")}
                </button>
              )}

              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md transition group"
                >
                  {L("Next: name your chef", "下一步：為大廚命名")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md transition disabled:opacity-60 group"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {saving ? L("Saving...", "儲存中...") : isEditing ? L("Save my chef", "儲存大廚") : L("Confirm & meet my chef", "確認並認識我的大廚")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChefOnboardingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-stone-500">Loading...</div>}>
      <ChefOnboardingContent />
    </Suspense>
  );
}

