import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The app's one set of control styles: buttons, chips and text fields. Every page
 * uses these instead of its own class strings, so a primary button looks and
 * behaves the same everywhere, in light and dark (see DESIGN.md).
 *
 * They are class-name helpers rather than components so they work on <button>,
 * next/link <Link> and <a> alike: `<Link className={button("primary")} …>`.
 */

// Teach tailwind-merge the custom font-size tokens, so `text-small` and `text-stone-500`
// on one element are not mistaken for two colours.
const merge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["caption", "small", "body"] }] } },
});

/** Joins class names; later Tailwind classes win over earlier ones. */
export function cx(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const BUTTON_SIZE: Record<ButtonSize, string> = {
  // 52px: the main action on a screen. 48px: everything else (still a full tap target).
  md: "h-[52px] px-6 text-body",
  sm: "h-12 px-4 text-small",
};

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // Ink with white text by day; herb with white text at night (brand flips in globals.css).
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "border border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-500",
  ghost: "text-stone-900 hover:bg-stone-100",
};

export function button(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: ClassValue) {
  return cx(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_VARIANT[variant], extra);
}

/** A square icon-only button, same height as `button(…, size)`. Give it an aria-label. */
export function iconButton(variant: ButtonVariant = "ghost", size: ButtonSize = "sm", extra?: ClassValue) {
  return cx(
    BUTTON_BASE,
    size === "md" ? "h-[52px] w-[52px]" : "h-12 w-12",
    BUTTON_VARIANT[variant],
    extra
  );
}

/**
 * A choice chip (cuisine filter, quick-add ingredient, name suggestion). Selected
 * chips use the same fill as the primary button, so "selected" means one thing.
 * Pair with aria-pressed on the element.
 */
export function chip(selected = false, extra?: ClassValue) {
  return cx(
    "inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-small",
    "transition-colors duration-150",
    selected
      ? "border-brand-500 bg-brand-500 font-bold text-white"
      : "border-transparent bg-stone-100 text-stone-900 hover:bg-stone-200",
    extra
  );
}

/**
 * A text field or select. The keyboard focus ring comes from globals.css
 * (input:focus-visible); the border darkening is for pointer focus.
 */
export function field(extra?: ClassValue) {
  return cx(
    "h-[52px] w-full rounded-lg border border-stone-200 bg-stone-100 px-4 text-body text-stone-900",
    "placeholder:text-stone-500 focus:border-stone-900 focus:bg-stone-50 focus:outline-none",
    "transition-colors duration-150",
    extra
  );
}

/** Text that reports a problem next to the control it is about. Use with role="alert". */
export const errorText = "text-small font-bold text-danger";
