"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/** Pages a not-yet-onboarded customer can still visit without being redirected. */
const ALLOWED_PREFIXES = ["/onboarding", "/login", "/register", "/privacy", "/terms", "/unauthorized"];

/**
 * Sends brand-new customers to the chef avatar studio the first time they sign in.
 * Only triggers when the server explicitly reports onboardingCompleted === false,
 * so a partially-loaded profile never causes a spurious redirect.
 */
export function OnboardingGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "CUSTOMER") return;
    if (user.onboardingCompleted !== false) return;
    if (ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    router.replace(`/onboarding/chef?next=${encodeURIComponent(pathname)}`);
  }, [user, loading, pathname, router]);

  return null;
}

