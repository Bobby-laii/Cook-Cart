"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { BonTasteLogo } from "@/components/BonTasteLogo";
import { BookOpen, MessageCircle, UtensilsCrossed, type LucideIcon } from "lucide-react";

/**
 * App shell. Below md: a slim top app bar and a fixed bottom tab bar
 * (var(--tabbar-h) plus the home indicator). From md up: one top bar with the links.
 * Cooking mode hides the tab bar and marks the body so --tabbar-space collapses to 0.
 */
export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, switchDemoRole } = useAuth();
  const pathname = usePathname() ?? "/";
  const zh = language === "zh-HK";

  const toggleLanguage = () => setLanguage(zh ? "en" : "zh-HK");

  const isCookMode = /^\/recipe\/[^/]+\/cook(\/|$)/.test(pathname);

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

  // Shops, orders and the partner/admin portals are hidden while Bon Taste is a
  // cooking companion; their routes still exist for a later phase.
  const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: zh ? "餐牌" : "Menu", icon: UtensilsCrossed },
    { href: "/chat", label: zh ? "問大廚" : "Ask the chef", icon: MessageCircle },
    { href: "/my-recipes", label: t("navMyRecipes"), icon: BookOpen },
  ];

  // "/" is a prefix of every path, so Menu is active on the home page and on recipe pages
  // (browsing a dish from the menu), not everywhere.
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/recipe/")
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 bg-stone-100 border-b border-stone-200 pt-[env(safe-area-inset-top)]">
        {/* Demo strip for MVP reviewers. Kept visually quiet so it reads as a tool, not the product. */}
        <div className="bg-stone-200/70 text-stone-600 text-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-3">
            {/* One-click demo account for reviewers; the store partner and admin demos are hidden with those portals. */}
            {user ? (
              <span className="truncate">
                {t("roleCurrent")} <span className="text-stone-900">{user.name}</span>
              </span>
            ) : (
              <button
                onClick={() => switchDemoRole("CUSTOMER")}
                className="shrink-0 py-2 hover:text-stone-900 underline-offset-4 hover:underline"
              >
                {zh ? "用示範帳戶試用" : "Try it with the demo account"}
              </button>
            )}
            <button
              onClick={toggleLanguage}
              lang={zh ? "en" : "zh-HK"}
              className="shrink-0 py-2 hover:text-stone-900 underline-offset-4 hover:underline"
              title="English / 繁體中文"
            >
              {zh ? "English" : "繁體中文"}
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center gap-6">
            <Link href="/" aria-label="Bon Taste home" className="flex items-center h-12 rounded-lg">
              <BonTasteLogo />
            </Link>

            <nav aria-label={zh ? "主要" : "Main"} className="hidden md:flex items-center gap-2 text-[0.95rem]">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center h-12 px-3 rounded-lg transition-colors ${
                      active
                        ? "text-brand-600 font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <button
                  onClick={logout}
                  className="h-12 px-3 -mr-3 md:mr-0 text-sm text-stone-600 hover:text-stone-900 rounded-lg"
                >
                  {t("navLogout")}
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center h-12 px-3 text-sm text-stone-700 hover:text-stone-900 rounded-lg"
                  >
                    {t("navLogin")}
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center h-10 px-4 text-sm font-bold text-stone-50 bg-brand-500 hover:bg-brand-600 rounded-[14px] transition-colors"
                  >
                    {t("navRegister")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {!isCookMode && (
        <nav
          aria-label={zh ? "主要" : "Main"}
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
                    className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-12 text-[0.8125rem] leading-none rounded-xl -outline-offset-4 transition-colors ${
                      active ? "text-brand-600 font-bold" : "text-stone-500 active:text-stone-900"
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                    <span className="truncate max-w-full px-1">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
