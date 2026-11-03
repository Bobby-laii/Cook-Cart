import React from "react";

/**
 * Bowl mark: a rice bowl seen from the side with a cherry tomato on top.
 * Ink for the bowl, tomato for the one accent, matching the rest of the system.
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
      <circle cx="16" cy="9" r="4.25" className="fill-brand-500" />
      <path d="M15.2 4.6c.6-.9 1.6-1.3 2.6-1.1" className="stroke-fresh-600" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 15h24a12 12 0 0 1-24 0Z" className="fill-stone-900" />
      <path d="M12 27.5h8" className="stroke-stone-900" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Wordmark lockup used in the navbar and footer. */
export function BonTasteLogo({ size = "md", className = "" }: { size?: "md" | "lg"; className?: string }) {
  const large = size === "lg";
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="Bon Taste">
      <BonTasteMark size={large ? 34 : 26} />
      <span
        className={`font-serif text-stone-900 leading-none tracking-tight ${large ? "text-3xl" : "text-[1.4rem]"}`}
        style={{ fontVariationSettings: '"opsz" 72, "SOFT" 50' }}
      >
        <span className="font-semibold">Bon</span> <span className="italic font-normal">Taste</span>
      </span>
    </span>
  );
}
