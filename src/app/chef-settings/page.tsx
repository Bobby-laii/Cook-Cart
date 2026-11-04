"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Check, Loader2 } from "lucide-react";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { CHEF_PERSONALITIES } from "@/lib/avatar/chefAvatar";

const CHEF_AVATAR_PRESETS = [
  { id: "chef_mei", name: "Chef Mei", avatar: "👩‍🍳", cuisine: "Cantonese and dim sum" },
  { id: "chef_marco", name: "Chef Marco", avatar: "👨‍🍳", cuisine: "Italian pasta and pizza" },
  { id: "chef_yuki", name: "Chef Yuki", avatar: "🍣", cuisine: "Japanese and umami broths" },
  { id: "chef_raj", name: "Chef Raj", avatar: "🍛", cuisine: "Indian aromatics and curries" },
  { id: "chef_pierre", name: "Chef Pierre", avatar: "🥐", cuisine: "French classical and pastry" },
  { id: "chef_rosa", name: "Chef Rosa", avatar: "🌮", cuisine: "Mexican and bright salsas" },
  { id: "chef_kwame", name: "Chef Kwame", avatar: "🍲", cuisine: "West African and jollof" },
  { id: "chef_sam", name: "Chef Sam", avatar: "🍔", cuisine: "Modern diner and barbecue" },
  { id: "chef_ling", name: "Chef Ling", avatar: "🥟", cuisine: "Sichuan heat and hand-pulled noodles" },
  { id: "chef_sofia", name: "Chef Sofia", avatar: "🥘", cuisine: "Spanish tapas and paella" },
  { id: "chef_jun", name: "Chef Jun", avatar: "🍜", cuisine: "Korean barbecue and comfort soups" },
  { id: "chef_olivia", name: "Chef Olivia", avatar: "🥗", cuisine: "Mediterranean, farm to table" },
];

export default function ChefSettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();

  const [chefName, setChefName] = useState("Chef Cart");
  const [selectedAvatar, setSelectedAvatar] = useState("🧑‍🍳");
  const [selectedPersonality, setSelectedPersonality] = useState("friendly");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if ((user as any).chefName) setChefName((user as any).chefName);
      if ((user as any).chefAvatarUrl) setSelectedAvatar((user as any).chefAvatarUrl);
      if ((user as any).chefPersonality) setSelectedPersonality((user as any).chefPersonality);
    }
  }, [user]);

  const handleSelectPreset = (preset: typeof CHEF_AVATAR_PRESETS[0]) => {
    setChefName(preset.name);
    setSelectedAvatar(preset.avatar);
  };

  const hasCustomAvatar = Boolean(user?.chefAvatarConfig);

  const handleUseEmoji = async () => {
    const res = await fetch("/api/user/chef-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chefAvatarConfig: null }),
    });
    if (res.ok) await refreshUser?.();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?callbackUrl=/chef-settings");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/user/chef-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chefName,
          chefAvatarUrl: selectedAvatar,
          chefPersonality: selectedPersonality,
        }),
      });

      if (res.ok) {
        await refreshUser?.();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const zh = language === "zh-HK";
  const L = (en: string, zhText: string) => (zh ? zhText : en);
  const chip = (active: boolean) =>
    `rounded-[14px] border-2 text-left transition-colors ${active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-stone-50 hover:border-brand-300"}`;

  return (
    <div className="min-h-screen bg-stone-100 px-5 pb-12 pt-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="-ml-2 mb-2 inline-flex min-h-[48px] items-center rounded-[14px] px-2 text-[15px] font-bold text-brand-500 hover:text-brand-600"
        >
          {L("Back to chat", "返回聊天")}
        </button>

        <h1 className="text-[32px] font-bold leading-tight text-stone-900 sm:text-[40px]">{L("Chef settings", "大廚設定")}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-stone-500">
          {L("Your chef's name, look and the way they talk to you.", "設定大廚嘅名字、造型同埋同你傾偈嘅風格。")}
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Look */}
          <section className="flex flex-col items-center gap-5 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-center sm:flex-row sm:p-6 sm:text-left">
            <ChefAvatarBadge avatarConfig={user?.chefAvatarConfig} emoji={selectedAvatar} size={112} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-snug text-stone-900">{chefName || L("Your chef", "你的大廚")}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-stone-500">
                {hasCustomAvatar
                  ? L("Change their face, hair, outfit, hat and badge colour.", "更改大廚嘅臉、髮型、服裝、帽子同徽章底色。")
                  : L("Design a face, hair, outfit and hat for your chef.", "為大廚設計臉、髮型、服裝同帽子。")}
              </p>
              <button
                type="button"
                onClick={() => router.push("/onboarding/chef?next=/chef-settings")}
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] border-2 border-brand-500 bg-stone-50 px-5 text-[15px] font-bold text-brand-500 transition-colors hover:bg-brand-50 sm:w-auto"
              >
                {hasCustomAvatar ? L("Edit look", "編輯造型") : L("Design look", "設計造型")}
              </button>
              {hasCustomAvatar && (
                <p className="mt-3 text-[14px] text-stone-500">
                  {L("Your designed look is shown instead of the emoji below.", "已使用自訂造型，會取代下面嘅 Emoji 頭像。")}{" "}
                  <button type="button" onClick={handleUseEmoji} className="inline-flex min-h-[48px] items-center font-bold text-brand-500 underline-offset-2 hover:underline">
                    {L("Use emoji instead", "改用 Emoji")}
                  </button>
                </p>
              )}
            </div>
          </section>

          {/* Name and emoji */}
          <section className="rounded-3xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
            <h2 className="mb-4 text-[22px] font-bold leading-snug text-stone-900">{L("Name and emoji", "名字與 Emoji")}</h2>

            <div className="grid grid-cols-[1fr_88px] gap-3">
              <div>
                <label htmlFor="chef-name" className="mb-2 block text-[15px] font-bold text-stone-900">
                  {L("Chef name", "大廚名字")}
                </label>
                <input
                  id="chef-name"
                  type="text"
                  value={chefName}
                  onChange={(e) => setChefName(e.target.value)}
                  placeholder={L("For example, Chef Mei", "例如：Mei 大廚")}
                  maxLength={30}
                  className="h-[52px] w-full rounded-[14px] border border-stone-300 bg-stone-50 px-4 text-[17px] text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div>
                <label htmlFor="chef-emoji" className="mb-2 block text-[15px] font-bold text-stone-900">
                  Emoji
                </label>
                <input
                  id="chef-emoji"
                  type="text"
                  value={selectedAvatar}
                  onChange={(e) => setSelectedAvatar(e.target.value)}
                  maxLength={5}
                  className="h-[52px] w-full rounded-[14px] border border-stone-300 bg-stone-50 px-2 text-center text-2xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>
            <p className="mt-2 text-[14px] text-stone-500">{L("Your chef uses this name in every chat.", "大廚喺每次傾偈都會用呢個名字。")}</p>

            <h3 className="mb-3 mt-6 text-[17px] font-bold text-stone-900">{L("Or start from a signature chef", "或者揀一位招牌大廚")}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CHEF_AVATAR_PRESETS.map((preset) => {
                const active = selectedAvatar === preset.avatar && chefName === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    aria-pressed={active}
                    className={`flex min-h-[56px] items-center gap-3 px-3 py-2 ${chip(active)}`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {preset.avatar}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-stone-900">{preset.name}</span>
                      <span className="block truncate text-[14px] text-stone-500">{preset.cuisine}</span>
                    </span>
                    {active && <Check className="h-5 w-5 shrink-0 text-brand-500" strokeWidth={3} aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Personality */}
          <section className="rounded-3xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
            <h2 className="text-[22px] font-bold leading-snug text-stone-900">{L("How your chef talks", "大廚嘅說話風格")}</h2>
            <p className="mb-4 mt-1 text-[15px] text-stone-500">
              {L("This sets the tone for everyday chats and cooking help.", "影響日常傾偈同煮食建議嘅語氣。")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHEF_PERSONALITIES.map((item) => {
                const active = selectedPersonality === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPersonality(item.id)}
                    aria-pressed={active}
                    className={`p-4 ${chip(active)}`}
                  >
                    <span className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[17px] font-bold text-stone-900">{zh ? item.labelZh : item.label}</span>
                      {active && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="block text-[15px] leading-relaxed text-stone-500">{zh ? item.descriptionZh : item.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Save */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] px-5 text-[15px] font-bold text-stone-500 hover:text-stone-900"
            >
              {L("Cancel", "取消")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-brand-500 px-6 text-[17px] font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
                  {L("Saved", "已儲存")}
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                  {L("Saving...", "儲存中...")}
                </>
              ) : (
                L("Save settings", "儲存設定")
              )}
            </button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {saveSuccess ? L("Settings saved", "設定已儲存") : ""}
          </p>
        </form>
      </div>
    </div>
  );
}

