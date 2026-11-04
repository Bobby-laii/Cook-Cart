"use client";

import React from "react";
import { Hand, Maximize2, Mic } from "lucide-react";
import type { CameraState } from "@/lib/handsfree/useWaveGesture";
import type { MicState } from "@/lib/handsfree/useVoiceCommands";

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
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex h-12 items-center gap-2 rounded-full px-4 font-bold transition-colors duration-150 ${
        on ? "bg-brand-500 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"
      }`}
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
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Toggle on={wave} onClick={onToggleWave} icon={<Hand className="h-5 w-5" aria-hidden />} label="Wave" />
        <Toggle on={voice} onClick={onToggleVoice} icon={<Mic className="h-5 w-5" aria-hidden />} label="Voice" />
        <Toggle on={false} onClick={onFarView} icon={<Maximize2 className="h-5 w-5" aria-hidden />} label="Far view" />
      </div>
      {note ? (
        <p className="text-sm text-danger" role="status">
          {note}
        </p>
      ) : wave ? (
        <p className="text-sm text-stone-500">The camera only looks for a wave. Nothing is recorded or sent.</p>
      ) : null}
    </div>
  );
}
