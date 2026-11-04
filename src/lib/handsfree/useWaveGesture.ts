"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectSwipe, frameMotion, MIN_MOTION, type MotionSample, type Swipe } from "@/lib/handsfree/commands";
import {
  captureCameraFrameBase64,
  isCameraSupported,
  openCameraStream,
  postNativeCameraEvent,
  type CameraFacingMode,
} from "@/lib/handsfree/cameraPlatform";

export type CameraState = "off" | "starting" | "on" | "blocked" | "unsupported";

/** A tiny frame is plenty to see a hand, and keeps this cheap on an old phone. */
const W = 48;
const H = 36;
const SAMPLE_MS = 70;
/** After a wave, ignore movement for a moment so one wave turns one page. */
const COOLDOWN_MS = 1200;

export interface LiveCameraStepController {
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  motionLevel: number;
  lastSwipe: { direction: Swipe; at: number } | null;
  facingMode: CameraFacingMode;
  setFacingMode: React.Dispatch<React.SetStateAction<CameraFacingMode>>;
  captureFrame: () => Promise<string | null>;
}

/**
 * Full live camera controller for step-by-step cooking:
 * - Tracks wave gestures in real time (48x36 greyscale diff on device)
 * - Binds the active stream to an optional `<video ref={videoRef}>` preview element
 * - Supports flipping between front camera ("user", for hand waves) and rear camera
 *   ("environment", for showing the pan/ingredients to the chef)
 * - Supports React Native / Capacitor phone app camera bridges via `cameraPlatform.ts`
 */
export function useLiveCameraStep(
  enabled: boolean,
  onSwipe: (swipe: Swipe) => void,
  initialFacingMode: CameraFacingMode = "user"
): LiveCameraStepController {
  const [state, setState] = useState<CameraState>("off");
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [motionLevel, setMotionLevel] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<{ direction: Swipe; at: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    if (!enabled) {
      setState("off");
      setMotionLevel(0);
      return;
    }

    if (!isCameraSupported()) {
      setState("unsupported");
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    internalVideoRef.current = video;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let prev: Uint8ClampedArray | null = null;
    let samples: MotionSample[] = [];
    let quietUntil = 0;

    // Listen to native phone app gesture bridge if running inside React Native / Capacitor
    const unbindNativeGesture =
      typeof window !== "undefined" && window.CookCartNativeCamera?.onGestureEvent
        ? window.CookCartNativeCamera.onGestureEvent((dir) => {
            if (!cancelled) {
              setLastSwipe({ direction: dir, at: Date.now() });
              onSwipeRef.current(dir);
            }
          })
        : undefined;

    const grey = () => {
      const sourceVideo =
        videoRef.current && videoRef.current.readyState >= 2 ? videoRef.current : video;
      ctx!.drawImage(sourceVideo, 0, 0, W, H);
      const rgba = ctx!.getImageData(0, 0, W, H).data;
      const out = new Uint8ClampedArray(W * H);
      for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
        out[j] = (rgba[i] * 3 + rgba[i + 1] * 6 + rgba[i + 2]) / 10;
      }
      return out;
    };

    const tick = () => {
      const activeVideo =
        videoRef.current && videoRef.current.readyState >= 2 ? videoRef.current : video;
      if (cancelled || !ctx || activeVideo.readyState < 2) return;
      const now = performance.now();
      const frame = grey();
      if (prev && now >= quietUntil) {
        const m = frameMotion(prev, frame, W);
        // Smooth motion level indicator (0..1) for live HUD feedback
        const normalizedMotion = Math.min(1, m.amount / 0.18);
        setMotionLevel((prevLevel) =>
          Math.abs(prevLevel - normalizedMotion) > 0.04 ? normalizedMotion : prevLevel
        );

        samples.push({ t: now, amount: m.amount, x: m.x });
        samples = samples.filter((s) => now - s.t < 1000);
        const last = samples[samples.length - 1];
        if (last.amount < MIN_MOTION && samples.length > 3) {
          const rawSwipe = detectSwipe(samples);
          if (rawSwipe) {
            // Rear camera is not mirrored, so flip horizontal swipe interpretation
            const swipe: Swipe =
              facingMode === "environment"
                ? rawSwipe === "next"
                  ? "back"
                  : "next"
                : rawSwipe;
            quietUntil = now + COOLDOWN_MS;
            setLastSwipe({ direction: swipe, at: Date.now() });
            postNativeCameraEvent("wave-gesture", { direction: swipe });
            onSwipeRef.current(swipe);
          }
          if (rawSwipe || samples.every((s) => s.amount < MIN_MOTION)) samples = [];
        }
      }
      prev = frame;
    };

    setState("starting");
    openCameraStream(facingMode, 320, 240)
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        video.srcObject = s;
        await video.play().catch(() => {});

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }

        setState("on");
        postNativeCameraEvent("camera-started", { facingMode });
        timer = window.setInterval(tick, SAMPLE_MS);
      })
      .catch(() => {
        if (!cancelled) setState("blocked");
      });

    return () => {
      cancelled = true;
      unbindNativeGesture?.();
      if (timer) window.clearInterval(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [enabled, facingMode]);

  // Keep the visible `<video ref={videoRef}>` element synced if it mounts after stream starts
  useEffect(() => {
    if (state === "on" && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  const captureFrame = useCallback(async (): Promise<string | null> => {
    const activeVideo =
      videoRef.current && videoRef.current.readyState >= 2
        ? videoRef.current
        : internalVideoRef.current;
    return captureCameraFrameBase64(activeVideo, facingMode);
  }, [facingMode]);

  return {
    state,
    videoRef,
    motionLevel,
    lastSwipe,
    facingMode,
    setFacingMode,
    captureFrame,
  };
}

/**
 * Watches the front camera for a wave and calls `onSwipe("next" | "back")`.
 *
 * Everything runs on the phone: frames are shrunk to 48×36 greyscale, compared with
 * the previous frame, and thrown away. Nothing is recorded or sent anywhere. The
 * camera stops when `enabled` turns off, the page is hidden, or the component unmounts.
 */
export function useWaveGesture(enabled: boolean, onSwipe: (swipe: Swipe) => void): CameraState {
  const { state } = useLiveCameraStep(enabled, onSwipe, "user");
  return state;
}
