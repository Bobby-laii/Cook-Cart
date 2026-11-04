"use client";

import React from "react";
import { Hand, Maximize2, Mic } from "lucide-react";
import type { CameraState } from "@/lib/handsfree/useWaveGesture";
import type { MicState } from "@/lib/handsfree/useVoiceCommands";
import { chip, errorText } from "@/components/ui/styles";

const CAMERA_NOTE: Partial<Record<CameraState, string>> = {
  starting: "Starting the camera…",
  blocked: "Camera is blocked. Allow it in your browser settings to wave.",
  unsupported: "This browser can't use the camera.",
};
const MIC_NOTE: Partial<Record<MicState, string>> = {
  blocked: "Microphone is blocked. Allow it in your browser settings to use your voice.",
  unsupported: "This browser can't listen. Try Chrome or Safari.",
};

function Toggle({
  on,
  onClick,
  icon,
  label,
}: {
  /** Left out for a plain action (Far view), which is not an on/off switch. */
  on?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={chip(Boolean(on), "gap-2 font-bold")}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * The hands-free switches in cooking mode: wave (camera), voice, and the far view.
 * Camera frames never leave the phone; the note under the switches says so once.
 */
export function HandsFreeControls({
  wave,
  voice,
  camera,
  mic,
  onToggleWave,
  onToggleVoice,
  onFarView,
}: {
  wave: boolean;
  voice: boolean;
  camera: CameraState;
  mic: MicState;
  onToggleWave: () => void;
  onToggleVoice: () => void;
  onFarView: () => void;
}) {
  const note = (wave && CAMERA_NOTE[camera]) || (voice && MIC_NOTE[mic]) || "";
  // "Starting the camera…" is progress, not a problem.
  const starting = note !== "" && wave && camera === "starting";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Toggle on={wave} onClick={onToggleWave} icon={<Hand className="h-5 w-5" aria-hidden />} label="Wave" />
        <Toggle on={voice} onClick={onToggleVoice} icon={<Mic className="h-5 w-5" aria-hidden />} label="Voice" />
        <Toggle onClick={onFarView} icon={<Maximize2 className="h-5 w-5" aria-hidden />} label="Far view" />
      </div>
      {note && starting ? (
        <p className="text-small text-stone-500" role="status">
          {note}
        </p>
      ) : note ? (
        <p className={errorText} role="alert">
          {note}
        </p>
      ) : wave ? (
        <p className="text-small text-stone-500">The camera only looks for a wave. Nothing is recorded or sent.</p>
      ) : null}
    </div>
  );
}
