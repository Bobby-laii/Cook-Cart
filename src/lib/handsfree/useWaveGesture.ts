"use client";

import { useEffect, useRef, useState } from "react";
import { detectSwipe, frameMotion, MIN_MOTION, type MotionSample, type Swipe } from "@/lib/handsfree/commands";

export type CameraState = "off" | "starting" | "on" | "blocked" | "unsupported";

/** A tiny frame is plenty to see a hand, and keeps this cheap on an old phone. */
const W = 48;
const H = 36;
const SAMPLE_MS = 70;
/** After a wave, ignore movement for a moment so one wave turns one page. */
const COOLDOWN_MS = 1200;

/**
 * Watches the front camera for a wave and calls `onSwipe("next" | "back")`.
 *
 * Everything runs on the phone: frames are shrunk to 48×36 greyscale, compared with
 * the previous frame, and thrown away. Nothing is recorded or sent anywhere. The
 * camera stops when `enabled` turns off, the page is hidden, or the component unmounts.
 */
export function useWaveGesture(enabled: boolean, onSwipe: (swipe: Swipe) => void) {
  const [state, setState] = useState<CameraState>("off");
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    if (!enabled) {
      setState("off");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let prev: Uint8ClampedArray | null = null;
    let samples: MotionSample[] = [];
    let quietUntil = 0;

    const grey = () => {
      ctx!.drawImage(video, 0, 0, W, H);
      const rgba = ctx!.getImageData(0, 0, W, H).data;
      const out = new Uint8ClampedArray(W * H);
      for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
        out[j] = (rgba[i] * 3 + rgba[i + 1] * 6 + rgba[i + 2]) / 10;
      }
      return out;
    };

    const tick = () => {
      if (cancelled || !ctx || video.readyState < 2) return;
      const now = performance.now();
      const frame = grey();
      if (prev && now >= quietUntil) {
        const m = frameMotion(prev, frame, W);
        samples.push({ t: now, amount: m.amount, x: m.x });
        samples = samples.filter((s) => now - s.t < 1000);
        // Judge the sweep once the hand has left the frame (motion stopped).
        const last = samples[samples.length - 1];
        if (last.amount < MIN_MOTION && samples.length > 3) {
          const swipe = detectSwipe(samples);
          if (swipe) {
            quietUntil = now + COOLDOWN_MS;
            onSwipeRef.current(swipe);
          }
          if (swipe || samples.every((s) => s.amount < MIN_MOTION)) samples = [];
        }
      }
      prev = frame;
    };

    setState("starting");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 160 }, height: { ideal: 120 } }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        video.srcObject = s;
        await video.play().catch(() => {});
        setState("on");
        timer = window.setInterval(tick, SAMPLE_MS);
      })
      .catch(() => {
        if (!cancelled) setState("blocked");
      });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };
  }, [enabled]);

  return state;
}
