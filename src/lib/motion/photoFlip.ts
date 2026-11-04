"use client";

import { useEffect, type RefObject } from "react";

/**
 * The app's one authored motion: the dish photo you tap grows into the big photo at
 * the top of the recipe. The menu remembers where the photo was on screen; the
 * recipe page plays the photo from there to its own place (FLIP: transform and
 * clip-path only, so it stays smooth on a phone). With reduced motion it is skipped.
 */

const KEY = "bontaste_photo_flip";
/** Older than this, the tap was not what brought us here (e.g. a reload). */
const MAX_AGE_MS = 2500;

interface Remembered {
  dishId: string;
  rect: { left: number; top: number; width: number; height: number };
  radius: number;
  at: number;
}

export function rememberPhoto(dishId: string, img: Element | null | undefined) {
  if (!img) return;
  const r = img.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(img.parentElement ?? img).borderTopLeftRadius) || 0;
  const entry: Remembered = {
    dishId,
    rect: { left: r.left, top: r.top, width: r.width, height: r.height },
    radius,
    at: Date.now(),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // No storage: the recipe simply appears.
  }
}

function takeRemembered(dishId: string): Remembered | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Remembered;
    if (entry.dishId !== dishId || Date.now() - entry.at > MAX_AGE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

/** Plays the arrival on the recipe page's photo once it is in the page. */
export function usePhotoArrival(ref: RefObject<HTMLElement>, dishId: string | undefined) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !dishId) return;
    const from = takeRemembered(dishId);
    if (!from || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;

    // Scale to cover the old box (the thumbnail was square, the header is 4:3), and
    // clip back to the thumbnail's own shape so it reads as the same photo growing.
    const scale = Math.max(from.rect.width / to.width, from.rect.height / to.height);
    const dx = from.rect.left + from.rect.width / 2 - (to.left + to.width / 2);
    const dy = from.rect.top + from.rect.height / 2 - (to.top + to.height / 2);
    const insetX = Math.max(0, (to.width * scale - from.rect.width) / 2 / scale);
    const insetY = Math.max(0, (to.height * scale - from.rect.height) / 2 / scale);
    const radius = from.radius / scale;

    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          clipPath: `inset(${insetY}px ${insetX}px round ${radius}px)`,
        },
        { transform: "none", clipPath: "inset(0px 0px round 0px)" },
      ],
      { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }, [ref, dishId]);
}
