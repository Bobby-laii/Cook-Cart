"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, Check, ChefHat, Hand, ListChecks, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { DEFAULT_CHEF_AVATAR, parseChefAvatarConfig } from "@/lib/avatar/chefAvatar";
import { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";
import { convertAmount, convertTemperatures } from "@/lib/units";
import { useUnitSystem } from "@/lib/useUnitSystem";
import { loadDish } from "@/lib/recipes/loadDish";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { BottomSheet } from "@/components/cook/BottomSheet";
import { AskChef } from "@/components/cook/AskChef";
import { FarView } from "@/components/handsfree/FarView";
import { HandsFreeControls } from "@/components/handsfree/HandsFreeControls";
import { LiveCameraStepFeed } from "@/components/handsfree/LiveCameraStepFeed";
import { useLiveCameraStep } from "@/lib/handsfree/useWaveGesture";
import { speak, useVoiceCommands } from "@/lib/handsfree/useVoiceCommands";
import type { CookCommand } from "@/lib/handsfree/commands";
import {
  AddTimerControl,
  CookTimer,
  StepTimerButton,
  TimerRow,
  pauseTimer,
  playChime,
  isRunning,
  remainingOf,
  startTimer,
} from "@/components/cook/Timers";
import {
  formatAmount,
  formatDuration,
  isGenericStepTitle,
  parseServings,
  stepTimerSeconds,
} from "@/components/cook/cookHelpers";
import { button, chip, errorText, iconButton } from "@/components/ui/styles";

/** Step entrance, only after Back or Next; prefers-reduced-motion turns it off. */
const STEP_MOTION = `
@keyframes cc-step-next { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes cc-step-back { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
.cc-step-next { animation: cc-step-next 0.28s ease-out; }
.cc-step-back { animation: cc-step-back 0.28s ease-out; }
@media (prefers-reduced-motion: reduce) { .cc-step-next, .cc-step-back { animation: none; } }
`;

export default function CookPage() {
  return (
    <Suspense fallback={<CookSkeleton />}>
      <CookMode />
    </Suspense>
  );
}

function CookSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 px-5 pt-4" aria-busy="true" aria-label="Loading the recipe">
      <div className="max-w-2xl mx-auto space-y-4 motion-safe:animate-pulse">
        <div className="flex items-center gap-3 h-12">
          <div className="w-10 h-10 rounded-md bg-stone-100" />
          <div className="h-4 w-40 rounded bg-stone-100" />
        </div>
        <div className="h-1 rounded-full bg-stone-100" />
        <div className="h-72 rounded-2xl bg-stone-100" />
        <div className="h-[76px] rounded-md bg-stone-100" />
      </div>
    </div>
  );
}

function CookMode() {
  const params = useParams();
  const search = useSearchParams();
  const { user } = useAuth();
  const id = String(params.id);

  // undefined while loading, null when there is no such recipe.
  const [dish, setDish] = useState<DishSuggestion | null | undefined>(undefined);
  const [units] = useUnitSystem();

  useEffect(() => {
    let live = true;
    setDish(undefined);
    loadDish(id).then((d) => {
      if (live) setDish(d);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (dish === undefined) return <CookSkeleton />;
  if (dish === null) return <NotFound />;
  return (
    <CookSession
      key={dish.id}
      dish={dish}
      units={units}
      servingsParam={search.get("servings")}
      fromChat={search.get("from") === "chat"}
      user={user}
    />
  );
}

function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 px-5 flex flex-col items-center justify-center text-center gap-5">
      <p className="font-display text-[30px] leading-tight text-stone-900">We couldn&apos;t find this recipe</p>
      <p className="text-stone-500 max-w-sm">It may have been removed, or the link is incomplete.</p>
      <Link href="/" className={button("primary")}>
        Back to the menu
      </Link>
    </div>
  );
}

type AuthUser = ReturnType<typeof useAuth>["user"];

function CookSession({
  dish,
  units,
  servingsParam,
  fromChat,
  user,
}: {
  dish: DishSuggestion;
  units: ReturnType<typeof useUnitSystem>[0];
  servingsParam: string | null;
  fromChat: boolean;
  user: AuthUser;
}) {
  const steps: RecipeStep[] = useMemo(() => dish.steps ?? [], [dish.steps]);
  const baseServings = dish.servings > 0 ? dish.servings : 2;
  const servings = parseServings(servingsParam, baseServings);
  const scale = servings / baseServings;

  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState<"next" | "back" | null>(null);
  const [finished, setFinished] = useState(false);
  const [sheet, setSheet] = useState<"ingredients" | "chef" | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [cameFromChat, setCameFromChat] = useState(fromChat);
  // Hands-free: wave at the camera, talk, or read from across the kitchen.
  const [wave, setWave] = useState(false);
  const [voice, setVoice] = useState(false);
  const [farView, setFarView] = useState(false);
  const [voiceQuestion, setVoiceQuestion] = useState<{ id: number; text: string } | null>(null);
  const [triggerCameraCheckId, setTriggerCameraCheckId] = useState<number | null>(null);

  useEffect(() => {
    if (fromChat) return;
    try {
      if (document.referrer && new URL(document.referrer).pathname.startsWith("/chat")) setCameFromChat(true);
    } catch {
      // No usable referrer: the end screen offers the menu.
    }
  }, [fromChat]);

  // Timers count from timestamps; refresh twice a second while one runs.
  const anyRunning = timers.some((t) => t.endsAt !== null);
  useEffect(() => {
    if (!anyRunning) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [anyRunning]);

  // One chime per timer reaching zero.
  const chimed = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const t of timers) {
      const key = `${t.id}:${t.endsAt}`;
      if (t.endsAt !== null && t.endsAt <= now && !chimed.current.has(key)) {
        chimed.current.add(key);
        playChime();
      }
    }
  }, [timers, now]);

  // Keep the screen awake while cooking; phones drop the lock when the tab is hidden.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
        };
        if (nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen");
      } catch {
        // Wake lock is a nicety.
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  const step = steps[stepIdx];
  const stepCount = steps.length;
  const isLast = stepIdx >= stepCount - 1;
  const stepText = step ? convertTemperatures(step.text, units) : "";
  const stepTitle = step && !isGenericStepTitle(step.title) ? step.title.trim() : null;
  const stepSeconds = stepTimerSeconds(step);
  const stepTimerId = `step-${stepIdx}`;

  const goNext = useCallback(() => {
    setDirection("next");
    if (isLast) {
      setFinished(true);
    } else {
      setStepIdx((i) => Math.min(stepCount - 1, i + 1));
    }
  }, [isLast, stepCount]);

  const goBack = useCallback(() => {
    setDirection("back");
    if (finished) {
      setFinished(false);
    } else {
      setStepIdx((i) => Math.max(0, i - 1));
    }
  }, [finished]);

  // Each new step starts at the top of the page, after it has rendered.
  useEffect(() => {
    if (direction) window.scrollTo({ top: 0 });
  }, [stepIdx, finished, direction]);

  // Arrow keys step through on a laptop on the counter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || e.altKey || e.metaKey || e.ctrlKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" && !finished) goNext();
      if (e.key === "ArrowLeft" && (stepIdx > 0 || finished)) goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, finished, stepIdx, goNext, goBack]);

  /* ------------------------------ Hands-free ----------------------------- */

  useEffect(() => {
    document.title = `Cooking ${dish.title} – Bon Taste`;
  }, [dish.title]);

  const {
    state: camera,
    videoRef,
    motionLevel,
    lastSwipe,
    facingMode,
    setFacingMode,
    captureFrame,
  } = useLiveCameraStep(wave && !finished, (swipe) => {
    if (swipe === "next") goNext();
    else if (stepIdx > 0) goBack();
  });

  // Commands need the latest step and timers; a ref keeps the listener stable.
  const commandRef = useRef<(c: CookCommand) => void>(() => {});
  const { state: mic, heard } = useVoiceCommands(voice, (c) => commandRef.current(c));

  /* ------------------------------- Timers ------------------------------- */

  const stepTimer: CookTimer | null = stepSeconds
    ? timers.find((t) => t.id === stepTimerId) ?? {
        id: stepTimerId,
        label: stepTitle ? `${stepTitle} timer` : `Step ${stepIdx + 1} timer`,
        totalSeconds: stepSeconds,
        remainingSeconds: stepSeconds,
        endsAt: null,
      }
    : null;
  const otherTimers = timers.filter((t) => t.id !== stepTimerId || !stepSeconds);

  const upsert = (t: CookTimer) =>
    setTimers((prev) => (prev.some((p) => p.id === t.id) ? prev.map((p) => (p.id === t.id ? t : p)) : [...prev, t]));
  const remove = (timerId: string) => setTimers((prev) => prev.filter((p) => p.id !== timerId));
  const toggle = (t: CookTimer) => {
    const at = Date.now();
    setNow(at);
    upsert(isRunning(t, at) ? pauseTimer(t, at) : startTimer(t, at));
  };
  const addTimer = (seconds: number) => {
    const at = Date.now();
    setNow(at);
    upsert(
      startTimer(
        {
          id: `extra-${at}`,
          label: `${formatDuration(seconds)} timer`,
          totalSeconds: seconds,
          remainingSeconds: seconds,
          endsAt: null,
        },
        at
      )
    );
  };

  /* ----------------------------- Ingredients ----------------------------- */

  const ingredients: RecipeIngredient[] = useMemo(
    () => [
      ...dish.usedUserIngredients.map((name) => ({ name, amount: 0, unit: "" })),
      ...dish.extraIngredientsNeeded,
    ],
    [dish]
  );

  const amountText = (item: RecipeIngredient) => {
    if (!(item.amount > 0)) return item.unit && item.unit !== "portion" ? item.unit : "";
    const { amount, unit } = convertAmount(item.amount * scale, item.unit, units);
    return `${formatAmount(amount)} ${unit}`.trim();
  };

  const toggleIngredient = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  /* -------------------------------- Save --------------------------------- */

  const cookPath = `/recipe/${dish.id}/cook${servingsParam ? `?servings=${servings}` : ""}`;
  const recipePath = `/recipe/${dish.id}${servingsParam ? `?servings=${servings}` : ""}`;
  // The login page reads `callbackUrl`; `next` is carried too for the newer name.
  const loginHref = `/login?next=${encodeURIComponent(cookPath)}&callbackUrl=${encodeURIComponent(cookPath)}`;

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dish.title,
          cuisine: dish.cuisine,
          cookTimeMinutes: dish.cookTimeMinutes,
          difficulty: dish.difficulty,
          servings,
          description: dish.description,
          ingredients: ingredients.map((i) => ({ ...i, amount: i.amount * scale })),
          extraIngredients: dish.extraIngredientsNeeded.map((i) => ({ ...i, amount: i.amount * scale })),
          imageUrl: dish.imageUrl,
          instructions: steps,
          sourceUrl: dish.sourceUrl,
          sourceName: dish.sourceName,
        }),
      });
      if (res.ok) setSaved(true);
      else setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const saveControl = user ? (
    <div className="space-y-2">
      <button type="button" onClick={handleSave} disabled={saving || saved} className={button("primary", "md", "w-full")}>
        {saving ? (
          <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden />
        ) : saved ? (
          <Check className="w-5 h-5 cc-tick" strokeWidth={3} aria-hidden />
        ) : (
          <Bookmark className="w-5 h-5" aria-hidden />
        )}
        {saved ? "Saved to My recipes" : "Save to My recipes"}
      </button>
      {saveError && (
        <p role="alert" className={errorText}>
          Couldn&apos;t save just now. Try again in a moment.
        </p>
      )}
    </div>
  ) : (
    <Link href={loginHref} className={button("primary", "md", "w-full")}>
      <Bookmark className="w-5 h-5" aria-hidden />
      Sign in to save this recipe
    </Link>
  );

  /* -------------------------------- Chef --------------------------------- */

  const chefName = user?.chefName?.trim() || "Your chef";
  const chefConfig = parseChefAvatarConfig(user?.chefAvatarConfig)
    ? (user!.chefAvatarConfig as string)
    : JSON.stringify(DEFAULT_CHEF_AVATAR);
  const buildPrompt = (q: string) =>
    `I am on step ${stepIdx + 1} of ${stepCount} while cooking "${dish.title}" for ${servings}. ` +
    `${stepTitle ? `${stepTitle}: ` : ""}${stepText} ` +
    `Quick question: ${q} (Please answer in 2 or 3 practical sentences.)`;

  commandRef.current = (c: CookCommand) => {
    switch (c.kind) {
      case "next":
        if (!finished) goNext();
        break;
      case "back":
        if (stepIdx > 0 || finished) goBack();
        break;
      case "repeat":
        speak(stepTitle ? `${stepTitle}. ${stepText}` : stepText);
        break;
      case "startTimer":
        if (stepTimer && !isRunning(stepTimer, Date.now())) toggle(stepTimer);
        break;
      case "stopTimer": {
        const running = timers.find((t) => isRunning(t, Date.now()));
        if (running) toggle(running);
        break;
      }
      case "ingredients":
        setFarView(false);
        setSheet("ingredients");
        break;
      case "checkStep":
        setFarView(false);
        if (!wave) setWave(true);
        setTriggerCameraCheckId(Date.now());
        break;
      case "ask":
        setFarView(false);
        setSheet("chef");
        setVoiceQuestion({ id: Date.now(), text: c.question });
        break;
    }
  };

  /* ------------------------------- Render -------------------------------- */

  const progress = stepCount > 0 ? (finished ? 1 : (stepIdx + 1) / stepCount) : 0;
  const motionClass = direction === "next" ? "cc-step-next" : direction === "back" ? "cc-step-back" : "";
  const textSize = stepText.length > 220 ? "text-[26px]" : "text-[28px] sm:text-[32px]";

  return (
    <div className="min-h-[100dvh] bg-stone-50 text-stone-900 overflow-x-clip">
      <style>{STEP_MOTION}</style>

      {/* Minimal top bar: close, dish name, progress */}
      <header className="sticky top-0 z-30 bg-stone-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center gap-2 h-14">
            <Link
              href={recipePath}
              aria-label="Close cooking mode"
              className={iconButton("ghost", "sm", "-ml-3 flex-shrink-0")}
            >
              <X className="w-6 h-6" aria-hidden />
            </Link>
            <p className="flex-1 min-w-0 truncate font-display text-body leading-tight">{dish.title}</p>
            {!finished && stepCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setWave(true);
                  setVoice(true);
                  setFarView(true);
                }}
                className={chip(false, "flex-shrink-0 font-bold")}
              >
                <Hand className="w-[18px] h-[18px]" aria-hidden />
                Hands-free
              </button>
            )}
          </div>
          <div className="pb-3 space-y-1.5">
            <p className="text-sm text-stone-500" aria-live="polite">
              {finished ? "All steps done" : stepCount > 0 ? `Step ${stepIdx + 1} of ${stepCount}` : "No steps"}
            </p>
            <div
              className="h-1 w-full rounded-full bg-stone-200 overflow-hidden"
              role="progressbar"
              aria-label="Cooking progress"
              aria-valuemin={0}
              aria-valuemax={stepCount}
              aria-valuenow={finished ? stepCount : stepIdx + 1}
            >
              <div
                className="h-full rounded-full bg-stone-900 motion-safe:transition-[width] motion-safe:duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {finished || stepCount === 0 ? (
        <EndScreen
          dish={dish}
          noSteps={stepCount === 0}
          chefName={chefName}
          chefConfig={chefConfig}
          saveControl={saveControl}
          cameFromChat={cameFromChat}
          recipePath={recipePath}
          onReview={() => {
            setDirection("back");
            setFinished(false);
          }}
          motionClass={motionClass}
        />
      ) : (
        <main className="max-w-2xl mx-auto px-5 pt-1 pb-[calc(9rem_+_env(safe-area-inset-bottom))] space-y-4">
          <section key={stepIdx} className={`enamel-rim p-6 sm:p-8 space-y-4 ${motionClass}`} aria-live="polite">
            {stepTitle && <h1 className="text-body leading-snug font-bold text-stone-500">{stepTitle}</h1>}
            <p className={`${textSize} leading-[1.3] font-bold text-stone-900`}>{stepText}</p>
            <ReadAloudButton text={stepTitle ? `${stepTitle}. ${stepText}` : stepText} />
          </section>

          {stepTimer && (
            <StepTimerButton
              timer={stepTimer}
              now={now}
              onToggle={() => toggle(stepTimer)}
              onReset={() => remove(stepTimer.id)}
            />
          )}

          {otherTimers.length > 0 && (
            <ul className="space-y-2" aria-label="Running timers">
              {otherTimers.map((t) => (
                <TimerRow key={t.id} timer={t} now={now} onToggle={() => toggle(t)} onDismiss={() => remove(t.id)} />
              ))}
            </ul>
          )}

          <AddTimerControl onAdd={addTimer} />

          <HandsFreeControls
            wave={wave}
            voice={voice}
            camera={camera}
            mic={mic}
            onToggleWave={() => setWave((v) => !v)}
            onToggleVoice={() => setVoice((v) => !v)}
            onFarView={() => setFarView(true)}
          />

          {wave && (
            <LiveCameraStepFeed
              cameraState={camera}
              videoRef={videoRef}
              motionLevel={motionLevel}
              lastSwipe={lastSwipe}
              facingMode={facingMode}
              onToggleFacingMode={() =>
                setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
              }
              captureFrame={captureFrame}
              dishTitle={dish.title}
              stepNumber={stepIdx + 1}
              totalSteps={stepCount}
              stepTitle={stepTitle}
              stepText={stepText}
              speakFeedback={voice}
              triggerCheckId={triggerCameraCheckId}
              onNextStep={goNext}
            />
          )}

          {voice && mic === "listening" && (
            <p className="text-sm text-stone-500" aria-live="polite">
              {heard
                ? `Heard “${heard}”.`
                : "Listening. Say “next”, “back”, “repeat”, “check pan”, “start timer”, or “chef” and your question."}
            </p>
          )}
        </main>
      )}

      {/* Bottom bar in thumb reach */}
      {!finished && stepCount > 0 && (
        <nav
          aria-label="Cooking controls"
          className="fixed inset-x-0 bottom-0 z-40 bg-stone-50 border-t border-stone-200 pb-safe"
        >
          <div className="max-w-2xl mx-auto px-5 pt-1 pb-3">
            <div className="flex">
              <button
                type="button"
                onClick={() => setSheet("ingredients")}
                className={button("ghost", "sm", "flex-1")}
              >
                <ListChecks className="w-5 h-5" aria-hidden />
                Ingredients
              </button>
              <button
                type="button"
                onClick={() => setSheet("chef")}
                className={button("ghost", "sm", "flex-1")}
              >
                <ChefHat className="w-5 h-5" aria-hidden />
                Ask the chef
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={goBack} disabled={stepIdx === 0} className={button("secondary", "md", "flex-1")}>
                Back
              </button>
              <button type="button" onClick={goNext} className={button("primary", "md", "flex-[2]")}>
                {isLast ? "Finish cooking" : "Next step"}
              </button>
            </div>
          </div>
        </nav>
      )}

      <BottomSheet
        open={sheet === "ingredients"}
        onClose={() => setSheet(null)}
        title="Ingredients"
        footer={saveControl}
      >
        <p className="text-stone-500 pb-1">
          {`Amounts for ${servings} ${servings === 1 ? "person" : "people"}. Tick them off as you go.`}
        </p>
        {ingredients.length === 0 ? (
          <p className="py-4 text-stone-500">This recipe has no ingredient list.</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {ingredients.map((item, i) => {
              const key = `${item.name}-${i}`;
              const on = checked.has(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleIngredient(key)}
                    className="w-full min-h-[52px] py-2.5 flex items-center gap-3 text-left"
                  >
                    <span
                      className={`w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${
                        on ? "bg-brand-500 border-brand-500 text-white" : "border-stone-300"
                      }`}
                    >
                      {on && <Check className="w-4 h-4 cc-tick" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className={`flex-1 min-w-0 text-body ${on ? "text-stone-500 line-through" : "text-stone-900"}`}>
                      {item.name}
                    </span>
                    <span className="font-mono text-stone-500 text-right">{amountText(item)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "chef"} onClose={() => setSheet(null)} title={`Ask ${chefName === "Your chef" ? "the chef" : chefName}`}>
        <AskChef
          key={stepIdx}
          chefName={chefName}
          avatarConfig={chefConfig}
          dishId={dish.id}
          buildPrompt={buildPrompt}
          loginHref={loginHref}
          incoming={voiceQuestion}
          speakAnswers={voice}
          showMic={!voice}
        />
      </BottomSheet>

      {farView && !finished && step && (
        <FarView
          stepIndex={stepIdx}
          totalSteps={stepCount}
          title={stepTitle ?? undefined}
          text={stepText}
          timer={
            stepTimer
              ? {
                  remainingSeconds: remainingOf(stepTimer, now),
                  totalSeconds: stepTimer.totalSeconds,
                  running: isRunning(stepTimer, now),
                }
              : null
          }
          waving={wave && camera === "on"}
          listening={voice && mic === "listening"}
          heard={heard}
          onNext={goNext}
          onBack={() => stepIdx > 0 && goBack()}
          onClose={() => setFarView(false)}
          onToggleTimer={stepTimer ? () => toggle(stepTimer) : undefined}
        />
      )}
    </div>
  );
}

function EndScreen({
  dish,
  noSteps,
  chefName,
  chefConfig,
  saveControl,
  cameFromChat,
  recipePath,
  onReview,
  motionClass,
}: {
  dish: DishSuggestion;
  noSteps: boolean;
  chefName: string;
  chefConfig: string;
  saveControl: React.ReactNode;
  cameFromChat: boolean;
  recipePath: string;
  onReview: () => void;
  motionClass: string;
}) {
  if (noSteps) {
    return (
      <main className="max-w-md mx-auto px-5 pt-10 text-center space-y-5">
        <p className="font-display text-[30px] leading-tight">This recipe has no steps yet</p>
        <p className="text-stone-500">The ingredients are on the recipe page.</p>
        <Link href={recipePath} className={button("primary", "md", "w-full")}>
          Back to the recipe
        </Link>
      </main>
    );
  }
  return (
    <main className={`max-w-md mx-auto px-5 pt-8 pb-10 text-center space-y-6 ${motionClass}`}>
      <ChefAvatarBadge avatarConfig={chefConfig} size={96} title={chefName} className="mx-auto" mood="nod" />
      <div className="space-y-3">
        <h1 className="font-display text-[34px] leading-[1.1] font-medium">{`You made ${dish.title}`}</h1>
        <p className="text-stone-500 text-body">Plate it up while it&apos;s hot. Enjoy it.</p>
      </div>
      <div className="space-y-3">
        {saveControl}
        <Link href={cameFromChat ? "/chat" : "/"} className={button("secondary", "md", "w-full")}>
          {cameFromChat ? "Back to chat" : "Back to the menu"}
        </Link>
        <button
          type="button"
          onClick={onReview}
          className={button("ghost", "sm", "text-stone-500 hover:text-stone-900")}
        >
          Back to the last step
        </button>
      </div>
    </main>
  );
}
