"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Check, Dices, Loader2 } from "lucide-react";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { CHEF_PERSONALITIES, randomChefName } from "@/lib/avatar/chefAvatar";
import { button, cx, errorText, field, iconButton } from "@/components/ui/styles";

const DEFAULT_CHEF_NAME = "Your chef";
/** Names from before chefs were renamed; shown as the default instead. */
const LEGACY_DEFAULT_NAMES = new Set(["Chef Cart"]);

export default function ChefSettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [chefName, setChefName] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState("friendly");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.chefName && !LEGACY_DEFAULT_NAMES.has(user.chefName)) setChefName(user.chefName);
    if (user.chefPersonality) setSelectedPersonality(user.chefPersonality);
  }, [user]);

  const hasCustomAvatar = Boolean(user?.chefAvatarConfig);
  const displayName = chefName.trim() || DEFAULT_CHEF_NAME;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.assign("/login?callbackUrl=/chef-settings");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          chefName: displayName,
          chefPersonality: selectedPersonality,
        }),
      });

      if (!res.ok) throw new Error(String(res.status));
      await refreshUser?.();
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.assign("/chat");
      }, 300);
    } catch {
      setIsSaving(false);
      setSaveError("We couldn't save your chef. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[40rem] px-5 pb-12 pt-6">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900 sm:text-[40px]">
        Your chef
      </h1>
      <p className="mt-2 text-body text-stone-500">Their name, their look and how they talk to you.</p>

      <form onSubmit={handleSave} className="mt-8">
        {/* Look */}
        <section className="flex items-center gap-5">
          <ChefAvatarBadge avatarConfig={user?.chefAvatarConfig} size={96} title={displayName} mood="idle" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] font-medium leading-tight text-stone-900">{displayName}</p>
            <button
              type="button"
              onClick={() => router.push("/onboarding/chef?next=/chat")}
              className={button("secondary", "sm", "mt-3")}
            >
              {hasCustomAvatar ? "Change the look" : "Design the look"}
            </button>
          </div>
        </section>

        {/* Name */}
        <section className="mt-8 border-t border-stone-200 pt-6">
          <label htmlFor="chef-name" className="mb-2 block text-body font-bold text-stone-900">
            Name
          </label>
          <div className="flex gap-2">
            <input
              id="chef-name"
              type="text"
              value={chefName}
              onChange={(e) => setChefName(e.target.value)}
              placeholder={DEFAULT_CHEF_NAME}
              maxLength={30}
              aria-describedby="chef-name-hint"
              className={field("min-w-0 flex-1")}
            />
            <button
              type="button"
              onClick={() => setChefName((n) => randomChefName(n))}
              aria-label="Pick a random name"
              title="Pick a random name"
              className={iconButton("secondary", "md", "flex-shrink-0")}
            >
              <Dices className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <p id="chef-name-hint" className="mt-2 text-caption text-stone-500">
            Your chef uses this name in every chat.
          </p>
        </section>

        {/* Personality */}
        <section role="group" aria-labelledby="chef-tone" className="mt-8 border-t border-stone-200 pt-6">
          <h2 id="chef-tone" className="text-body font-bold text-stone-900">How your chef talks</h2>
          <p className="mb-4 mt-1 text-small text-stone-500">The tone for everyday chats and cooking help.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHEF_PERSONALITIES.map((item) => {
              const active = selectedPersonality === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPersonality(item.id)}
                  aria-pressed={active}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-500"
                  }`}
                >
                  <span className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-body font-bold text-stone-900">{item.label}</span>
                    {active && <Check className="h-5 w-5 shrink-0 text-stone-900" strokeWidth={2.5} aria-hidden />}
                  </span>
                  <span className="block text-small leading-relaxed text-stone-500">{item.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {saveError && (
          <p role="alert" className={cx("mt-6", errorText)}>
            {saveError}
          </p>
        )}

        {/* Save */}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <button
            type="submit"
            disabled={isSaving}
            className={button("primary")}
          >
            {saveSuccess ? (
              <>
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                Saved
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className={button("ghost", "sm", "text-stone-500 hover:text-stone-900")}
          >
            Cancel
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {saveSuccess ? "Changes saved" : ""}
        </p>
      </form>
    </div>
  );
}
