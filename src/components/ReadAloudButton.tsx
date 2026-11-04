"use client";

import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { speak, stopSpeaking, warmUpVoices } from "@/lib/handsfree/speech";

const STORAGE_KEY = "bontaste_read_aloud";

/**
 * Hands-free cooking, first step: read each step aloud, in the chef's natural Gemini
 * voice when the server has an AI key, otherwise the best voice on the phone. Once switched on it stays on, so every new step
 * is spoken as it appears and the cook never has to touch the screen to hear it.
 * Hidden entirely on browsers without speech synthesis.
 */
export function ReadAloudButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && ("speechSynthesis" in window || "Audio" in window));
    warmUpVoices();
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Storage blocked: start switched off.
    }
  }, []);

  useEffect(() => {
    if (!supported || !on || !text) return;
    speak(text);
    return () => stopSpeaking();
  }, [supported, on, text]);

  if (!supported) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (!next) stopSpeaking();
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembered; still applies on this page.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 h-12 px-4 rounded-full border font-bold transition-colors ${
        on
          ? "bg-brand-500 border-brand-500 text-white hover:bg-brand-600"
          : "bg-stone-50 border-stone-200 text-stone-900 hover:bg-stone-100"
      }`}
    >
      <Volume2 className="w-5 h-5" aria-hidden />
      {on ? "Reading steps aloud" : "Read steps aloud"}
    </button>
  );
}
