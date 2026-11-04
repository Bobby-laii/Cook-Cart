import React from "react";

export const INK = "#1A1A1A";
export const HERB = "#2F6B3F";

/**
 * The pot mark: a plain ink pot with a lid line, two handles and a herb-green knob.
 * Herb is the system's only accent ("something is cooking"), so it is the one dot of
 * colour in the mark. The same drawing is used for the app icon (src/app/icons).
 *
 * In the app the pot is drawn in `currentColor` and the knob in the herb token, so the
 * mark follows light and dark mode. The icon images pass fixed colours instead.
 */
export function BonTasteMark({ size = 24, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`bt-mark overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Two wisps of steam: rise once when the page opens and again on hover or tap
          (globals.css, .bt-mark). Hidden at rest, so the still mark is unchanged. */}
      <g className="bt-steam" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M11 10c-1.2-1.6 1.2-2.6 0-4.4" />
        <path d="M21 10c-1.2-1.6 1.2-2.6 0-4.4" />
      </g>
      <PotPaths ink="currentColor" herb="rgb(var(--herb-500))" />
    </svg>
  );
}

/** The mark's drawing, shared with the ImageResponse icons. */
export function PotPaths({ ink = INK, herb = HERB }: { ink?: string; herb?: string } = {}) {
  return (
    <>
      <circle className="bt-knob" cx="16" cy="7.5" r="2.4" fill={herb} />
      <path d="M5.5 12.25h21" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 15h17v6.5a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6V15Z" fill={ink} />
      <path
        d="M7.5 17.2H5a1.5 1.5 0 0 0 0 3h2.5M24.5 17.2H27a1.5 1.5 0 0 1 0 3h-2.5"
        stroke={ink}
        strokeWidth="1.8"
      />
    </>
  );
}

/**
 * Wordmark lockup: the pot mark beside "Bon Taste" in Newsreader, in ink.
 * Sizes are in em, so the lockup scales with the font size it is given.
 */
export function BonTasteLogo({ size = "md", className = "" }: { size?: "md" | "lg"; className?: string }) {
  const large = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-[0.35em] select-none leading-none text-stone-900 ${
        large ? "text-[38px]" : "text-[20px]"
      } ${className}`}
      aria-label="Bon Taste"
      role="img"
    >
      <BonTasteMark size="1em" className="shrink-0 -mt-[0.08em]" />
      <span className="font-display font-medium tracking-[-0.01em]">Bon Taste</span>
    </span>
  );
}
