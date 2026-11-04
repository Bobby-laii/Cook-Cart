"use client";

import { useEffect, useRef, useState } from "react";
import { parseCommand, type CookCommand } from "@/lib/handsfree/commands";

export type MicState = "off" | "listening" | "blocked" | "unsupported";

/* The Web Speech API isn't in TypeScript's DOM types; this is the part we use. */
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function makeRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function voiceSupported() {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Listens for cooking commands ("next", "back", "repeat", "start timer",
 * "chef, can I use butter?") while `enabled`, using the browser's own speech
 * recognition. Keeps listening across pauses; stops when disabled or unmounted.
 * `heard` is the last phrase, so the screen can show what it understood.
 */
export function useVoiceCommands(enabled: boolean, onCommand: (command: CookCommand) => void) {
  const [state, setState] = useState<MicState>("off");
  const [heard, setHeard] = useState("");
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) {
      setState("off");
      setHeard("");
      return;
    }
    const rec = makeRecognition();
    if (!rec) {
      setState("unsupported");
      return;
    }

    let stopped = false;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result.isFinal) continue;
        const text = result[0]?.transcript ?? "";
        const command = parseCommand(text);
        if (command) {
          setHeard(text.trim());
          onCommandRef.current(command);
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        setState("blocked");
      }
    };
    // Browsers end recognition after a silence; start it again while switched on.
    rec.onend = () => {
      if (stopped) return;
      try {
        rec.start();
      } catch {
        // Already restarting.
      }
    };

    try {
      rec.start();
      setState("listening");
    } catch {
      setState("blocked");
    }

    return () => {
      stopped = true;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // Not running.
      }
    };
  }, [enabled]);

  return { state, heard };
}

/**
 * Listens for one phrase (the mic button in Ask the chef) and resolves with what was
 * said, or "" if nothing was heard, permission was refused or the browser can't listen.
 */
export function listenOnce(timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    const rec = makeRecognition();
    if (!rec) return resolve("");
    let done = false;
    const finish = (text: string) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      try {
        rec.stop();
      } catch {
        // Already stopped.
      }
      resolve(text.trim());
    };
    const timer = window.setTimeout(() => finish(""), timeoutMs);
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => finish(e.results[e.resultIndex]?.[0]?.transcript ?? "");
    rec.onerror = () => finish("");
    rec.onend = () => finish("");
    try {
      rec.start();
    } catch {
      finish("");
    }
  });
}

export { speak, stopSpeaking } from "@/lib/handsfree/speech";
