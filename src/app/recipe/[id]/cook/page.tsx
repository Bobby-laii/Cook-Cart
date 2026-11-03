"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";
import { convertAmount, convertTemperatures } from "@/lib/units";
import { useUnitSystem } from "@/lib/useUnitSystem";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { MEALDB_ID_PREFIX } from "@/lib/recipes/mealdb";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sun,
} from "lucide-react";

interface StepTimer {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
}

const DEFAULT_FALLBACK_DISH: DishSuggestion = {
  id: "demo_cantonese_chicken",
  title: "Cantonese Steamed Chicken with Shiitake & Shaoxing Wine",
  titleZh: "粵式古法香菇蒸滑雞",
  cuisine: "Cantonese",
  cookTimeMinutes: 25,
  difficulty: "Easy",
  servings: 2,
  description:
    "A beloved Cantonese comfort food classic featuring velvety tender chicken infused with dried shiitake mushrooms, ginger, and Shaoxing wine.",
  descriptionZh: "香港經典家常名菜，雞肉嫩滑多汁，香菇鮮香四溢，薑絲酒香撲鼻。",
  usedUserIngredients: ["Chicken Thigh Fillets", "Fresh Shiitake Mushrooms", "Ginger", "Spring Onions"],
  extraIngredientsNeeded: [
    { name: "Shaoxing Cooking Rice Wine", nameZh: "紹興花雕廚酒", amount: 1, unit: "tbsp" },
    { name: "Lee Kum Kee Premium Light Soy Sauce", nameZh: "生抽", amount: 1.5, unit: "tbsp" },
    { name: "Pure Toasted Sesame Oil", nameZh: "黑芝麻油", amount: 1, unit: "tsp" },
    { name: "Pure Cornstarch", nameZh: "生粉", amount: 1, unit: "tbsp" },
  ],
  estimatedCostHkd: 52.0,
  availabilityNote: "All ingredients available in stock at HK supermarkets.",
  steps: [
    {
      step: 1,
      title: "Slice & Velvet the Chicken",
      titleZh: "切塊與醃製鎖汁",
      text: "Cut chicken thighs into bite-sized pieces. In a bowl, toss with ginger slivers, light soy sauce, Shaoxing wine, and cornstarch until evenly coated. Let marinate for 10 minutes.",
      textZh: "雞腿肉切適口塊狀，與薑絲、生抽、花雕酒及生粉抓勻醃製10分鐘。",
      timerSeconds: 600,
    },
    {
      step: 2,
      title: "Arrange on Steaming Plate",
      titleZh: "平鋪擺盤不重疊",
      text: "Spread the marinated chicken and sliced shiitake mushrooms in a single flat layer on a heatproof shallow dish so the steam circulates evenly.",
      textZh: "將雞肉與香菇平鋪在耐熱蒸碟上（盡量不要重疊），讓蒸汽均勻穿透。",
      timerSeconds: 120,
    },
    {
      step: 3,
      title: "High-Heat Steam",
      titleZh: "大火隔水清蒸",
      text: "Bring water in your wok or steamer to a rolling boil. Place the dish inside, cover tightly, and steam over high heat for 12 minutes until the juices run clear.",
      textZh: "蒸鍋水滾後放入蒸碟，加蓋大火隔水清蒸12分鐘至雞肉熟透嫩滑。",
      timerSeconds: 720,
    },
    {
      step: 4,
      title: "Garnish with Scallions & Serve",
      titleZh: "撒蔥淋麻油出鍋",
      text: "Drizzle a teaspoon of toasted sesame oil, scatter fresh spring onions on top, and serve steaming hot with jasmine rice!",
      textZh: "淋上少許麻油，撒上翠綠蔥花，趁熱伴白飯享用！",
    },
  ],
};

export default function StepByStepCookingPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const zh = language === "zh-HK";
  const L = (en: string, zhText: string) => (zh ? zhText : en);

  const [dish, setDish] = useState<DishSuggestion | null>(null);
  // Same metric/US choice the cook made on the recipe page.
  const [units] = useUnitSystem();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [finishedAll, setFinishedAll] = useState(false);

  // Per-step timer map: stepNumber -> StepTimer
  const [timers, setTimers] = useState<Record<number, StepTimer>>({});
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  // Ask-Chef mini assistant for the current step
  const [stepQuestion, setStepQuestion] = useState("");
  const [chefAnswer, setChefAnswer] = useState<string | null>(null);
  const [askingChef, setAskingChef] = useState(false);

  // Save recipe state
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeChefName = user?.chefName || "Chef Cart";
  const activeChefAvatar = user?.chefAvatarUrl || "🧑‍🍳";
  const activeChefConfig = user?.chefAvatarConfig ?? null;

  // Load active dish from sessionStorage
  useEffect(() => {
    const id = String(params.id);
    const cached = sessionStorage.getItem("cookcart_active_dish");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DishSuggestion;
        // Only the dish this URL names; a leftover from another recipe must not show here.
        if (parsed.id === id) {
          setDish(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached dish:", e);
      }
    }

    // Menu dishes load by id, so a reload, a new tab or a shared link still cooks the
    // right recipe instead of falling back to the demo dish.
    if (id.startsWith(MEALDB_ID_PREFIX)) {
      fetch(`/api/menu/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.dish) {
            sessionStorage.setItem("cookcart_active_dish", JSON.stringify(data.dish));
            setDish(data.dish);
          } else {
            setDish({ ...DEFAULT_FALLBACK_DISH, id });
          }
        })
        .catch(() => setDish({ ...DEFAULT_FALLBACK_DISH, id }));
      return;
    }
    setDish({ ...DEFAULT_FALLBACK_DISH, id });
  }, [params.id]);

  // Keep screen awake while cooking
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          setWakeLockActive(true);
        }
      } catch {
        // Wake lock optional
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 1-second tick for any active timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        let changed = false;
        const next: Record<number, StepTimer> = {};
        for (const [k, t] of Object.entries(prev)) {
          const stepNum = Number(k);
          if (t.isRunning && t.remainingSeconds > 0) {
            changed = true;
            const rem = t.remainingSeconds - 1;
            if (rem === 0) playChime();
            next[stepNum] = { ...t, remainingSeconds: rem, isRunning: rem > 0 };
          } else {
            next[stepNum] = t;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);
    } catch {
      // ignore audio error
    }
  };

  if (!dish) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-stone-500 gap-2 bg-stone-100">
        <Loader2 className="w-5 h-5 motion-safe:animate-spin" />
        <span>{L("Setting up your kitchen…", "正在準備您的烹飪台…")}</span>
      </div>
    );
  }

  const steps: RecipeStep[] =
    dish.steps && dish.steps.length > 0
      ? dish.steps
      : (DEFAULT_FALLBACK_DISH.steps as RecipeStep[]);

  const currentStep = steps[currentStepIdx] || steps[0];
  const stepNumber = currentStep.step || currentStepIdx + 1;

  const allIngredients: RecipeIngredient[] = [
    ...dish.usedUserIngredients.map((u) => ({
      name: u,
      nameZh: u,
      amount: 1,
      unit: L("portion", "份"),
    })),
    ...dish.extraIngredientsNeeded,
  ];

  const displayTitle = zh ? dish.titleZh || dish.title : dish.title;
  const stepTitle = zh && currentStep.titleZh ? currentStep.titleZh : currentStep.title;
  const stepText = convertTemperatures(zh && currentStep.textZh ? currentStep.textZh : currentStep.text, units);
  const progressPercent = Math.round(((completedSteps.size) / steps.length) * 100);

  const activeTimer = timers[stepNumber];

  const startOrToggleTimer = (seconds: number) => {
    setTimers((prev) => {
      const existing = prev[stepNumber];
      if (existing) {
        return {
          ...prev,
          [stepNumber]: { ...existing, isRunning: !existing.isRunning },
        };
      }
      return {
        ...prev,
        [stepNumber]: {
          remainingSeconds: seconds,
          totalSeconds: seconds,
          isRunning: true,
        },
      };
    });
  };

  const resetTimer = () => {
    setTimers((prev) => {
      const existing = prev[stepNumber];
      if (!existing) return prev;
      return {
        ...prev,
        [stepNumber]: {
          ...existing,
          remainingSeconds: existing.totalSeconds,
          isRunning: false,
        },
      };
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const scrollToTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const handleCompleteStepAndNext = () => {
    const nextDone = new Set(completedSteps);
    nextDone.add(currentStepIdx);
    setCompletedSteps(nextDone);
    setChefAnswer(null);
    setStepQuestion("");

    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      setFinishedAll(true);
    }
    scrollToTop();
  };

  const goToStep = (idx: number) => {
    setFinishedAll(false);
    setChefAnswer(null);
    setCurrentStepIdx(idx);
  };

  const goBack = () => {
    setChefAnswer(null);
    setCurrentStepIdx(Math.max(0, currentStepIdx - 1));
  };

  const setPresetTimer = (sec: number) => {
    setTimers((prev) => ({
      ...prev,
      [stepNumber]: { remainingSeconds: sec, totalSeconds: sec, isRunning: true },
    }));
  };

  const toggleIngredient = (name: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setCheckedIngredients(next);
  };

  const handleAskChef = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = stepQuestion.trim();
    if (!q || askingChef) return;
    setAskingChef(true);
    setChefAnswer(null);

    try {
      const prompt = zh
        ? `我正在煮「${displayTitle}」的第 ${stepNumber} 步（${stepTitle}：${stepText}）。請問：${q}（請用 2-3 句簡短實用回答）`
        : `I am currently on Step ${stepNumber} of cooking "${displayTitle}" (${stepTitle}: ${stepText}). Quick question: ${q} (Please answer concisely in 2-3 practical sentences.)`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: `cook_helper_${dish.id}`,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setChefAnswer(data.message);
      } else {
        setChefAnswer(
          L(
            "Keep the heat steady and trust your senses — once it smells fragrant and edges turn golden, you're right on track!",
            "保持穩定火候，聞到香氣四溢、邊緣微焦金黃就代表時間剛剛好！"
          )
        );
      }
    } catch {
      setChefAnswer(
        L(
          "Keep the heat steady and taste as you go — you're doing great!",
          "保持穩定火候，邊試味邊調整，你做得非常好！"
        )
      );
    } finally {
      setAskingChef(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/recipe/${dish.id}/cook`)}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dish.title,
          titleZh: dish.titleZh,
          cuisine: dish.cuisine,
          cookTimeMinutes: dish.cookTimeMinutes,
          difficulty: dish.difficulty,
          servings: dish.servings,
          description: dish.description,
          descriptionZh: dish.descriptionZh,
          ingredients: allIngredients,
          extraIngredients: dish.extraIngredientsNeeded,
          imageUrl: dish.imageUrl,
          instructions: steps,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // Chef's dynamic encouragement per step position
  const getChefTip = () => {
    if (currentStepIdx === 0) {
      return L(
        `Let's start with prep. Having everything sliced and ready before you turn on the stove is the best way to cook without stress.`,
        `我哋由備料開始！開火前將所有食材切好放近手邊，係輕鬆煮出靚餸嘅第一秘訣。`
      );
    }
    if (currentStepIdx === steps.length - 1) {
      return L(
        `Last step. Taste before plating and add a tiny pinch of salt or a splash of soy if it needs it. You're nearly there.`,
        `最後一步啦！上碟前可以試一試味，隨口味微調，香噴噴嘅料理即刻完成！`
      );
    }
    return L(
      `Take your time on step ${stepNumber}. Watch the aroma and the sizzle in the pan. If anything about this step is unclear, ask me.`,
      `慢慢來，留意鍋中嘅香氣同聲音變化。如果對呢一步有任何疑問，隨時問我。`
    );
  };

  const isLastStep = currentStepIdx === steps.length - 1;
  const timerIsUp = !!activeTimer && activeTimer.remainingSeconds === 0;
  const suggestedMinutes = currentStep.timerSeconds
    ? Math.max(1, Math.round(currentStep.timerSeconds / 60))
    : null;

  // Written as a short phrase rather than a string of dots.
  const dishMeta = (() => {
    const mins = dish.cookTimeMinutes > 0 ? dish.cookTimeMinutes : null;
    // Menu dishes (TheMealDB) have no time or difficulty: cookTimeMinutes 0 marks that,
    // and their placeholder difficulty must not be shown as if it were real.
    const difficulty = mins ? dish.difficulty : "";
    if (zh) {
      return [
        dish.cuisine ? `${dish.cuisine}菜` : "",
        mins ? `約 ${mins} 分鐘` : "",
        difficulty ? `難度：${difficulty}` : "",
      ]
        .filter(Boolean)
        .join("，");
    }
    const kind = [difficulty, dish.cuisine].filter(Boolean).join(" ").trim();
    const lead = kind ? `${kind} dish` : "";
    const time = mins ? `about ${mins} minutes` : "";
    return [lead, time].filter(Boolean).join(", ");
  })();

  const secondaryBtn =
    "inline-flex items-center justify-center gap-2 h-[52px] px-5 rounded-md border border-stone-300 bg-stone-50 text-stone-900 font-bold hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const primaryBtn =
    "inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors disabled:opacity-60";

  return (
    <div
      className={`min-h-screen bg-stone-100 text-stone-900 px-5 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${
        finishedAll ? "pb-10" : "pb-[calc(7rem_+_env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top bar: back to the recipe, save */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/recipe/${dish.id}`}
            className="inline-flex items-center gap-2 h-12 -ml-2 px-2 rounded-md text-stone-900 font-bold hover:bg-stone-200/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden />
            <span>{L("Recipe", "食譜")}</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveRecipe}
            disabled={saving || saved}
            className="inline-flex items-center gap-2 h-12 px-4 rounded-md border border-stone-200 bg-stone-50 text-stone-900 font-bold hover:bg-stone-100 transition-colors disabled:cursor-default"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden />
            ) : (
              <Bookmark
                className={`w-5 h-5 ${saved ? "fill-brand-500 text-brand-500" : ""}`}
                aria-hidden
              />
            )}
            <span>{saved ? L("Saved", "已收藏") : L("Save", "收藏")}</span>
          </button>
        </div>

        {/* Dish name and progress */}
        <header className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-[22px] leading-tight font-bold">{displayTitle}</h1>
            {dishMeta && <p className="text-sm text-stone-500">{dishMeta}</p>}
            {wakeLockActive && (
              <p className="text-sm text-stone-500 flex items-center gap-1.5">
                <Sun className="w-4 h-4" aria-hidden />
                {L("Your screen stays on while you cook.", "烹飪期間螢幕會保持常亮。")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-stone-500">
                {L(
                  `${completedSteps.size} of ${steps.length} steps done`,
                  `已完成 ${completedSteps.size} / ${steps.length} 步`
                )}
              </span>
              <span className="font-mono text-stone-500">{progressPercent}%</span>
            </div>
            <div
              className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label={L("Cooking progress", "烹飪進度")}
            >
              <div
                className="h-full bg-brand-500 rounded-full motion-safe:transition-[width] motion-safe:duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step jump list: numbers are a real sequence here */}
            <ol className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pt-1">
              {steps.map((st, idx) => {
                const isDone = completedSteps.has(idx);
                const isCurrent = idx === currentStepIdx && !finishedAll;
                const pillTitle = zh && st.titleZh ? st.titleZh : st.title;
                return (
                  <li key={idx} className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => goToStep(idx)}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={L(
                        `Step ${idx + 1}: ${pillTitle}${isDone ? " (done)" : ""}`,
                        `第 ${idx + 1} 步：${pillTitle}${isDone ? "（已完成）" : ""}`
                      )}
                      title={pillTitle}
                      className="w-12 h-12 flex items-center justify-center rounded-full"
                    >
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-colors ${
                          isCurrent
                            ? "bg-butter-400 text-stone-900"
                            : isDone
                            ? "bg-stone-50 text-brand-600 border border-stone-200"
                            : "text-stone-500 border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {isDone && !isCurrent ? (
                          <Check className="w-4 h-4" strokeWidth={3} aria-hidden />
                        ) : (
                          idx + 1
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </header>

        {finishedAll ? (
          /* Finished: a quiet sheet, not the rim */
          <section className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-10 text-center space-y-6 cc-pop">
            <ChefAvatarBadge
              avatarConfig={activeChefConfig}
              emoji={activeChefAvatar}
              size={96}
              title={activeChefName}
              className="mx-auto"
            />

            <div className="space-y-3 max-w-xl mx-auto">
              <p className="text-sm text-stone-500 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-brand-600" strokeWidth={3} aria-hidden />
                {L("All steps done", "所有步驟完成")}
              </p>
              <h2 className="text-[32px] leading-[1.1] font-bold">
                {L(`You made ${displayTitle}`, `你成功完成了「${displayTitle}」`)}
              </h2>
              <p className="text-stone-600 leading-relaxed">
                {L(
                  `${activeChefName}: "That smells wonderful. Plate it up while it's hot and enjoy every bite. Want to keep this recipe for next time?"`,
                  `${activeChefName}：「好香呀！趁熱上碟慢慢嘆啦！要唔要將呢個食譜收藏起嚟下次再煮？」`
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={saving || saved}
                className={primaryBtn}
              >
                <Bookmark className={`w-5 h-5 ${saved ? "fill-white" : ""}`} aria-hidden />
                <span>
                  {saved ? L("Saved to my recipes", "已收藏至我的食譜") : L("Save to my recipes", "收藏至我的食譜")}
                </span>
              </button>
              <button type="button" onClick={() => goToStep(0)} className={secondaryBtn}>
                {L("Review the steps", "重溫烹飪步驟")}
              </button>
              <Link href="/chat" className={secondaryBtn}>
                {L("Back to chat", "返回與大廚對話")}
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem] gap-5 lg:gap-6 items-start">
            {/* Main column: the current step and its timer */}
            <div className="space-y-5 min-w-0">
              <section
                key={currentStepIdx}
                className="enamel-rim p-6 sm:p-8 lg:p-10 space-y-4 cc-fade-in"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-stone-500">
                    {L(`Step ${stepNumber} of ${steps.length}`, `第 ${stepNumber} 步，共 ${steps.length} 步`)}
                  </span>
                  {completedSteps.has(currentStepIdx) && (
                    <span className="inline-flex items-center gap-1 text-brand-600 font-bold">
                      <Check className="w-4 h-4" strokeWidth={3} aria-hidden />
                      {L("Done", "已完成")}
                    </span>
                  )}
                </div>

                {stepTitle && (
                  <h2 className="text-[17px] sm:text-xl leading-snug font-bold text-stone-600">{stepTitle}</h2>
                )}
                <p className="text-[28px] sm:text-[32px] lg:text-[34px] leading-[1.3] font-bold text-stone-900">
                  {stepText}
                </p>
                <ReadAloudButton text={stepText} lang={zh ? "zh-HK" : "en"} />
              </section>

              {/* Timer */}
              <section aria-label={L("Timer", "計時器")} className="space-y-3">
                {activeTimer ? (
                  <div
                    key={`${stepNumber}-${activeTimer.totalSeconds}`}
                    className="bg-butter-400 text-stone-900 rounded-3xl p-5 sm:p-6 space-y-4 cc-pop"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-bold" aria-live="polite">
                        {timerIsUp
                          ? L("Time's up", "時間到")
                          : activeTimer.isRunning
                          ? L("Timer running", "計時中")
                          : L("Paused", "已暫停")}
                      </p>
                      <p className="text-sm">
                        {L(
                          `${Math.max(1, Math.round(activeTimer.totalSeconds / 60))} min timer`,
                          `${Math.max(1, Math.round(activeTimer.totalSeconds / 60))} 分鐘計時`
                        )}
                      </p>
                    </div>
                    <p
                      className="font-mono font-bold leading-none text-[72px] sm:text-[96px] tracking-tight"
                      role="timer"
                      aria-label={L(
                        `${formatTime(activeTimer.remainingSeconds)} remaining`,
                        `尚餘 ${formatTime(activeTimer.remainingSeconds)}`
                      )}
                    >
                      {formatTime(activeTimer.remainingSeconds)}
                    </p>
                    <div className="flex gap-3">
                      {timerIsUp ? (
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-md bg-stone-900 text-white font-bold text-lg hover:bg-stone-800 transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" aria-hidden />
                          {L("Reset", "重設")}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startOrToggleTimer(activeTimer.totalSeconds)}
                            className="flex-1 inline-flex items-center justify-center gap-2 h-14 rounded-md bg-stone-900 text-white font-bold text-lg hover:bg-stone-800 transition-colors"
                          >
                            {activeTimer.isRunning ? (
                              <Pause className="w-5 h-5" aria-hidden />
                            ) : (
                              <Play className="w-5 h-5" aria-hidden />
                            )}
                            {activeTimer.isRunning ? L("Pause", "暫停") : L("Resume", "繼續")}
                          </button>
                          <button
                            type="button"
                            onClick={resetTimer}
                            className="inline-flex items-center justify-center gap-2 h-14 px-5 rounded-md border-2 border-stone-900/25 text-stone-900 font-bold text-lg hover:bg-butter-300 transition-colors"
                          >
                            <RotateCcw className="w-5 h-5" aria-hidden />
                            {L("Reset", "重設")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  suggestedMinutes && (
                    <button
                      type="button"
                      onClick={() => startOrToggleTimer(currentStep.timerSeconds!)}
                      className="w-full inline-flex items-center justify-center gap-2 h-14 rounded-md bg-butter-400 hover:bg-butter-300 text-stone-900 font-bold text-lg transition-colors"
                    >
                      <Play className="w-5 h-5" aria-hidden />
                      {L(`Start ${suggestedMinutes} min timer`, `開始 ${suggestedMinutes} 分鐘計時`)}
                    </button>
                  )
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-stone-500 mr-1">
                    {activeTimer ? L("Set a new timer", "重新計時") : L("Other timers", "其他計時")}
                  </span>
                  {[60, 180, 300].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setPresetTimer(sec)}
                      className="h-12 px-4 rounded-full border border-stone-200 bg-stone-50 text-stone-900 font-bold hover:bg-stone-100 transition-colors"
                    >
                      {L(`${sec / 60} min`, `${sec / 60} 分鐘`)}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Side column: chef companion and ingredients */}
            <aside className="space-y-5 min-w-0">
              <section className="bg-stone-50 rounded-3xl border border-stone-200 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ChefAvatarBadge
                    avatarConfig={activeChefConfig}
                    emoji={activeChefAvatar}
                    size={48}
                    title={activeChefName}
                  />
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold">{activeChefName}</p>
                    <p className="text-stone-600 leading-relaxed">{getChefTip()}</p>
                  </div>
                </div>

                <form onSubmit={handleAskChef} className="space-y-2 pt-4 border-t border-stone-200">
                  <label htmlFor="ask-chef" className="block text-sm font-bold">
                    {L(`Ask ${activeChefName} about this step`, `向 ${activeChefName} 問呢一步`)}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="ask-chef"
                      type="text"
                      value={stepQuestion}
                      onChange={(e) => setStepQuestion(e.target.value)}
                      placeholder={L("How hot should the pan be?", "例如：油溫要幾熱先啱？")}
                      className="flex-1 min-w-0 h-12 px-4 rounded-md border border-stone-300 bg-stone-50 text-base placeholder:text-stone-400 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={askingChef || !stepQuestion.trim()}
                      aria-label={L("Ask", "發問")}
                      className="w-12 h-12 flex-shrink-0 inline-flex items-center justify-center rounded-md bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40"
                    >
                      {askingChef ? (
                        <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden />
                      ) : (
                        <Send className="w-5 h-5" aria-hidden />
                      )}
                    </button>
                  </div>
                </form>

                {chefAnswer && (
                  <div className="p-4 rounded-2xl bg-stone-100 leading-relaxed space-y-1 cc-fade-in" aria-live="polite">
                    <p className="text-sm font-bold">{activeChefName}</p>
                    <p>{chefAnswer}</p>
                  </div>
                )}
              </section>

              <section className="bg-stone-50 rounded-3xl border border-stone-200 p-5 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[22px] leading-tight font-bold">{L("Ingredients", "食材")}</h3>
                  <span className="text-sm text-stone-500 font-mono">
                    {L(
                      `${checkedIngredients.size} of ${allIngredients.length} ready`,
                      `已備 ${checkedIngredients.size} / ${allIngredients.length}`
                    )}
                  </span>
                </div>
                <p className="text-sm text-stone-500">
                  {L("Tick them off as you prep or add them.", "備好或下鍋後點擊剔走。")}
                </p>

                <ul className="divide-y divide-stone-200 max-h-[360px] overflow-y-auto -mx-1 px-1">
                  {allIngredients.map((item) => {
                    const checked = checkedIngredients.has(item.name);
                    const name = zh ? item.nameZh || item.name : item.name;
                    const shown = convertAmount(item.amount, item.unit, units);
                    const amountText = `${Math.round(shown.amount * 100) / 100} ${shown.unit}`.trim();
                    return (
                      <li key={item.name}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          onClick={() => toggleIngredient(item.name)}
                          className="w-full min-h-[48px] py-2.5 flex items-center gap-3 text-left select-none"
                        >
                          <span
                            className={`w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${
                              checked ? "bg-brand-500 border-brand-500 text-white cc-pop" : "border-stone-300 bg-stone-50"
                            }`}
                          >
                            {checked && <Check className="w-4 h-4" strokeWidth={3} aria-hidden />}
                          </span>
                          <span
                            className={`flex-1 min-w-0 font-bold ${checked ? "text-stone-400 line-through" : "text-stone-900"}`}
                          >
                            {name}
                          </span>
                          <span className={`text-sm font-mono ${checked ? "text-stone-400" : "text-stone-500"}`}>
                            {amountText}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={`/recipe/${dish.id}`}
                  className="inline-flex items-center h-12 text-brand-600 font-bold hover:underline"
                >
                  {L("Shopping list", "購物清單")}
                </Link>
              </section>
            </aside>
          </div>
        )}
      </div>

      {/* Back / Next in thumb reach */}
      {!finishedAll && (
        <nav
          aria-label={L("Step navigation", "步驟導覽")}
          className="fixed inset-x-0 bottom-0 z-40 bg-stone-50 border-t border-stone-200 pb-safe"
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-3 flex gap-3 lg:justify-end">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStepIdx === 0}
              className={`${secondaryBtn} flex-1 lg:flex-none lg:w-44`}
            >
              {L("Back", "上一步")}
            </button>
            <button
              type="button"
              onClick={handleCompleteStepAndNext}
              className={`${primaryBtn} flex-[2] lg:flex-none lg:w-72 text-lg`}
            >
              {isLastStep ? L("Finish cooking", "完成烹飪") : L("Next step", "下一步")}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
