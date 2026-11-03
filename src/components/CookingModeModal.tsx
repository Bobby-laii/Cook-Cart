"use client";

import React, { useState, useEffect, useRef } from "react";
import { RecipeStep } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { X, Play, Pause, RotateCcw, Sun } from "lucide-react";

interface CookingModeModalProps {
  recipeTitle: string;
  steps: RecipeStep[];
  onClose: () => void;
}

interface ActiveTimer {
  id: string;
  stepNumber: number;
  label: string;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
}

export function CookingModeModal({ recipeTitle, steps, onClose }: CookingModeModalProps) {
  const { t, language } = useLanguage();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const wakeLockRef = useRef<any>(null);

  // 1. Screen Wake Lock API implementation (Requirement 4.3)
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          setWakeLockActive(true);
        }
      } catch (err) {
        console.warn("Wake Lock not supported or rejected:", err);
      }
    }
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 2. Multi-Timer Tick Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((timer) => {
          if (!timer.isRunning || timer.remainingSeconds <= 0) return timer;
          const nextRemaining = timer.remainingSeconds - 1;
          if (nextRemaining === 0) {
            playBeepAlert();
          }
          return {
            ...timer,
            remainingSeconds: nextRemaining,
            isRunning: nextRemaining > 0,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Web Audio API beep sound for timer alert
  const playBeepAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio Context play error:", e);
    }
  };

  const handleStartTimerForStep = (stepNumber: number, durationSeconds: number, label: string) => {
    const existing = timers.find((t) => t.id === `timer_step_${stepNumber}`);
    if (existing) {
      setTimers(
        timers.map((t) =>
          t.id === existing.id ? { ...t, isRunning: true } : t
        )
      );
    } else {
      setTimers([
        ...timers,
        {
          id: `timer_step_${stepNumber}`,
          stepNumber,
          label: label || `Step ${stepNumber} Timer`,
          remainingSeconds: durationSeconds,
          totalSeconds: durationSeconds,
          isRunning: true,
        },
      ]);
    }
  };

  const handleToggleTimer = (id: string) => {
    setTimers(
      timers.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const handleResetTimer = (id: string) => {
    setTimers(
      timers.map((t) =>
        t.id === id
          ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false }
          : t
      )
    );
  };

  const currentStep = steps[currentStepIdx] || {
    step: 1,
    title: "Finish",
    text: "Bon Appétit! Enjoy your meal.",
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const zh = language === "zh-HK";
  const isLastStep = currentStepIdx >= steps.length - 1;
  const stepTitle = zh && currentStep.titleZh ? currentStep.titleZh : currentStep.title;
  const stepText = zh && currentStep.textZh ? currentStep.textZh : currentStep.text;

  const secondaryBtn =
    "inline-flex items-center justify-center h-[52px] px-5 rounded-md border border-stone-300 bg-stone-50 text-stone-900 font-bold hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const primaryBtn =
    "inline-flex items-center justify-center h-[52px] px-6 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-lg font-bold transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-100 text-stone-900 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={zh ? "烹飪模式" : "Cooking mode"}
    >
      {/* Top bar */}
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="max-w-4xl mx-auto w-full px-5 sm:px-6 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-stone-500">{zh ? "烹飪模式" : "Cooking mode"}</p>
            <h2 className="font-bold truncate">{recipeTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 flex-shrink-0 inline-flex items-center justify-center rounded-md text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label={zh ? "離開烹飪模式" : "Exit cooking mode"}
          >
            <X className="w-6 h-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-5 sm:px-6 py-6 space-y-5">
          {wakeLockActive && (
            <p className="text-sm text-stone-500 flex items-center gap-1.5">
              <Sun className="w-4 h-4" aria-hidden />
              {t("screenStayAwakeNotice")}
            </p>
          )}

          <section
            key={currentStepIdx}
            className="enamel-rim p-6 sm:p-8 space-y-4 cc-fade-in"
            aria-live="polite"
          >
            <p className="text-sm text-stone-500">
              {zh
                ? `第 ${currentStepIdx + 1} 步，共 ${steps.length} 步`
                : `Step ${currentStepIdx + 1} of ${steps.length}`}
            </p>
            {stepTitle && (
              <h3 className="text-[17px] sm:text-xl leading-snug font-bold text-stone-600">{stepTitle}</h3>
            )}
            <p className="text-[28px] sm:text-[34px] leading-[1.3] font-bold">{stepText}</p>
          </section>

          {/* Suggested timer for this step */}
          {currentStep.timerSeconds && currentStep.timerSeconds > 0 && (
            <button
              type="button"
              onClick={() =>
                handleStartTimerForStep(
                  currentStep.step,
                  currentStep.timerSeconds || 300,
                  currentStep.title
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 h-14 rounded-md bg-butter-400 hover:bg-butter-300 text-stone-900 text-lg font-bold transition-colors"
            >
              <Play className="w-5 h-5" aria-hidden />
              <span>
                {zh
                  ? `開始計時 ${formatTime(currentStep.timerSeconds)}`
                  : `Start ${formatTime(currentStep.timerSeconds)} timer`}
              </span>
            </button>
          )}

          {/* Timers */}
          {timers.length > 0 && (
            <section className="space-y-3" aria-label={zh ? "計時器" : "Timers"}>
              <h3 className="text-[22px] leading-tight font-bold">{zh ? "計時器" : "Timers"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {timers.map((timer) => {
                  const up = timer.remainingSeconds === 0;
                  return (
                    <div key={timer.id} className="bg-butter-400 text-stone-900 rounded-3xl p-5 space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm truncate">
                          {zh ? `第 ${timer.stepNumber} 步` : `Step ${timer.stepNumber}`}
                        </p>
                        <p className="text-sm font-bold" aria-live="polite">
                          {up
                            ? zh ? "時間到" : "Time's up"
                            : timer.isRunning
                            ? zh ? "計時中" : "Running"
                            : zh ? "已暫停" : "Paused"}
                        </p>
                      </div>
                      <p className="font-mono font-bold leading-none text-[64px] tracking-tight" role="timer">
                        {formatTime(timer.remainingSeconds)}
                      </p>
                      <div className="flex gap-2">
                        {!up && (
                          <button
                            type="button"
                            onClick={() => handleToggleTimer(timer.id)}
                            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-md bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors"
                          >
                            {timer.isRunning ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5" aria-hidden />}
                            {timer.isRunning ? (zh ? "暫停" : "Pause") : zh ? "繼續" : "Resume"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResetTimer(timer.id)}
                          className={`inline-flex items-center justify-center gap-2 h-12 px-4 rounded-md font-bold transition-colors ${
                            up
                              ? "flex-1 bg-stone-900 text-white hover:bg-stone-800"
                              : "border-2 border-stone-900/25 hover:bg-butter-300"
                          }`}
                        >
                          <RotateCcw className="w-5 h-5" aria-hidden />
                          {zh ? "重設" : "Reset"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Back / Next in thumb reach */}
      <div className="border-t border-stone-200 bg-stone-50 pb-safe">
        <div className="max-w-4xl mx-auto w-full px-5 sm:px-6 py-3 flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
            disabled={currentStepIdx === 0}
            className={`${secondaryBtn} flex-1`}
          >
            {t("back")}
          </button>
          {isLastStep ? (
            <button type="button" onClick={onClose} className={`${primaryBtn} flex-[2]`}>
              {zh ? "完成烹飪" : "Finish cooking"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
              className={`${primaryBtn} flex-[2]`}
            >
              {t("next")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
