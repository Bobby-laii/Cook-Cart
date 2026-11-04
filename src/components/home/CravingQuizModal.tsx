"use client";

import React, { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { CravingQuizAnswers } from "./picks";
import { button, iconButton } from "@/components/ui/styles";

const PACE_OPTIONS: {
  id: CravingQuizAnswers["pace"];
  title: string;
  desc: string;
}[] = [
  {
    id: "quick",
    title: "Tired after work — keep it fast and easy",
    desc: "Simple prep, one pan if possible, on the table without a fuss.",
  },
  {
    id: "unhurried",
    title: "Relaxed — I have a little time to unwind",
    desc: "Unhurried simmering or aromatics that make the kitchen smell good.",
  },
  {
    id: "hearty",
    title: "Really hungry — something hearty and filling",
    desc: "Satisfying, generous plates that hit the spot.",
  },
];

const STYLE_OPTIONS: {
  id: CravingQuizAnswers["style"];
  title: string;
  desc: string;
}[] = [
  {
    id: "soupy",
    title: "Warm, saucy, or soupy in a bowl",
    desc: "Broths, curries, stews, noodles, or rich sauces to spoon over rice.",
  },
  {
    id: "crispy",
    title: "Crispy, golden, or pan-seared",
    desc: "High-heat stir-fries, golden edges, or sizzling skillet dishes.",
  },
  {
    id: "fresh",
    title: "Fresh, herby, or light",
    desc: "Bright citrus, tender fish or greens, and clean flavours.",
  },
];

const FLAVOUR_OPTIONS: {
  id: CravingQuizAnswers["flavour"];
  title: string;
  desc: string;
}[] = [
  {
    id: "umami",
    title: "Savory soy, ginger, and garlic",
    desc: "East & Southeast Asian home cooking.",
  },
  {
    id: "mediterranean",
    title: "Tomato, olive oil, herbs, or creamy",
    desc: "Italian, French, Greek, and Spanish kitchen classics.",
  },
  {
    id: "spiced",
    title: "Warm spices and aromatics",
    desc: "Indian, Mexican, Moroccan, and Middle Eastern warmth.",
  },
  {
    id: "classic",
    title: "Cozy home-style comfort",
    desc: "Familiar, hearty everyday favourites.",
  },
];

export function CravingQuizModal({
  open,
  initialAnswers,
  onClose,
  onComplete,
}: {
  open: boolean;
  initialAnswers?: CravingQuizAnswers | null;
  onClose: () => void;
  onComplete: (answers: CravingQuizAnswers) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pace, setPace] = useState<CravingQuizAnswers["pace"]>(
    initialAnswers?.pace ?? "quick"
  );
  const [style, setStyle] = useState<CravingQuizAnswers["style"]>(
    initialAnswers?.style ?? "soupy"
  );
  const [flavour, setFlavour] = useState<CravingQuizAnswers["flavour"]>(
    initialAnswers?.flavour ?? "umami"
  );

  useEffect(() => {
    if (open) {
      setStep(1);
      if (initialAnswers) {
        setPace(initialAnswers.pace);
        setStyle(initialAnswers.style);
        setFlavour(initialAnswers.flavour);
      }
    }
  }, [open, initialAnswers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="craving-quiz-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/50 p-0 sm:p-5 cc-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-stone-50 border border-stone-200 p-5 sm:p-7 space-y-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-caption font-bold text-fresh-600">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {`Not sure what to eat? · Question ${step} of 3`}
            </p>
            <h2
              id="craving-quiz-title"
              className="font-display text-[26px] sm:text-[30px] leading-tight text-stone-900"
            >
              {step === 1
                ? "How does your evening feel right now?"
                : step === 2
                ? "What kind of texture or warmth sounds best?"
                : "Which flavour direction pulls you in tonight?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={iconButton("ghost", "sm", "-mr-2 -mt-1 shrink-0")}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-2.5">
            {PACE_OPTIONS.map((opt) => {
              const active = pace === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPace(opt.id);
                    setStep(2);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-stone-900 bg-stone-100 ring-1 ring-stone-900"
                      : "border-stone-200 hover:border-stone-500"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-bold text-stone-900">
                    <span>{opt.title}</span>
                    {active && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-small text-stone-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5">
            {STYLE_OPTIONS.map((opt) => {
              const active = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setStyle(opt.id);
                    setStep(3);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-stone-900 bg-stone-100 ring-1 ring-stone-900"
                      : "border-stone-200 hover:border-stone-500"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-bold text-stone-900">
                    <span>{opt.title}</span>
                    {active && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-small text-stone-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2.5">
            {FLAVOUR_OPTIONS.map((opt) => {
              const active = flavour === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFlavour(opt.id);
                    onComplete({ pace, style, flavour: opt.id });
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-stone-900 bg-stone-100 ring-1 ring-stone-900"
                      : "border-stone-200 hover:border-stone-500"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-bold text-stone-900">
                    <span>{opt.title}</span>
                    {active && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-small text-stone-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className={button("ghost", "sm", "text-stone-500 hover:text-stone-900")}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={button("ghost", "sm", "text-stone-500 hover:text-stone-900")}
            >
              Maybe later
            </button>
          )}
          <span className="text-caption text-stone-500">Tap an option to continue</span>
        </div>
      </div>
    </div>
  );
}
