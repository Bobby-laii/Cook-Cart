"use client";

import { useEffect, useState } from "react";
import { defaultUnitSystem, type UnitSystem } from "@/lib/units";

const STORAGE_KEY = "bontaste_units";

/**
 * The cook's metric/US choice, remembered in this browser. Storage can be blocked
 * (private windows, previews), so every access is guarded and the locale guess is
 * used when nothing is saved.
 */
export function useUnitSystem(): [UnitSystem, (next: UnitSystem) => void] {
  const [system, setSystem] = useState<UnitSystem>("metric");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable; fall through to the locale guess.
    }
    setSystem(saved === "us" || saved === "metric" ? saved : defaultUnitSystem(navigator.language));
  }, []);

  const choose = (next: UnitSystem) => {
    setSystem(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered this time; the choice still applies on this page.
    }
  };

  return [system, choose];
}
