"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Camera, Check, Eye, Hand, Loader2, RefreshCw } from "lucide-react";
import type { CameraState } from "@/lib/handsfree/useWaveGesture";
import type { Swipe } from "@/lib/handsfree/commands";
import type { CameraFacingMode } from "@/lib/handsfree/cameraPlatform";
import { speak } from "@/lib/handsfree/useVoiceCommands";
import { button, chip, errorText } from "@/components/ui/styles";

interface StepCheckResult {
  feedback: string;
  status: "ready" | "keep-going" | "adjust-heat";
  readyForNext: boolean;
}

export function LiveCameraStepFeed({
  cameraState,
  videoRef,
  motionLevel,
  lastSwipe,
  facingMode,
  onToggleFacingMode,
  captureFrame,
  dishTitle,
  stepNumber,
  totalSteps,
  stepTitle,
  stepText,
  speakFeedback = false,
  triggerCheckId,
  onNextStep,
  onBackStep,
}: {
  cameraState: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  motionLevel: number;
  lastSwipe: { direction: Swipe; at: number } | null;
  facingMode: CameraFacingMode;
  onToggleFacingMode: () => void;
  captureFrame: () => Promise<string | null>;
  dishTitle: string;
  stepNumber: number;
  totalSteps: number;
  stepTitle?: string | null;
  stepText: string;
  speakFeedback?: boolean;
  /** Incrementing timestamp/id from voice command ("check pan") triggers a live frame check. */
  triggerCheckId?: number | null;
  onNextStep?: () => void;
  onBackStep?: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [autoWatch, setAutoWatch] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [result, setResult] = useState<StepCheckResult | null>(null);

  // Clear previous step's inspection when moving to a new step
  useEffect(() => {
    setResult(null);
    setCheckError(false);
  }, [stepNumber]);

  const handleCheckStep = useCallback(async () => {
    if (checking || cameraState !== "on") return;
    setChecking(true);
    setCheckError(false);
    try {
      const frameBase64 = await captureFrame();
      if (!frameBase64) {
        setCheckError(true);
        return;
      }

      const res = await fetch("/api/ai/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "step-check",
          imageBase64: frameBase64,
          dishTitle,
          stepNumber,
          totalSteps,
          stepTitle: stepTitle || undefined,
          stepText,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.feedback) {
        const nextResult: StepCheckResult = {
          feedback: data.feedback,
          status: data.status || "ready",
          readyForNext: Boolean(data.readyForNext ?? true),
        };
        setResult(nextResult);
        if (speakFeedback) {
          speak(nextResult.feedback);
        }
      } else {
        setCheckError(true);
      }
    } catch {
      setCheckError(true);
    } finally {
      setChecking(false);
    }
  }, [
    checking,
    cameraState,
    captureFrame,
    dishTitle,
    stepNumber,
    totalSteps,
    stepTitle,
    stepText,
    speakFeedback,
  ]);

  useEffect(() => {
    if (!triggerCheckId) return;
    handleCheckStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCheckId]);

  // Auto-watch mode: periodically inspect a live frame every 15 seconds while cooking
  useEffect(() => {
    if (!autoWatch || cameraState !== "on") return;
    const iv = window.setInterval(() => {
      handleCheckStep();
    }, 15000);
    return () => window.clearInterval(iv);
  }, [autoWatch, cameraState, handleCheckStep]);

  if (cameraState !== "on" && cameraState !== "starting") {
    return null;
  }

  const recentSwipe =
    lastSwipe && Date.now() - lastSwipe.at < 2500 ? lastSwipe.direction : null;

  return (
    <section
      aria-label="Live camera step assistant"
      className="enamel-rim p-4 sm:p-5 space-y-3 cc-fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative w-full sm:w-52 aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-200">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="Live kitchen camera preview"
            className={`w-full h-full object-cover ${
              facingMode === "user" ? "-scale-x-100" : ""
            }`}
          />
          <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-md bg-stone-50/90 px-2.5 py-1 text-small text-stone-900">
            <Hand className="w-4 h-4 text-fresh-500 flex-shrink-0" aria-hidden />
            <div
              className="h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-fresh-500 transition-[width] duration-150"
                style={{ width: `${Math.max(8, Math.round(motionLevel * 100))}%` }}
              />
            </div>
            <span className="font-mono text-[12px] text-stone-600">
              {recentSwipe === "next"
                ? "Wave -> Next"
                : recentSwipe === "back"
                ? "Wave <- Back"
                : cameraState === "starting"
                ? "Starting…"
                : "Live"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="space-y-1">
            <p className="text-sm font-bold text-stone-900">
              Live camera · Step {stepNumber} of {totalSteps}
            </p>
            <p className="text-small text-stone-500">
              Wave right for the next step, wave left to go back, or show the pan to the chef to check this step.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCheckStep}
              disabled={checking || cameraState !== "on"}
              className={button("primary", "sm")}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
              ) : (
                <Camera className="w-4 h-4" aria-hidden />
              )}
              {checking ? "Checking step…" : "Show the chef"}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !autoWatch;
                setAutoWatch(next);
                if (next && !result) handleCheckStep();
              }}
              disabled={cameraState !== "on"}
              aria-pressed={autoWatch}
              className={chip(autoWatch, "gap-1.5")}
            >
              <Eye className="w-4 h-4" aria-hidden />
              {autoWatch ? "Auto watch on" : "Auto watch"}
            </button>

            <button
              type="button"
              onClick={onToggleFacingMode}
              disabled={cameraState !== "on"}
              aria-label={
                facingMode === "user" ? "Switch to rear camera" : "Switch to front camera"
              }
              className={chip(false, "gap-1.5")}
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              {facingMode === "user" ? "Front cam" : "Rear cam"}
            </button>
          </div>
        </div>
      </div>

      {checkError && (
        <p role="alert" className={errorText}>
          Couldn&apos;t check the camera frame just now. Try again in a moment.
        </p>
      )}

      {result && (
        <div
          aria-live="polite"
          className="rounded-xl bg-stone-100 p-4 space-y-3 border border-stone-200 cc-fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-stone-600">Chef&apos;s live step check</p>
            <span className="text-small font-bold text-fresh-600">
              {result.status === "ready" ? "Ready for next step" : "In progress"}
            </span>
          </div>
          <p className="text-body leading-relaxed text-stone-900">{result.feedback}</p>
          <div className="flex flex-wrap gap-2">
            {result.readyForNext && onNextStep && (
              <button
                type="button"
                onClick={onNextStep}
                className={button("primary", "sm")}
              >
                <Check className="w-4 h-4" aria-hidden />
                Next step
              </button>
            )}
            {onBackStep && stepNumber > 1 && (
              <button
                type="button"
                onClick={onBackStep}
                className={button("secondary", "sm")}
              >
                Previous step
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
