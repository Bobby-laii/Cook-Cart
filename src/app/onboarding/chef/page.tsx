"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Dices, Loader2, RotateCcw } from "lucide-react";
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
    setBubble(L("Hi, I'm your chef. Choose how I look, then we can start cooking.", "你好，我係你嘅大廚。揀好我嘅樣，我哋就可以開始煮嘢食。"));
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
    setBubble(L("A whole new me. Keep going until it feels right.", "全新嘅我！揀到啱心水為止。"));
  };

  const reset = () => {
    setConfig(initialConfig.current);
    setPopKey((k) => k + 1);
    setBubble(L("Back to the original recipe.", "返去原本嘅樣。"));
  };

  const displayName = chefName.trim() || L("Your chef", "你的大廚");
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

  const primaryBtn =
    "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand-500 px-6 text-[17px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60 sm:w-auto";
  const secondaryBtn =
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-[15px] font-bold text-stone-900 transition-colors hover:border-brand-300";
  const quietBtn =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[15px] font-bold text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-50 sm:w-auto";

  if (loading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 bg-stone-100 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {L("Preparing the kitchen...", "正在準備廚房...")}
      </div>
    );
  }

  /* ------------------------------ Step 3: Meet ------------------------------ */
  if (step === 3) {
    const goingToChat = nextUrl.startsWith("/chat");
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-stone-100 px-5 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <ChefAvatar config={config} size={220} className="cc-pop mx-auto h-48 w-48 rounded-full sm:h-56 sm:w-56" title={displayName} />
          <div>
            <h1 className="text-[32px] font-bold leading-tight text-stone-900">{L(`This is ${displayName}`, `呢位係 ${displayName}`)}</h1>
            <p className="mt-1 text-[15px] text-stone-500">{zh ? personalityInfo.labelZh : personalityInfo.label}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 text-left">
            <p className="text-[17px] leading-relaxed text-stone-900">{zh ? personalityInfo.greetingZh : personalityInfo.greeting}</p>
          </div>
          <button type="button" onClick={() => router.push(nextUrl)} className={primaryBtn}>
            {goingToChat ? L(`Chat with ${displayName}`, `同 ${displayName} 傾偈`) : L("Done", "完成")}
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------- Steps 1 & 2 layout --------------------------- */
  const title =
    step === 1
      ? isEditing
        ? L("Change your chef's look", "更改大廚造型")
        : L("Meet your chef", "認識你的大廚")
      : isEditing
        ? L("Name and personality", "名字與性格")
        : L("Give your chef a name", "為你的大廚取個名字");
  const intro =
    step === 1
      ? isEditing
        ? L("Pick any part to change it. The preview updates as you go.", "揀任何部分去改，預覽會即時更新。")
        : L(
            "Before your first chat, choose how your chef looks. You can change this any time in chef settings.",
            "第一次傾偈之前，先揀你大廚嘅樣。之後隨時可以喺大廚設定度更改。",
          )
      : L("Pick a name and how your chef talks to you.", "揀個名字，再揀大廚同你傾偈嘅風格。");

  return (
    <div className="min-h-screen bg-stone-100 px-5 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[14px] text-stone-500">{L(`Step ${step} of 2`, `第 ${step} 步，共 2 步`)}</p>
          <h1 className="mt-1 text-[32px] font-bold leading-tight text-stone-900 sm:text-[40px]">{title}</h1>
          <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-stone-500">{intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Live preview */}
          <aside className="lg:col-span-5">
            <div className="flex flex-col items-center rounded-3xl border border-stone-200 bg-stone-50 p-5 lg:sticky lg:top-6">
              <div className="mb-4 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-stone-100 px-4 py-3 text-center text-[15px] leading-snug text-stone-900">
                <span key={bubble} className="cc-fade-in inline-block">
                  {bubble}
                </span>
              </div>

              <div key={popKey} className="cc-pop">
                <ChefAvatar
                  config={config}
                  size={260}
                  className={`rounded-full ${step === 1 ? "h-44 w-44 sm:h-60 sm:w-60 lg:h-64 lg:w-64" : "h-36 w-36 sm:h-48 sm:w-48"}`}
                  title={displayName}
                />
              </div>

              <p className="mt-3 text-[22px] font-bold text-stone-900">{displayName}</p>
              {step === 2 && <p className="text-[14px] text-stone-500">{zh ? personalityInfo.labelZh : personalityInfo.label}</p>}

              {step === 1 && (
                <div className="mt-4 flex w-full gap-2 sm:w-auto">
                  <button type="button" onClick={randomize} className={`${secondaryBtn} flex-1 sm:flex-none`}>
                    <Dices
                      className={`h-5 w-5 text-brand-500 transition-transform duration-500 motion-reduce:transition-none ${diceSpin ? "rotate-[360deg]" : ""}`}
                      aria-hidden
                    />
                    {L("Surprise me", "隨機造型")}
                  </button>
                  <button type="button" onClick={reset} className={`${secondaryBtn} flex-1 sm:flex-none`}>
                    <RotateCcw className="h-5 w-5 text-stone-500" aria-hidden />
                    {L("Reset", "重設")}
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Editor column */}
          <div className="space-y-5 lg:col-span-7">
            {step === 1 ? (
              <ChefAvatarCustomizer value={config} onChange={handleChange} language={language} />
            ) : (
              <div className="space-y-7 rounded-3xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
                <div>
                  <label htmlFor="chef-name" className="mb-2 block text-[17px] font-bold text-stone-900">
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
                    placeholder={L("For example, Chef Oliver", "例如：Oliver 大廚")}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "chef-name-error" : undefined}
                    className="h-[52px] w-full rounded-[14px] border border-stone-300 bg-stone-50 px-4 text-[17px] text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  {error && (
                    <p id="chef-name-error" className="mt-2 text-[15px] font-bold text-danger">
                      {error}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(zh ? ["陳師傅", "Mei 大廚", "Oliver 大廚", "阿嫲"] : ["Chef Oliver", "Nonna Rosa", "Chef Mei", "Sous-chef Kai"]).map((n) => {
                      const active = chefName === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setChefName(n);
                            if (error) setError("");
                          }}
                          aria-pressed={active}
                          className={`min-h-[48px] rounded-full border-2 px-4 text-[15px] transition-colors ${
                            active ? "border-brand-500 bg-brand-500 font-bold text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-brand-300"
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-3 text-[17px] font-bold text-stone-900">{L("How your chef talks", "大廚嘅說話風格")}</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                          className={`rounded-[14px] border-2 p-4 text-left transition-colors ${
                            active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-stone-50 hover:border-brand-300"
                          }`}
                        >
                          <span className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[17px] font-bold text-stone-900">{zh ? p.labelZh : p.label}</span>
                            {active && (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                              </span>
                            )}
                          </span>
                          <span className="block text-[15px] leading-relaxed text-stone-500">{zh ? p.descriptionZh : p.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Footer actions: primary first on phones, on the right from sm up */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? (
                isEditing ? (
                  <button type="button" onClick={() => router.push(nextUrl)} className={quietBtn}>
                    {L("Cancel", "取消")}
                  </button>
                ) : (
                  <button type="button" onClick={skip} disabled={saving} className={quietBtn}>
                    {L("Skip for now", "稍後再設定")}
                  </button>
                )
              ) : (
                <button type="button" onClick={() => setStep(1)} className={quietBtn}>
                  {L("Back to the look", "返回外觀")}
                </button>
              )}

              {step === 1 ? (
                <button type="button" onClick={() => setStep(2)} className={primaryBtn}>
                  {L("Continue", "繼續")}
                </button>
              ) : (
                <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                  {saving && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
                  {saving ? L("Saving...", "儲存中...") : isEditing ? L("Save my chef", "儲存大廚") : L("Meet my chef", "認識我的大廚")}
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
    <Suspense fallback={<div className="min-h-screen bg-stone-100 p-10 text-center text-sm text-stone-500">Loading...</div>}>
      <ChefOnboardingContent />
    </Suspense>
  );
}

