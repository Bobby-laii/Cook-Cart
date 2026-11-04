"use client";

import React from "react";
import Link from "next/link";
import { BonTasteLogo } from "@/components/BonTasteLogo";

export function Footer() {
  const links = [
    { href: "/", label: "Menu" },
    { href: "/chat", label: "Ask the chef" },
    { href: "/my-recipes", label: "My recipes" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];

  // Phones get the bottom tab bar instead; a footer only appears from md up.
  return (
    <footer className="hidden md:block mt-auto border-t border-stone-200 bg-stone-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 grid gap-8 grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 max-w-md">
          <BonTasteLogo />
          <p className="text-caption text-stone-500">
            Pick a dish, cook it step by step with your chef, and take your time.
          </p>
          <p className="text-caption text-stone-500">
            Bon Taste is an early test version. Always make sure food is cooked through.
          </p>
          <p className="text-caption text-stone-500">© {new Date().getFullYear()} Bon Taste</p>
        </div>

        <ul className="grid grid-cols-2 gap-x-8 text-caption">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center min-h-12 rounded-md text-stone-600 hover:text-brand-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
