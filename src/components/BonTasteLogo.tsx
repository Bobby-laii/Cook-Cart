import React from "react";

/**
 * Enamel pot mark: a cobalt pot with a white enamel rim, two handles and a butter
 * lid knob. Butter is the system's "live" colour, so the knob reads as "something
 * is cooking". The same drawing is used for the app icon (src/app/icons).
 */
export function BonTasteMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="7" r="2.6" fill="#F5C842" />
      <path d="M6 11.5h20v1.8H6z" fill="#2A4FBF" />
      <path d="M7 14h18v7.5a6.5 6.5 0 0 1-6.5 6.5h-5A6.5 6.5 0 0 1 7 21.5V14Z" fill="#2A4FBF" />
      <path d="M8.6 16.2h14.8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 16.5H4.2a1.6 1.6 0 0 0 0 3.2H7M25 16.5h2.8a1.6 1.6 0 0 1 0 3.2H25" stroke="#2A4FBF" strokeWidth="1.8" />
    </svg>
  );
}

/** Wordmark lockup used in the app bar. */
export function BonTasteLogo({ size = "md", className = "" }: { size?: "md" | "lg"; className?: string }) {
  const large = size === "lg";
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="Bon Taste">
      <BonTasteMark size={large ? 36 : 28} />
      <span className={`font-bold tracking-tight text-brand-600 leading-none ${large ? "text-3xl" : "text-xl"}`}>
        Bon Taste
      </span>
    </span>
  );
}
