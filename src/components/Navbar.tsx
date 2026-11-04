"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { BonTasteMark } from "@/components/BonTasteLogo";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { BookOpen, CircleUser, MessageCircle, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { button, iconButton } from "@/components/ui/styles";

/**
 * How far the header travels before it is fully compact, in px.
 * Crucially, both PhoneHeader and DesktopHeader use `sticky` with `top: -COLLAPSE`
 * and `paddingTop: COLLAPSE`, and animate ONLY with CSS `transform` (`scale` + `translateY`).
 * Because the DOM box height of `<header>` never changes, scrolling can never trigger
 * a layout-shift feedback loop (oscillating bigger/smaller).
 */
const COLLAPSE = 44;
const LIFT = 14;

function useScrollCollapse(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const p = reduce.matches ? (y > COLLAPSE / 2 ? 1 : 0) : Math.min(1, y / COLLAPSE);
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    reduce.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      reduce.removeEventListener("change", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

export function Navbar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname() ?? "/";
  const isCookMode = /^\/recipe\/[^/]+\/cook(\/|$)/.test(pathname);
  const onLogin = pathname === "/login";
  const onRegister = pathname === "/register";

  useEffect(() => {
    if (isCookMode) {
      document.body.dataset.tabbar = "hidden";
    } else {
      delete document.body.dataset.tabbar;
    }
    return () => {
      delete document.body.dataset.tabbar;
    };
  }, [isCookMode]);

  const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: "Menu", icon: UtensilsCrossed },
    { href: "/chat", label: "Ask the chef", icon: MessageCircle },
    { href: "/my-recipes", label: t("navMyRecipes"), icon: BookOpen },
  ];

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/recipe/")
      : pathname === href || pathname.startsWith(`${href}/`);

  if (isCookMode) return null;

  return (
    <>
      <PhoneHeader signedIn={Boolean(user)} hideSignIn={onLogin} />

      <DesktopHeader
        navLinks={navLinks}
        isActive={isActive}
        user={user}
        onLogin={onLogin}
        onRegister={onRegister}
        t={t}
      />

      <nav
        aria-label="Main"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-stone-50 border-t border-stone-200 pb-safe"
      >
        <ul className="grid grid-cols-3 h-[var(--tabbar-h)]">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href} className="flex">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-12 text-[0.8125rem] leading-none rounded-lg -outline-offset-4 transition-colors ${
                    active ? "text-stone-900 font-bold" : "text-stone-500 active:text-stone-900"
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.6} aria-hidden="true" />
                  <span className="truncate max-w-full px-1">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/**
 * Desktop header: uses the same fixed-height sticky technique as PhoneHeader
 * (`top: -COLLAPSE`, `paddingTop: COLLAPSE`, and transform scale) so the logo
 * starts at 42px and shrinks to 22px as you scroll without ever changing layout height.
 */
function DesktopHeader({
  navLinks,
  isActive,
  user,
  onLogin,
  onRegister,
  t,
}: {
  navLinks: { href: string; label: string; icon: LucideIcon }[];
  isActive: (href: string) => boolean;
  user: ReturnType<typeof useAuth>["user"];
  onLogin: boolean;
  onRegister: boolean;
  t: (key: any) => string;
}) {
  const ref = useRef<HTMLElement>(null);
  useScrollCollapse(ref);

  const lift = `translateY(calc((1 - var(--p)) * -${LIFT}px))`;

  return (
    <header
      ref={ref}
      className="hidden md:block sticky z-50 bg-stone-50/95 backdrop-blur-sm"
      style={
        {
          "--p": 0,
          top: -COLLAPSE,
          paddingTop: `${COLLAPSE}px`,
        } as React.CSSProperties
      }
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="Bon Taste home"
          className="flex items-center h-12 rounded-lg origin-left will-change-transform"
          style={{ transform: `${lift} scale(calc(1 - var(--p) * 0.46))` }}
        >
          <span className="inline-flex items-center gap-[0.32em] text-[42px] leading-none text-stone-900 select-none">
            <BonTasteMark size="0.98em" className="shrink-0 -mt-[0.08em]" />
            <span className="font-display font-medium tracking-[-0.01em] whitespace-nowrap">
              Bon Taste
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="flex items-center gap-1 text-small will-change-transform"
          style={{ transform: lift }}
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center h-12 px-3 rounded-lg transition-colors ${
                  active ? "text-stone-900 font-bold" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 will-change-transform" style={{ transform: lift }}>
          <ThemeSwitch />
          {user ? (
            <AccountMenu />
          ) : (
            <>
              {!onLogin && (
                <Link
                  href="/login"
                  className={button(
                    "ghost",
                    "sm",
                    "px-3 font-normal text-stone-700 hover:bg-transparent hover:text-stone-900"
                  )}
                >
                  {t("navLogin")}
                </Link>
              )}
              {!onRegister && (
                <Link href="/register" className={button("primary", "sm")}>
                  {t("navRegister")}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="h-px bg-stone-200"
        style={{ opacity: "clamp(0, calc((var(--p) - 0.5) * 2), 1)" }}
      />
    </header>
  );
}

/**
 * Phone header: starts with a bold 42px logo at the top of the page and smoothly
 * scales down to 20px as the user scrolls (`--p` from 0 to 1), without changing layout height.
 */
function PhoneHeader({ signedIn, hideSignIn }: { signedIn: boolean; hideSignIn: boolean }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  useScrollCollapse(ref);

  const lift = `translateY(calc((1 - var(--p)) * -${LIFT}px))`;

  return (
    <header
      ref={ref}
      className="md:hidden sticky z-50 bg-stone-50"
      style={
        {
          "--p": 0,
          top: -COLLAPSE,
          paddingTop: `calc(${COLLAPSE}px + env(safe-area-inset-top))`,
        } as React.CSSProperties
      }
    >
      <div className="relative h-14 px-5 flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Bon Taste home"
          className="flex items-center h-12 min-w-0 rounded-lg origin-left will-change-transform"
          style={{ transform: `${lift} scale(calc(1 - var(--p) * 0.52))` }}
        >
          <span className="inline-flex items-center gap-[0.3em] text-[42px] leading-none text-stone-900 select-none">
            <BonTasteMark size="0.98em" className="shrink-0 -mt-[0.08em]" />
            <span className="font-display font-medium tracking-[-0.01em] whitespace-nowrap">
              Bon Taste
            </span>
          </span>
        </Link>

        <div className="shrink-0 -mr-2 flex items-center will-change-transform" style={{ transform: lift }}>
          <ThemeSwitch />
          {signedIn ? (
            <AccountMenu />
          ) : hideSignIn ? null : (
            <Link href="/login" className={button("ghost", "sm", "px-3 font-normal")}>
              {t("navLogin")}
            </Link>
          )}
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-stone-200"
          style={{ opacity: "clamp(0, calc((var(--p) - 0.5) * 2), 1)" }}
        />
      </div>
    </header>
  );
}

/** A small account button: who is signed in, chef settings, and sign out. */
function AccountMenu() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account"
        className={iconButton("ghost", "sm")}
      >
        <CircleUser className="w-6 h-6" strokeWidth={1.6} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-stone-200 bg-stone-50 py-2 z-50">
          <p className="px-4 pt-1 pb-3 border-b border-stone-200">
            <span className="block text-caption text-stone-500">Signed in as</span>
            <span className="block font-bold text-stone-900 truncate">{user.name}</span>
          </p>
          <Link
            href="/chef-settings"
            className="flex items-center min-h-12 px-4 text-stone-900 hover:bg-stone-100"
          >
            Chef settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center min-h-12 px-4 text-left text-stone-900 hover:bg-stone-100"
          >
            {t("navLogout")}
          </button>
        </div>
      )}
    </div>
  );
}
