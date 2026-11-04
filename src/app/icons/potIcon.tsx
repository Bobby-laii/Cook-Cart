import React from "react";

/**
 * The enamel pot mark (same drawing as BonTasteMark in src/components/BonTasteLogo.tsx),
 * drawn for ImageResponse. `scale` is the share of the canvas the 32-unit drawing fills;
 * maskable icons keep it inside the 80% safe zone.
 */
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
        background: "#F4F6F8",
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="7" r="2.6" fill="#F5C842" />
        <path d="M6 11.5h20v1.8H6z" fill="#2A4FBF" />
        <path d="M7 14h18v7.5a6.5 6.5 0 0 1-6.5 6.5h-5A6.5 6.5 0 0 1 7 21.5V14Z" fill="#2A4FBF" />
        <path d="M8.6 16.2h14.8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M7 16.5H4.2a1.6 1.6 0 0 0 0 3.2H7M25 16.5h2.8a1.6 1.6 0 0 1 0 3.2H25"
          stroke="#2A4FBF"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}
