"use client";

import React, { useState, useEffect, useRef } from "react";
import { RecipeStep } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Sun,
  Flame,
  CheckCircle,
} from "lucide-react";

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

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4 max-w-5xl mx-auto w-full">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-400 font-bold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-brand-500" />
            {language === "zh-HK" ? "沉浸式烹飪模式" : "Interactive Cooking Mode"}
          </span>
          <h2 className="text-lg sm:text-xl font-bold truncate max-w-md sm:max-w-xl text-stone-200">
            {recipeTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {wakeLockActive && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-full">
              <Sun className="w-3.5 h-3.5" />
              <span>{t("screenStayAwakeNotice")}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            aria-label="Exit Cooking Mode"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Large Step Display */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-6">
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-brand-500 text-white text-sm font-black">
            {t("step")} {currentStepIdx + 1} / {steps.length}
          </span>
          <h3 className="text-xl sm:text-3xl font-extrabold text-stone-100">
            {language === "zh-HK" && currentStep.titleZh
              ? currentStep.titleZh
              : currentStep.title}
          </h3>
        </div>

        {/* Large Readable Text (Accessibility requirement 6 & 4.3) */}
        <p className="text-2xl sm:text-4xl lg:text-5xl font-medium text-stone-200 leading-snug tracking-tight">
          {language === "zh-HK" && currentStep.textZh
            ? currentStep.textZh
            : currentStep.text}
        </p>

        {/* Suggested Timer for this step if specified */}
        {currentStep.timerSeconds && currentStep.timerSeconds > 0 && (
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() =>
                handleStartTimerForStep(
                  currentStep.step,
                  currentStep.timerSeconds || 300,
                  currentStep.title
                )
              }
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-base font-bold shadow-lg transition"
            >
              <Bell className="w-5 h-5" />
              <span>
                {language === "zh-HK"
                  ? `啟動此步驟計時 (${formatTime(currentStep.timerSeconds)})`
                  : `Start Timer (${formatTime(currentStep.timerSeconds)})`}
              </span>
            </button>
          </div>
        )}

        {/* Active Timers Panel */}
        {timers.length > 0 && (
          <div className="mt-8 p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-bold">
              {language === "zh-HK" ? "運行中之計時器" : "Active Timers"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {timers.map((timer) => (
                <div
                  key={timer.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    timer.remainingSeconds === 0
                      ? "bg-red-950/80 border-red-500 text-red-200 animate-pulse"
                      : "bg-stone-800 border-stone-700 text-stone-100"
                  }`}
                >
                  <div>
                    <p className="text-xs text-stone-400 font-medium truncate max-w-[150px]">
                      {timer.label}
                    </p>
                    <p className="text-2xl font-black font-mono tracking-wider">
                      {formatTime(timer.remainingSeconds)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleTimer(timer.id)}
                      className="p-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-white"
                      title={timer.isRunning ? "Pause" : "Resume"}
                    >
                      {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleResetTimer(timer.id)}
                      className="p-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Large Navigation Buttons */}
      <div className="max-w-5xl mx-auto w-full pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
          disabled={currentStepIdx === 0}
          className="flex-1 max-w-[200px] py-4 rounded-2xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-white text-base font-bold flex items-center justify-center gap-2 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </button>

        <span className="text-sm font-bold text-stone-500">
          {currentStepIdx + 1} / {steps.length}
        </span>

        {currentStepIdx < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
            className="flex-1 max-w-[200px] py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg transition"
          >
            <span>{t("next")}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex-1 max-w-[200px] py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg transition"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{language === "zh-HK" ? "烹飪完成！" : "Finish Cooking"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
