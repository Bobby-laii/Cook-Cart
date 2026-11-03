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
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
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
    const cached = sessionStorage.getItem("cookcart_active_dish");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DishSuggestion;
        setDish(parsed);
        return;
      } catch (e) {
        console.error("Failed to parse cached dish:", e);
      }
    }
    setDish({ ...DEFAULT_FALLBACK_DISH, id: String(params.id) });
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
      <div className="min-h-[70vh] flex items-center justify-center text-stone-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{L("Setting up your kitchen station...", "正在準備您的烹飪台...")}</span>
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

  const handleCompleteStepAndNext = () => {
    const nextDone = new Set(completedSteps);
    nextDone.add(currentStepIdx);
    setCompletedSteps(nextDone);
    setChefAnswer(null);
    setStepQuestion("");

    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setFinishedAll(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
        `Let's start with prep! Having everything sliced and ready before turning on the stove is the #1 secret to stress-free cooking.`,
        `我哋由備料開始！開火前將所有食材切好放近手邊，係輕鬆煮出靚餸嘅第一秘訣。`
      );
    }
    if (currentStepIdx === steps.length - 1) {
      return L(
        `Final step! Taste before plating and adjust with a tiny pinch of salt or soy if needed. You're seconds away from a delicious meal!`,
        `最後一步啦！上碟前可以試一試味，隨口味微調，香噴噴嘅料理即刻完成！`
      );
    }
    return L(
      `Take your time on Step ${stepNumber}. Watch the aroma and sizzle in the pan — if you have any question about this step, ask me on the right!`,
      `慢慢來，留意鍋中嘅香氣同聲音變化——如果對呢一步有任何疑問，隨時喺右邊問我！`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-stone-50 to-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{L("Back to AI Chat", "返回 AI 聊天室")}</span>
            </Link>
            <Link
              href={`/recipe/${dish.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{L("Ingredients & Store Prices", "食材清單與超市格價")}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {wakeLockActive && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-full">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                {L("Screen Stay-Awake Active", "螢幕常亮模式已開啟")}
              </span>
            )}
            <button
              onClick={handleSaveRecipe}
              disabled={saving || saved}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition ${
                saved
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-amber-600 text-amber-600" : ""}`} />
              <span>{saved ? L("Saved to My Recipes", "已收藏食譜") : L("Save Recipe", "收藏食譜")}</span>
            </button>
          </div>
        </div>

        {/* Dish Header & Overall Progress Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 text-xs font-bold uppercase tracking-wider">
                  {dish.cuisine}
                </span>
                {dish.cookTimeMinutes > 0 && (
                  <>
                    <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {dish.cookTimeMinutes} {L("mins", "分鐘")}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-stone-400" />
                      {dish.difficulty}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900">{displayTitle}</h1>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {L("Cooking Progress", "烹飪進度")}
              </span>
              <p className="text-lg font-black text-brand-600">
                {completedSteps.size} / {steps.length} {L("Steps Completed", "步驟完成")} ({progressPercent}%)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-brand-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>

          {/* Clickable Stepper Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
            {steps.map((st, idx) => {
              const isDone = completedSteps.has(idx);
              const isCurrent = idx === currentStepIdx && !finishedAll;
              const pillTitle = zh && st.titleZh ? st.titleZh : st.title;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFinishedAll(false);
                    setCurrentStepIdx(idx);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                    isCurrent
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isCurrent
                        ? "bg-amber-500 text-stone-950"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className="max-w-[140px] truncate">{pillTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Celebration View when all steps are done */}
        {finishedAll ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-md p-8 sm:p-12 text-center space-y-6 cc-pop">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-emerald-300/30 blur-2xl animate-pulse" />
              <ChefAvatarBadge
                avatarConfig={activeChefConfig}
                emoji={activeChefAvatar}
                size={120}
                title={activeChefName}
                className="relative shadow-xl ring-8 ring-emerald-50"
              />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                {L("Dish Complete!", "大功告成！")}
              </span>
              <h2 className="text-3xl font-black text-stone-900">
                {L(`Bon Appétit! You nailed ${displayTitle}!`, `太棒了！你成功完成了「${displayTitle}」！`)}
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                {L(
                  `${activeChefName}: "That smells incredible! Plate it up while it's piping hot and enjoy every bite. Want to save this recipe to your collection?"`,
                  `${activeChefName}：「好香呀！趁熱上碟慢慢嘆啦！要唔要將呢個食譜收藏起嚟下次再煮？」`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFinishedAll(false);
                  setCurrentStepIdx(0);
                }}
                className="px-5 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold text-sm transition"
              >
                {L("Review Steps Again", "重溫烹飪步驟")}
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={saving || saved}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition disabled:opacity-60 flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>{saved ? L("Saved in My Recipes!", "已收藏至我的食譜！") : L("Save to My Recipes", "收藏至我的食譜")}</span>
              </button>
              <Link
                href="/chat"
                className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>{L("Back to AI Chef Chat", "返回與大廚對話")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Main Step-by-Step Workspace (Left: Current Step + Chef Guide, Right: Ingredients + Ask Chef) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Columns: Active Step Card */}
            <div className="lg:col-span-8 space-y-6">
              {/* Personal Chef Companion Tip Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-4 shadow-2xs">
                <ChefAvatarBadge
                  avatarConfig={activeChefConfig}
                  emoji={activeChefAvatar}
                  size={56}
                  title={activeChefName}
                  className="shadow-sm ring-2 ring-white"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                      {activeChefName} • {L("Chef's Tip", "大廚貼士")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">{getChefTip()}</p>
                </div>
              </div>

              {/* Active Step Spotlight Card */}
              <div key={currentStepIdx} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6 cc-fade-in">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500 text-white text-xs sm:text-sm font-black shadow-xs">
                    <Flame className="w-4 h-4" />
                    {L(`STEP ${stepNumber} OF ${steps.length}`, `第 ${stepNumber} / ${steps.length} 步`)}
                  </span>

                  {completedSteps.has(currentStepIdx) && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {L("Completed", "已完成此步驟")}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">{stepTitle}</h2>
                  <p className="text-base sm:text-xl text-stone-700 leading-relaxed font-medium">{stepText}</p>
                </div>

                {/* Built-in Interactive Step Timer */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        {L("Kitchen Timer for Step", "此步驟計時器")} {stepNumber}
                      </span>
                    </div>

                    {/* Quick Preset Timer Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentStep.timerSeconds && (
                        <button
                          type="button"
                          onClick={() => startOrToggleTimer(currentStep.timerSeconds!)}
                          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-2xs"
                        >
                          {L(
                            `Suggested: ${Math.max(1, Math.round(currentStep.timerSeconds / 60))} min`,
                            `建議時間：${Math.max(1, Math.round(currentStep.timerSeconds / 60))} 分鐘`
                          )}
                        </button>
                      )}
                      {[60, 180, 300].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            setTimers((prev) => ({
                              ...prev,
                              [stepNumber]: { remainingSeconds: sec, totalSeconds: sec, isRunning: true },
                            }))
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-stone-200 text-stone-700 text-xs font-semibold transition"
                        >
                          +{sec / 60}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTimer && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        activeTimer.remainingSeconds === 0
                          ? "bg-red-50 border-red-300 text-red-900 animate-pulse"
                          : "bg-white border-stone-200 text-stone-900"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-bold uppercase text-stone-400">
                          {activeTimer.remainingSeconds === 0
                            ? L("Time's up!", "時間到！")
                            : activeTimer.isRunning
                            ? L("Counting down...", "倒數計時中...")
                            : L("Paused", "已暫停")}
                        </span>
                        <p className="text-3xl font-black font-mono tracking-wider">
                          {formatTime(activeTimer.remainingSeconds)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startOrToggleTimer(activeTimer.totalSeconds)}
                          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          {activeTimer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{activeTimer.isRunning ? L("Pause", "暫停") : L("Resume", "繼續")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
                          title={L("Reset Timer", "重設計時器")}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Step Navigation Buttons */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setChefAnswer(null);
                      setCurrentStepIdx(Math.max(0, currentStepIdx - 1));
                    }}
                    disabled={currentStepIdx === 0}
                    className="px-5 py-3.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-40 font-bold text-sm flex items-center gap-2 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{L("Previous Step", "上一步")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteStepAndNext}
                    className="flex-1 max-w-xs py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition group"
                  >
                    <Check className="w-5 h-5" />
                    <span>
                      {currentStepIdx < steps.length - 1
                        ? L("Done! Next Step", "完成！下一步")
                        : L("Finish Cooking!", "完成所有步驟！")}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Ask Chef About This Step + Ingredients Checklist */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Ask Chef Quick Helper */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black text-stone-900">
                    {L(`Ask ${activeChefName} About Step ${stepNumber}`, `向 ${activeChefName} 詢問第 ${stepNumber} 步`)}
                  </h3>
                </div>
                <p className="text-xs text-stone-500">
                  {L(
                    "Unsure about heat level, texture, or a substitute right now? Ask your chef directly:",
                    "唔確定火候、生熟度或替代食材？即刻問問你的大廚："
                  )}
                </p>

                <form onSubmit={handleAskChef} className="flex gap-2">
                  <input
                    type="text"
                    value={stepQuestion}
                    onChange={(e) => setStepQuestion(e.target.value)}
                    placeholder={L("e.g. How hot should the pan be?", "例如：油溫要幾熱先啱？")}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={askingChef || !stepQuestion.trim()}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {askingChef ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>

                {chefAnswer && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-stone-800 leading-relaxed space-y-1 cc-fade-in">
                    <span className="font-bold text-amber-900 block">{activeChefName}:</span>
                    <p>{chefAnswer}</p>
                  </div>
                )}
              </div>

              {/* Ingredients Prep Checklist */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-stone-900">
                    {L("Ingredients Checklist", "食材準備清單")}
                  </h3>
                  <span className="text-xs font-bold text-stone-400">
                    {checkedIngredients.size}/{allIngredients.length}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  {L("Tap to check off ingredients as you prep or add them:", "點擊勾選已備妥或已下鍋的食材：")}
                </p>

                <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {allIngredients.map((item) => {
                    const checked = checkedIngredients.has(item.name);
                    const name = zh ? item.nameZh || item.name : item.name;
                    return (
                      <li
                        key={item.name}
                        onClick={() => toggleIngredient(item.name)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none flex items-center justify-between transition ${
                          checked
                            ? "bg-emerald-50/60 border-emerald-200 text-stone-400 line-through"
                            : "bg-stone-50/70 border-stone-200 hover:border-amber-300 text-stone-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-300 bg-white"
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                          </span>
                          <span className="font-semibold">{name}</span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {(() => {
                            const shown = convertAmount(item.amount, item.unit, units);
                            return `${Math.round(shown.amount * 100) / 100} ${shown.unit}`.trim();
                          })()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

