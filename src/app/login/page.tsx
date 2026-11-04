"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const inputClass =
  "h-[52px] w-full rounded-lg border border-stone-200 bg-stone-100 px-4 text-[17px] text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:bg-stone-50 focus:outline-none";
const labelClass = "mb-2 block text-[15px] font-bold text-stone-900";

function safeCallback(raw: string | null): string {
  // Same-origin relative paths only, so the login page can't be used as an open redirect.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function LoginPageContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"form" | "demo" | null>(null);

  const signIn = async (mode: "form" | "demo", address: string, secret: string) => {
    setError("");
    setLoading(mode);
    const res = await login(address, secret);
    setLoading(null);
    if (res.success) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError(res.error || "That email and password don't match.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn("form", email, password);
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-12 pt-8 sm:pt-16">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900">Sign in</h1>
      <p className="mt-2 text-[17px] text-stone-500">
        Save recipes and cook with your own chef.
      </p>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2 text-[15px] text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading !== null}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-[17px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {loading === "form" && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
          {loading === "form" ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8 border-t border-stone-200 pt-6">
        <p className="text-[15px] text-stone-500">Just looking around? Use the shared demo account.</p>
        <button
          type="button"
          onClick={() => signIn("demo", "customer@cookcart.hk", "Password123!")}
          disabled={loading !== null}
          className="mt-3 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-stone-900 bg-stone-50 text-[17px] font-bold text-stone-900 transition-colors hover:bg-stone-100 disabled:opacity-60"
        >
          {loading === "demo" && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
          Try the demo account
        </button>
      </div>

      <p className="mt-8 text-[15px] text-stone-500">
        {"New to Bon Taste? "}
        <Link href="/register" className="font-bold text-stone-900 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
