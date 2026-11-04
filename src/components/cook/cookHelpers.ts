import type { RecipeStep } from "@/types";

const FRACTIONS: [number, string][] = [
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];

/** 0.75 → "¾", 2.5 → "2½", 1.2 → "1.2": kitchen-style amounts instead of raw decimals. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const whole = Math.floor(value);
  const rest = value - whole;
  if (rest < 0.05) return String(whole || Math.round(value * 10) / 10);
  if (rest > 0.95) return String(whole + 1);
  const fraction = FRACTIONS.find(([f]) => Math.abs(rest - f) < 0.04);
  if (fraction) return `${whole || ""}${fraction[1]}`;
  return String(Math.round(value * 10) / 10);
}

/** `?servings=N` from the recipe page; anything odd falls back to the dish's own count. */
export function parseServings(raw: string | null, fallback: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 50) return fallback;
  return n;
}

/** "Step 3" adds nothing above the step text; only real titles are shown. */
export function isGenericStepTitle(title: string | undefined | null): boolean {
  const t = (title ?? "").trim();
  return t === "" || /^step\s*\d+[.:]?$/i.test(t);
}

/** The step's own timer, read defensively while step data is still being reshaped. */
export function stepTimerSeconds(step: RecipeStep | undefined): number | null {
  const raw = (step as { timerSeconds?: unknown } | undefined)?.timerSeconds;
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
}

/** 600 → "10:00", 3725 → "1:02:05". */
export function formatClock(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** 600 → "10 min", 90 → "1 min 30 s", 5400 → "1 h 30 min". */
export function formatDuration(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  if (m > 0) return r > 0 ? `${m} min ${r} s` : `${m} min`;
  return `${r} s`;
}
