"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/** Where the chef lives. The avatar studio is only asked for on the way in here. */
const CHEF_PREFIXES = ["/chat"];

/**
 * Sends a customer to the chef avatar studio the first time they open the chef
 * chat. Everything else (menu, recipes, cooking mode) works without it, so a new
 * visitor reaches food first and meets their chef only when they go to talk to it.
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
    if (!CHEF_PREFIXES.some((p) => pathname.startsWith(p))) return;
    router.replace(`/onboarding/chef?next=${encodeURIComponent(pathname)}`);
  }, [user, loading, pathname, router]);

  return null;
}
