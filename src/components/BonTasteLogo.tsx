"use client";

import React from "react";

interface BonTasteLogoProps {
  variant?: "navbar" | "hero" | "footer";
  className?: string;
}

/**
 * Concentric double-ring plate icon ("O" in BON TASTE)
 */
export function BonTastePlateIcon({
  size = 28,
  light = false,
  className = "",
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  const outerStroke = light ? "#F8F9FA" : "#0F2A3D";
  const innerStroke = light ? "#7DA3B8" : "#7DA3B8";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Rim (Deep Navy) */}
      <circle cx="20" cy="20" r="17.5" stroke={outerStroke} strokeWidth="2.1" />
      {/* Inner Plate Well (Soft Slate Blue) */}
      <circle cx="20" cy="20" r="12.8" stroke={innerStroke} strokeWidth="1.25" />
    </svg>
  );
}

/**
 * Official BON TASTE Brand Lockup
 * Faithfully reproduces the double-rule classical serif logo & concentric plate "O".
 */
export function BonTasteLogo({ variant = "navbar", className = "" }: BonTasteLogoProps) {
  if (variant === "hero") {
    return (
      <div className={`inline-block select-none ${className}`} aria-label="BON TASTE">
        {/* Top Double Hairline Rule */}
        <div className="w-full space-y-[2.5px] mb-5">
          <div className="h-[1.25px] bg-[#0F2A3D] w-full" />
          <div className="h-[1px] bg-[#4E7B94] w-full" />
        </div>

        {/* Two-tier Offset Wordmark: B O N / T A S T E */}
        <div className="px-2 sm:px-4">
          <div className="flex items-center gap-3 sm:gap-4 text-[#0F2A3D] font-serif text-4xl sm:text-5xl font-medium tracking-[0.28em] leading-none">
            <span>B</span>
            <BonTastePlateIcon size={40} className="shrink-0 -mx-1" />
            <span>N</span>
          </div>
          <div className="mt-2 sm:mt-2.5 pl-20 sm:pl-28 text-[#4E7B94] font-serif text-3xl sm:text-4xl font-normal tracking-[0.32em] leading-none">
            TASTE
          </div>
        </div>

        {/* Bottom Double Hairline Rule */}
        <div className="w-full space-y-[2.5px] mt-5">
          <div className="h-[1.25px] bg-[#0F2A3D] w-full" />
          <div className="h-[1px] bg-[#4E7B94] w-full" />
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`inline-flex flex-col select-none ${className}`} aria-label="BON TASTE">
        <div className="w-full space-y-[2px] mb-2">
          <div className="h-[1px] bg-stone-300/70 w-full" />
          <div className="h-[1px] bg-[#7DA3B8]/60 w-full" />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="inline-flex items-center gap-1.5 font-serif text-xl font-semibold tracking-[0.24em] text-white">
            <span>B</span>
            <BonTastePlateIcon size={20} light className="-mx-0.5 translate-y-[2px]" />
            <span>N</span>
          </span>
          <span className="font-serif text-lg tracking-[0.28em] text-[#7DA3B8]">
            TASTE
          </span>
        </div>
        <div className="w-full space-y-[2px] mt-2">
          <div className="h-[1px] bg-stone-300/70 w-full" />
          <div className="h-[1px] bg-[#7DA3B8]/60 w-full" />
        </div>
      </div>
    );
  }

  // Default: "navbar" compact lockup with top & bottom double hairline rules
  return (
    <div className={`inline-flex flex-col select-none group ${className}`} aria-label="BON TASTE">
      <div className="w-full space-y-[1.5px] mb-1">
        <div className="h-[1px] bg-[#0F2A3D] w-full transition-colors group-hover:bg-[#4E7B94]" />
        <div className="h-[1px] bg-[#4E7B94]/80 w-full" />
      </div>
      <div className="flex items-center gap-2 px-0.5">
        <span className="inline-flex items-center gap-1 font-serif text-lg sm:text-xl font-semibold tracking-[0.22em] text-[#0F2A3D] leading-none">
          <span>B</span>
          <BonTastePlateIcon size={19} className="-mx-0.5" />
          <span>N</span>
        </span>
        <span className="font-serif text-base sm:text-lg font-normal tracking-[0.26em] text-[#4E7B94] leading-none">
          TASTE
        </span>
      </div>
      <div className="w-full space-y-[1.5px] mt-1">
        <div className="h-[1px] bg-[#0F2A3D] w-full transition-colors group-hover:bg-[#4E7B94]" />
        <div className="h-[1px] bg-[#4E7B94]/80 w-full" />
      </div>
    </div>
  );
}

