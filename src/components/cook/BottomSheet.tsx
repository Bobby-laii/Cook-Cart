"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A real bottom sheet: fixed to the bottom, 16px top corners, one scroll area, closes
 * on Esc, the close button or a tap on the dimmed page. Focus moves into the sheet when
 * it opens, stays inside while it is open, and returns to the button that opened it.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Focus the first field if there is one (the chef's question), else the sheet itself.
    const firstField = panel?.querySelector<HTMLElement>("input, textarea");
    (firstField ?? panel)?.focus({ preventScroll: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-stone-900/40 motion-safe:animate-[cc-fade-in_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-stone-50 rounded-t-2xl outline-none motion-safe:animate-[cc-sheet-up_0.25s_ease-out]"
      >
        <style>{`@keyframes cc-sheet-up{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}`}</style>
        <div className="pt-2 flex justify-center" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-stone-200" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-2">
          <h2 id={titleId} className="text-xl font-bold text-stone-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-12 h-12 -mr-3 inline-flex items-center justify-center rounded-md text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6" aria-hidden />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && (
          <div className="px-5 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] border-t border-stone-200">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-safe" />}
      </div>
    </div>
  );
}
