"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { BonTasteLogo } from "@/components/BonTasteLogo";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, switchDemoRole } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const zh = language === "zh-HK";

  const toggleLanguage = () => setLanguage(zh ? "en" : "zh-HK");

  // Shops, orders and the partner/admin portals are hidden while Bon Taste is a
  // cooking companion; their routes still exist for a later phase.
  const navLinks = [
    { href: "/", label: zh ? "餐牌" : "Menu" },
    { href: "/chat", label: zh ? "問大廚" : "Ask the chef" },
    { href: "/my-recipes", label: t("navMyRecipes") },
  ];

  // "/" is a prefix of every path, so the menu link only counts as active on the home page itself.
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-stone-100/95 backdrop-blur border-b border-stone-200">
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
              className="shrink-0 hover:text-stone-900 underline-offset-4 hover:underline"
            >
              {zh ? "用示範帳戶試用" : "Try it with the demo account"}
            </button>
          )}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="hover:text-stone-900 underline-offset-4 hover:underline"
              title="English / 繁體中文"
            >
              {zh ? "English" : "繁體中文"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-6">
          <Link href="/" aria-label="Bon Taste home">
            <BonTasteLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[0.95rem]">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`py-1 border-b-2 transition ${
                    active
                      ? "border-brand-500 text-stone-900"
                      : "border-transparent text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <button
                onClick={logout}
                className="hidden sm:inline text-sm text-stone-600 hover:text-stone-900"
              >
                {t("navLogout")}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-stone-700 hover:text-stone-900">
                  {t("navLogin")}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-sm font-medium text-stone-50 bg-stone-900 hover:bg-brand-600 rounded-md transition"
                >
                  {t("navRegister")}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-stone-800"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-stone-200 bg-stone-100 px-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 border-b border-stone-200 last:border-0 font-serif text-xl ${
                isActive(link.href) ? "text-brand-600" : "text-stone-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={logout}
              className="block w-full text-left py-3 text-sm text-stone-600"
            >
              {t("navLogout")}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
