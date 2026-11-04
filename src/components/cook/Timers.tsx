"use client";

import React, { useState } from "react";
import { Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { formatClock, formatDuration } from "./cookHelpers";

export interface CookTimer {
  id: string;
  label: string;
  totalSeconds: number;
  /** Seconds left when paused; while running, the truth is `endsAt`. */
  remainingSeconds: number;
  /** Epoch ms the timer reaches zero; set only while running. */
  endsAt: number | null;
}

export function remainingOf(t: CookTimer, now: number): number {
  if (t.endsAt === null) return t.remainingSeconds;
  return Math.max(0, Math.ceil((t.endsAt - now) / 1000));
}

export function isRunning(t: CookTimer, now: number): boolean {
  return t.endsAt !== null && remainingOf(t, now) > 0;
}

export function startTimer(t: CookTimer, now: number): CookTimer {
  const left = t.remainingSeconds > 0 ? t.remainingSeconds : t.totalSeconds;
  return { ...t, remainingSeconds: left, endsAt: now + left * 1000 };
}

export function pauseTimer(t: CookTimer, now: number): CookTimer {
  return { ...t, remainingSeconds: remainingOf(t, now), endsAt: null };
}

export function resetTimer(t: CookTimer): CookTimer {
  return { ...t, remainingSeconds: t.totalSeconds, endsAt: null };
}

/** A soft two-note chime; no file to download, works offline. */
export function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.45].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(i === 0 ? 880 : 660, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.8);
    });
  } catch {
    // No audio: the screen still says "Time's up".
  }
}

/**
 * The step's own timer as one big button. Before it starts it shows the duration;
 * running it turns herb and counts down; tapping it pauses and resumes.
 */
export function StepTimerButton({
  timer,
  now,
  onToggle,
  onReset,
}: {
  timer: CookTimer;
  now: number;
  onToggle: () => void;
  onReset: () => void;
}) {
  const left = remainingOf(timer, now);
  const running = isRunning(timer, now);
  const done = timer.endsAt !== null && left === 0;
  const started = running || done || left !== timer.totalSeconds;

  const state = done ? "Time's up" : running ? "Tap to pause" : started ? "Paused, tap to resume" : "Start timer";
  const tone = done
    ? "bg-stone-50 text-fresh-600 ring-2 ring-inset ring-fresh-500"
    : running
    ? "bg-fresh-500 text-white hover:bg-fresh-600"
    : "bg-stone-100 text-stone-900 hover:bg-stone-200";

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={done ? onReset : onToggle}
        aria-label={
          done
            ? `Time's up. Reset the ${formatDuration(timer.totalSeconds)} timer`
            : running
            ? `Pause timer, ${formatClock(left)} left`
            : `${started ? "Resume" : "Start"} ${formatDuration(timer.totalSeconds)} timer`
        }
        className={`flex-1 min-w-0 min-h-[76px] px-5 rounded-md flex items-center gap-4 text-left transition-colors ${tone}`}
      >
        <span className="flex-shrink-0">
          {done ? (
            <Timer className="w-7 h-7" aria-hidden />
          ) : running ? (
            <Pause className="w-7 h-7" aria-hidden />
          ) : (
            <Play className="w-7 h-7" aria-hidden />
          )}
        </span>
        <span className="flex flex-col min-w-0">
          <span
            className="font-mono font-bold text-[40px] leading-none tabular-nums tracking-tight"
            role="timer"
            aria-live="off"
          >
            {formatClock(left)}
          </span>
          <span className="text-[15px] font-bold mt-1" aria-live="polite">
            {state}
          </span>
        </span>
      </button>
      {started && (
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset timer"
          className="w-14 flex-shrink-0 inline-flex items-center justify-center rounded-md border border-stone-200 text-stone-900 hover:bg-stone-100 transition-colors"
        >
          <RotateCcw className="w-6 h-6" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** A compact row for any other timer: added ones, or another step's that still runs. */
export function TimerRow({
  timer,
  now,
  onToggle,
  onDismiss,
}: {
  timer: CookTimer;
  now: number;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const left = remainingOf(timer, now);
  const running = isRunning(timer, now);
  const done = timer.endsAt !== null && left === 0;
  return (
    <li
      className={`flex items-center gap-2 pl-4 pr-1 min-h-[56px] rounded-md ${
        running ? "bg-fresh-500 text-white" : done ? "ring-2 ring-inset ring-fresh-500 text-fresh-600" : "bg-stone-100 text-stone-900"
      }`}
    >
      <span className="flex-1 min-w-0 truncate font-bold">{done ? `${timer.label}: time's up` : timer.label}</span>
      <span className="font-mono font-bold text-xl tabular-nums" role="timer">
        {formatClock(left)}
      </span>
      {!done && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={running ? `Pause ${timer.label}` : `Resume ${timer.label}`}
          className="w-12 h-12 inline-flex items-center justify-center rounded-md"
        >
          {running ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5" aria-hidden />}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Remove ${timer.label}`}
        className="w-12 h-12 inline-flex items-center justify-center rounded-md"
      >
        <X className="w-5 h-5" aria-hidden />
      </button>
    </li>
  );
}

const PRESETS = [60, 300, 600];

/** "Add a timer": closed it is one quiet button; open it offers a few lengths. */
export function AddTimerControl({ onAdd }: { onAdd: (seconds: number) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="inline-flex items-center gap-2 h-12 px-1 text-stone-500 font-bold hover:text-stone-900 transition-colors"
      >
        <Plus className="w-5 h-5" aria-hidden />
        Add a timer
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Add a timer">
      {PRESETS.map((sec) => (
        <button
          key={sec}
          type="button"
          onClick={() => {
            onAdd(sec);
            setOpen(false);
          }}
          className="h-12 px-4 rounded-full bg-stone-100 text-stone-900 font-bold hover:bg-stone-200 transition-colors"
        >
          {formatDuration(sec)}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cancel adding a timer"
        className="w-12 h-12 inline-flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
      >
        <X className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}
