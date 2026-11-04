"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const inputClass =
  "h-[52px] w-full rounded-lg border border-stone-200 bg-stone-100 px-4 text-[17px] text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:bg-stone-50 focus:outline-none";
const labelClass = "mb-2 block text-[15px] font-bold text-stone-900";
const hintClass = "mt-2 text-[14px] text-stone-500";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dietary, setDietary] = useState("");
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          dietaryRestrictions: dietary,
          allergies,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        await refreshUser();
        // First-time users go straight to designing their personal chef.
        router.push("/onboarding/chef?next=/chat");
      } else {
        setError(data.error || "We couldn't create your account. Please try again.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Network error. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-12 pt-8 sm:pt-16">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900">Create an account</h1>
      <p className="mt-2 text-[17px] text-stone-500">
        Keep the recipes you love and meet your own chef.
      </p>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2 text-[15px] text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="register-name" className={labelClass}>
            Your name
          </label>
          <input
            id="register-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className={labelClass}>
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            aria-describedby="register-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p id="register-password-hint" className={hintClass}>
            At least 6 characters.
          </p>
        </div>

        <div className="border-t border-stone-200 pt-5">
          <p className="text-[15px] text-stone-500">
            Optional. Your chef keeps these in mind when suggesting dishes.
          </p>
        </div>

        <div>
          <label htmlFor="register-dietary" className={labelClass}>
            How you eat
          </label>
          <input
            id="register-dietary"
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="Vegetarian, halal, no pork"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-allergies" className={labelClass}>
            Allergies
          </label>
          <input
            id="register-allergies"
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Peanuts, shellfish"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-[17px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
          {loading ? "Creating your account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-[15px] text-stone-500">
        {"Already have an account? "}
        <Link href="/login" className="font-bold text-stone-900 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
