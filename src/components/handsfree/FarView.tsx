"use client";

import React, { useEffect, useRef } from "react";
import { Hand, Mic, X } from "lucide-react";
import { button } from "@/components/ui/styles";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FarViewTimer {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
}

function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The across-the-kitchen view of cooking mode: readable from two or three metres.
 * Step number, step text and the timer are as large as the screen allows; nothing
 * else is on it. Turning the page is done by waving, by voice, or by the two big
 * halves of the screen (tap left for back, right for next) for a floury elbow.
 */
export function FarView({
  stepIndex,
  totalSteps,
  title,
  text,
  timer,
  waving,
  listening,
  heard,
  onNext,
  onBack,
  onClose,
  onToggleTimer,
}: {
  stepIndex: number;
  totalSteps: number;
  title?: string;
  text: string;
  timer?: FarViewTimer | null;
  waving: boolean;
  listening: boolean;
  heard?: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onToggleTimer?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Like the bottom sheets: focus starts on Close, Tab stays inside, and focus goes
  // back to the button that opened the far view when it closes.
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => returnTo?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const progress = totalSteps ? (stepIndex + 1) / totalSteps : 0;
  const ringR = 46;
  const ringC = 2 * Math.PI * ringR;
  const timerDone = timer ? 1 - timer.remainingSeconds / Math.max(1, timer.totalSeconds) : 0;

  return (
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Far view" className="fixed inset-0 z-[60] flex flex-col bg-stone-50 text-stone-900">
      {/* Progress runs the full width at the top, so it reads from anywhere in the room. */}
      <div className="h-3 bg-stone-200" aria-hidden>
        <div className="h-full bg-fresh-500 transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-2xl font-bold tabular-nums" aria-live="polite">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          className={button("secondary", "md", "h-14 rounded-full px-5 text-lg")}
        >
          <X className="h-6 w-6" aria-hidden />
          Close
        </button>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-6 px-6 pb-6">
        {/* Two invisible halves: tap left for back, right for next. */}
        <button type="button" aria-label="Previous step" onClick={onBack} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Next step" onClick={onNext} className="absolute inset-y-0 right-0 w-2/3" />

        {title && <p className="pointer-events-none relative font-display text-3xl font-medium text-stone-500">{title}</p>}
        <p
          key={stepIndex}
          className="pointer-events-none relative text-[clamp(2rem,7.5vw,4.5rem)] font-bold leading-[1.15] cc-step-in"
        >
          {text}
        </p>

        {timer && (
          <button
            type="button"
            onClick={onToggleTimer}
            aria-label={timer.running ? "Pause the timer" : "Start the timer"}
            className="relative z-10 flex items-center gap-6 self-start rounded-2xl pr-4 text-left"
          >
            <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90 sm:h-40 sm:w-40" aria-hidden>
              <circle cx="50" cy="50" r={ringR} fill="none" strokeWidth="8" className="stroke-stone-200" />
              <circle
                cx="50"
                cy="50"
                r={ringR}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={timer.running ? "stroke-fresh-500" : "stroke-stone-400"}
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - timerDone)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <p className={`text-[clamp(3rem,12vw,6rem)] font-bold tabular-nums leading-none ${timer.running ? "text-fresh-500" : ""}`}>
              {clock(timer.remainingSeconds)}
              <span className="mt-2 block text-xl font-bold text-stone-500">
                {timer.running ? "Tap to pause" : "Tap or say “start timer”"}
              </span>
            </p>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 pb-6 pb-safe text-lg text-stone-500">
        {waving && (
          <span className="inline-flex items-center gap-2">
            <Hand className="h-6 w-6" aria-hidden />
            Wave right for next, left for back
          </span>
        )}
        {listening && (
          <span className="inline-flex items-center gap-2">
            <Mic className="h-6 w-6 text-fresh-500" aria-hidden />
            {heard ? `Heard “${heard}”` : "Say “next”, “back”, “repeat” or “chef, …”"}
          </span>
        )}
      </div>
    </div>
  );
}
