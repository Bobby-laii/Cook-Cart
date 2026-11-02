"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import {
  UtensilsCrossed,
  ShoppingCart,
  Bookmark,
  ShoppingBag,
  Store,
  ShieldCheck,
  Globe,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  Compass,
  Bot,
} from "lucide-react";

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, switchDemoRole } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh-HK" : "en");
  };

  const navLinks = [
    { href: "/chat", label: t("navChat"), icon: Sparkles },
    { href: "/explore", label: language === "zh-HK" ? "環球菜系" : "Explore Cuisines", icon: Compass },
    { href: "/chef-settings", label: language === "zh-HK" ? "自訂大廚" : "My AI Chef", icon: Bot },
    { href: "/my-recipes", label: t("navMyRecipes"), icon: Bookmark },
    { href: "/orders", label: t("navOrders"), icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      {/* Quick Demo Role Switcher Top Bar for MVP Evaluation */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {t("quickDemoSwitch")}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => switchDemoRole("CUSTOMER")}
              className={`px-2 py-0.5 rounded text-xs transition font-medium ${
                user?.role === "CUSTOMER"
                  ? "bg-brand-500 text-white font-bold"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              👤 {t("roleCustomer")}
            </button>
            <button
              onClick={() => switchDemoRole("STORE_PARTNER")}
              className={`px-2 py-0.5 rounded text-xs transition font-medium ${
                user?.role === "STORE_PARTNER"
                  ? "bg-amber-600 text-white font-bold"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              🏪 {t("rolePartner")}
            </button>
            <button
              onClick={() => switchDemoRole("ADMIN")}
              className={`px-2 py-0.5 rounded text-xs transition font-medium ${
                user?.role === "ADMIN"
                  ? "bg-purple-600 text-white font-bold"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              🛡️ {t("roleAdmin")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:inline text-stone-400">
              {t("roleCurrent")}{" "}
              <strong className="text-stone-200 font-medium">
                {user.name} ({user.role})
              </strong>
            </span>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold"
            title="Switch Language (English / 繁體中文)"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            {language === "en" ? "繁體中文" : "English"}
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-stone-900 group-hover:text-brand-600 transition">
                {t("brandName")}
              </span>
              <span className="block text-[10px] font-medium text-emerald-600 tracking-wider uppercase -mt-1">
                Hong Kong
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Role specific portals */}
            {(user?.role === "STORE_PARTNER" || user?.role === "ADMIN") && (
              <Link
                href="/store-partner"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith("/store-partner")
                    ? "bg-amber-100 text-amber-900 font-semibold"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <Store className="w-4 h-4 text-amber-600" />
                {t("navPartner")}
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-100 text-purple-900 font-semibold"
                    : "text-purple-800 hover:bg-purple-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                {t("navAdmin")}
              </Link>
            )}
          </nav>

          {/* Right Action Area: Cart & Auth */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-stone-700 hover:text-brand-600 hover:bg-stone-100 rounded-full transition"
              aria-label={t("navCart")}
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Menu */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-red-600 hover:bg-red-50 text-sm font-medium transition"
                  title={t("navLogout")}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">{t("navLogout")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-stone-900"
                >
                  {t("navLogin")}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition"
                >
                  {t("navRegister")}
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-stone-700 hover:bg-stone-100"
              >
                <Icon className="w-5 h-5 text-brand-500" />
                {link.label}
              </Link>
            );
          })}

          {(user?.role === "STORE_PARTNER" || user?.role === "ADMIN") && (
            <Link
              href="/store-partner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-amber-800 hover:bg-amber-50"
            >
              <Store className="w-5 h-5 text-amber-600" />
              {t("navPartner")}
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-purple-800 hover:bg-purple-50"
            >
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              {t("navAdmin")}
            </Link>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-800 text-sm font-semibold"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              {language === "en" ? "切換至 繁體中文" : "Switch to English"}
            </button>
            {user && (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                {t("navLogout")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
