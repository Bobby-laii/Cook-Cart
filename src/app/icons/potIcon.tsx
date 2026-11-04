import React from "react";

/**
 * The pot mark (same drawing as BonTasteMark in src/components/BonTasteLogo.tsx):
 * an ink pot with a herb-green knob on white, drawn for ImageResponse. `scale` is the
 * share of the canvas the 32-unit drawing fills; maskable icons keep it inside the
 * 80% safe zone.
 */
const INK = "#1A1A1A";
const HERB = "#2F6B3F";

export function PotIcon({ size, scale }: { size: number; scale: number }) {
  const mark = Math.round(size * scale);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="7.5" r="2.4" fill={HERB} />
        <path d="M5.5 12.25h21" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <path d="M7.5 15h17v6.5a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6V15Z" fill={INK} />
        <path
          d="M7.5 17.2H5a1.5 1.5 0 0 0 0 3h2.5M24.5 17.2H27a1.5 1.5 0 0 1 0 3h-2.5"
          stroke={INK}
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}
