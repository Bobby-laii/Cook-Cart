"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Dices, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefAvatar } from "@/components/avatar/ChefAvatar";
import { ChefAvatarCustomizer } from "@/components/avatar/ChefAvatarCustomizer";
import {
  CHEF_PERSONALITIES,
  ChefAvatarConfig,
  ChefPersonalityId,
  DEFAULT_CHEF_AVATAR,
  isValidPersonality,
  parseChefAvatarConfig,
  randomChefAvatar,
  randomChefName,
} from "@/lib/avatar/chefAvatar";
import { button, chip, cx, errorText, field } from "@/components/ui/styles";

type Step = 1 | 2 | 3;

const DEFAULT_CHEF_NAME = "Your chef";

/** Little reactions from the chef while you customise them. */
const REACTIONS: Partial<Record<keyof ChefAvatarConfig, string[]>> = {
  hairStyle: ["Fresh cut! Ready for service.", "Ooh, I like this hair.", "Stylish AND hygienic."],
  hairColor: ["Bold colour choice!", "That shade suits me."],
  outfit: ["Looking like a Michelin-star chef!", "Dressed for the dinner rush."],
  outfitColor: ["Very sharp.", "This colour hides sauce stains... mostly."],
  headwear: ["A chef is nothing without the hat!", "Hat on, heat on."],
  eyes: ["I'm watching that pan closely.", "Eyes on the prize — dinner."],
  mouth: ["Say cheese! (Parmesan, ideally.)", "Can't stop smiling."],
  facialHair: ["Très distingué!", "Very distinguished."],
  glasses: ["Now I can read the tiny recipe print.", "Smart look!"],
  skinTone: ["Looking great!", "That's me!"],
  backdrop: ["Nice vibe!", "Love this setting."],
};

function pickReaction(field: keyof ChefAvatarConfig): string | null {
  const list = REACTIONS[field];
  if (!list) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function safeNext(next: string | null): string {
  // Only allow same-origin relative paths to avoid open redirects.
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/onboarding")) return next;
  return "/chat";
}

function ChefOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeNext(searchParams.get("next"));
  const { user, loading, refreshUser } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<ChefAvatarConfig>(DEFAULT_CHEF_AVATAR);
  const [chefName, setChefName] = useState("");
  const [personality, setPersonality] = useState<ChefPersonalityId>("friendly");
  const [bubble, setBubble] = useState<string>("Hi, I'm your chef. Choose how I look, then we can start cooking.");
  const [popKey, setPopKey] = useState(0);
  const [diceSpin, setDiceSpin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initialised = useRef(false);
  const initialConfig = useRef<ChefAvatarConfig>(DEFAULT_CHEF_AVATAR);

  const isEditing = user?.onboardingCompleted === true;

  // Seed the editor from the user's saved chef once the session has loaded.
  useEffect(() => {
    if (loading || initialised.current) return;
    initialised.current = true;
    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/onboarding/chef")}`);
      return;
    }
    const saved = parseChefAvatarConfig(user.chefAvatarConfig);
    const start = saved ?? DEFAULT_CHEF_AVATAR;
    setConfig(start);
    initialConfig.current = start;
    const savedName = user.chefName && user.chefName !== "Chef Cart" && user.chefName !== DEFAULT_CHEF_NAME ? user.chefName : "";
    setChefName(savedName);
    if (isValidPersonality(user.chefPersonality)) setPersonality(user.chefPersonality);
  }, [loading, user, router]);

  const handleChange = (next: ChefAvatarConfig, field: keyof ChefAvatarConfig) => {
    setConfig(next);
    setPopKey((k) => k + 1);
    const r = pickReaction(field);
    if (r) setBubble(r);
  };

  const randomize = () => {
    setConfig(randomChefAvatar());
    setChefName((n) => randomChefName(n));
    setPopKey((k) => k + 1);
    setDiceSpin(true);
    setTimeout(() => setDiceSpin(false), 500);
    setBubble("A whole new me, and a new name. Keep going until it feels right.");
  };

  const reset = () => {
    setConfig(initialConfig.current);
    setPopKey((k) => k + 1);
    setBubble("Back to the original recipe.");
  };

  const displayName = chefName.trim() || DEFAULT_CHEF_NAME;
  const personalityInfo = CHEF_PERSONALITIES.find((p) => p.id === personality) ?? CHEF_PERSONALITIES[0];

  const save = async () => {
    // No name is fine: the chef is simply "Your chef".
    const name = chefName.trim() || DEFAULT_CHEF_NAME;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chefName: name,
          chefPersonality: personality,
          chefAvatarConfig: config,
          completeOnboarding: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refreshUser();
      setStep(3);
    } catch (e: any) {
      setError(e?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completeOnboarding: true }),
      });
      await refreshUser();
    } finally {
      setSaving(false);
      router.push(nextUrl);
    }
  };

  const primaryBtn = button("primary", "md", "w-full sm:w-auto");
  const quietBtn = button("ghost", "sm", "w-full text-stone-500 hover:text-stone-900 sm:w-auto");

  if (loading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-small text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {"Preparing the kitchen..."}
      </div>
    );
  }

  /* ------------------------------ Step 3: Meet ------------------------------ */
  if (step === 3) {
    const goingToChat = nextUrl.startsWith("/chat");
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <ChefAvatar config={config} size={220} className="cc-pop mx-auto h-48 w-48 rounded-full sm:h-56 sm:w-56" title={displayName} mood="idle" />
          <div>
            <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900">{`This is ${displayName}`}</h1>
            <p className="mt-1 text-small text-stone-500">{personalityInfo.label}</p>
          </div>
          <p className="border-t border-stone-200 pt-5 text-body leading-relaxed text-stone-900">{personalityInfo.greeting}</p>
          <button type="button" onClick={() => router.push(nextUrl)} className={primaryBtn}>
            {goingToChat ? `Chat with ${displayName}` : "Done"}
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------- Steps 1 & 2 layout --------------------------- */
  const title =
    step === 1
      ? isEditing
        ? "Change your chef's look"
        : "Meet your chef"
      : isEditing
        ? "Name and personality"
        : "Give your chef a name";
  const intro =
    step === 1
      ? isEditing
        ? "Pick any part to change it. The preview updates as you go."
        : "Before your first chat, choose how your chef looks. You can change this any time in chef settings."
      : "Pick a name and how your chef talks to you.";

  return (
    <div className="px-5 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5">
          <p className="text-caption text-stone-500">{`Step ${step} of 2`}</p>
          <h1 className="mt-1 font-display text-[34px] font-medium leading-[1.1] text-stone-900 sm:text-[40px]">{title}</h1>
          <p className="mt-2 max-w-xl text-body leading-relaxed text-stone-500">{intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Live preview */}
          <aside className="lg:col-span-5">
            <div className="flex flex-col items-center lg:sticky lg:top-6">
              <div className="mb-4 flex min-h-[56px] w-full items-center justify-center rounded-lg bg-stone-100 px-4 py-3 text-center text-small leading-snug text-stone-900">
                <span key={bubble} className="cc-fade-in inline-block">
                  {bubble}
                </span>
              </div>

              <div key={popKey} className="cc-pop">
                <ChefAvatar
                  config={config}
                  size={260}
                  className={`rounded-full ${step === 1 ? "h-44 w-44 sm:h-60 sm:w-60 lg:h-64 lg:w-64" : "h-36 w-36 sm:h-48 sm:w-48"}`}
                  title={displayName}
                  mood="idle"
                />
              </div>

              <p className="mt-3 font-display text-[24px] font-medium text-stone-900">{displayName}</p>
              {step === 2 && <p className="text-caption text-stone-500">{personalityInfo.label}</p>}

              {step === 1 && (
                <div className="mt-4 flex w-full gap-2 sm:w-auto">
                  <button type="button" onClick={randomize} className={button("secondary", "sm", "flex-1 sm:flex-none")}>
                    <Dices
                      className={`h-5 w-5 text-stone-900 transition-transform duration-500 motion-reduce:transition-none ${diceSpin ? "rotate-[360deg]" : ""}`}
                      aria-hidden
                    />
                    Surprise me
                  </button>
                  <button type="button" onClick={reset} className={button("secondary", "sm", "flex-1 sm:flex-none")}>
                    <RotateCcw className="h-5 w-5 text-stone-500" aria-hidden />
                    Reset
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Editor column */}
          <div className="space-y-5 lg:col-span-7">
            {step === 1 ? (
              <ChefAvatarCustomizer value={config} onChange={handleChange} />
            ) : (
              <div className="space-y-7">
                <div>
                  <label htmlFor="chef-name" className="mb-2 block text-body font-bold text-stone-900">
                    Chef name
                  </label>
                  <input
                    id="chef-name"
                    type="text"
                    value={chefName}
                    onChange={(e) => {
                      setChefName(e.target.value);
                      if (error) setError("");
                    }}
                    maxLength={30}
                    autoFocus
                    placeholder={DEFAULT_CHEF_NAME}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "chef-name-error" : undefined}
                    className={field()}
                  />
                  {error && (
                    <p id="chef-name-error" role="alert" className={cx("mt-2", errorText)}>
                      {error}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChefName((n) => randomChefName(n));
                        if (error) setError("");
                      }}
                      className={chip(false, "gap-2 font-bold")}
                    >
                      <Dices className="h-4 w-4" aria-hidden />
                      Random name
                    </button>
                    {["Chef Oliver", "Nonna Rosa", "Chef Mei", "Sous-chef Kai"].map((n) => {
                      const active = chefName === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setChefName(n);
                            if (error) setError("");
                          }}
                          aria-pressed={active}
                          className={chip(active)}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-3 text-body font-bold text-stone-900">How your chef talks</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CHEF_PERSONALITIES.map((p) => {
                      const active = personality === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPersonality(p.id);
                            setBubble(p.greeting);
                          }}
                          aria-pressed={active}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            active ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-500"
                          }`}
                        >
                          <span className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-body font-bold text-stone-900">{p.label}</span>
                            {active && <Check className="h-5 w-5 shrink-0 text-stone-900" strokeWidth={2.5} aria-hidden />}
                          </span>
                          <span className="block text-small leading-relaxed text-stone-500">{p.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Footer actions: primary first on phones, on the right from sm up */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? (
                isEditing ? (
                  <button type="button" onClick={() => router.push(nextUrl)} className={quietBtn}>
                    Cancel
                  </button>
                ) : (
                  <button type="button" onClick={skip} disabled={saving} className={quietBtn}>
                    Skip for now
                  </button>
                )
              ) : (
                <button type="button" onClick={() => setStep(1)} className={quietBtn}>
                  Back to the look
                </button>
              )}

              {step === 1 ? (
                <button type="button" onClick={() => setStep(2)} className={primaryBtn}>
                  Continue
                </button>
              ) : (
                <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                  {saving && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />}
                  {saving ? "Saving..." : isEditing ? "Save my chef" : "Meet my chef"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChefOnboardingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-small text-stone-500">Loading...</div>}>
      <ChefOnboardingContent />
    </Suspense>
  );
}

