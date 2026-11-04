"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@/types";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  chefName?: string | null;
  chefAvatarUrl?: string | null;
  chefAvatarConfig?: string | null;
  chefPersonality?: string | null;
  /** false = brand-new customer who still needs to design their chef. */
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => { },
  switchDemoRole: async () => { },
  refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser((prev) => prev ?? null);
        }
      } else {
        setUser(null);
      }
    } catch {
      // Keep existing user on transient network hiccup
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      setUser(data.user);
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const demoEmails: Record<UserRole, string> = {
      CUSTOMER: "customer@cookcart.hk",
      STORE_PARTNER: "store@cookcart.hk",
      ADMIN: "admin@cookcart.hk",
    };
    await login(demoEmails[role], "Password123!");
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
