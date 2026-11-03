"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "bontaste_read_aloud";

/**
 * Hands-free cooking, first step: read each step aloud with the phone's own voice
 * (Web Speech API, free, no AI key). Once switched on it stays on, so every new step
 * is spoken as it appears and the cook never has to touch the screen to hear it.
 * Hidden entirely on browsers without speech synthesis.
 */
export function ReadAloudButton({ text, lang }: { text: string; lang: "en" | "zh-HK" }) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Storage blocked: start switched off.
    }
  }, []);

  useEffect(() => {
    if (!supported || !on || !text) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "zh-HK" ? "zh-HK" : "en-US";
    utterance.rate = 0.95;
    synth.speak(utterance);
    return () => synth.cancel();
  }, [supported, on, text, lang]);

  if (!supported) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (!next) window.speechSynthesis.cancel();
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembered; still applies on this page.
    }
  };

  const zh = lang === "zh-HK";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 h-12 px-4 rounded-full border font-bold transition-colors ${
        on ? "bg-brand-500 border-brand-500 text-white" : "bg-stone-50 border-stone-300 text-stone-700 hover:border-stone-500"
      }`}
    >
      {on ? <Volume2 className="w-5 h-5" aria-hidden /> : <VolumeX className="w-5 h-5" aria-hidden />}
      {on ? (zh ? "讀出步驟：開" : "Reading steps aloud") : zh ? "讀出步驟" : "Read steps aloud"}
    </button>
  );
}
