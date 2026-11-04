"use client";

import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { iconButton } from "@/components/ui/styles";

export type ThemeChoice = "auto" | "light" | "dark";

export const THEME_KEY = "bontaste_theme";

/**
 * Runs in <head> before the page paints, so a saved choice never flashes the wrong
 * theme. "auto" leaves html[data-theme] unset and globals.css follows the phone.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "auto") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Not remembered; still applies on this page.
  }
}

/**
 * One button that flips between light and dark. Until it is first tapped the app
 * follows the phone's own setting, so most people never need it.
 */
export function ThemeSwitch() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const chosen = document.documentElement.dataset.theme;
      setDark(chosen ? chosen === "dark" : media.matches);
    };
    setDark(t ? t === "dark" : media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const flip = () => {
    const to: ThemeChoice = dark ? "light" : "dark";
    const change = () => {
      applyTheme(to);
      setDark(!dark);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return change();

    // One cross-fade of the whole page, so nothing changes colour before the rest.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => flushSync(change));
      return;
    }
    const root = document.documentElement;
    root.classList.add("theme-fading");
    change();
    window.setTimeout(() => root.classList.remove("theme-fading"), 320);
  };

  const Icon = dark ? Sun : Moon;
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className={iconButton("ghost", "sm")}
    >
      <Icon className="w-[22px] h-[22px]" strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
