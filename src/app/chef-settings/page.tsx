"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Sparkles, Bot, Save, Check, ArrowLeft, RefreshCw, Palette } from "lucide-react";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";

const CHEF_AVATAR_PRESETS = [
  { id: "chef_mei", name: "Chef Mei", avatar: "👩‍🍳", cuisine: "Cantonese & Dim Sum", flag: "🇭🇰" },
  { id: "chef_marco", name: "Chef Marco", avatar: "👨‍🍳", cuisine: "Italian Pasta & Pizza", flag: "🇮🇹" },
  { id: "chef_yuki", name: "Chef Yuki", avatar: "🍣", cuisine: "Japanese & Umami Broths", flag: "🇯🇵" },
  { id: "chef_raj", name: "Chef Raj", avatar: "🍛", cuisine: "Indian Aromatics & Curries", flag: "🇮🇳" },
  { id: "chef_pierre", name: "Chef Pierre", avatar: "🥐", cuisine: "French Classical & Pastry", flag: "🇫🇷" },
  { id: "chef_rosa", name: "Chef Rosa", avatar: "🌮", cuisine: "Mexican & Vibrant Salsas", flag: "🇲🇽" },
  { id: "chef_kwame", name: "Chef Kwame", avatar: "🍲", cuisine: "West African & Jollof", flag: "🇬🇭" },
  { id: "chef_sam", name: "Chef Sam", avatar: "🍔", cuisine: "Modern Diner & BBQ", flag: "🇺🇸" },
  { id: "chef_ling", name: "Chef Ling", avatar: "🥟", cuisine: "Sichuan Heat & Hand Pulled Noodles", flag: "🇨🇳" },
  { id: "chef_sofia", name: "Chef Sofia", avatar: "🥘", cuisine: "Spanish Tapas & Paella", flag: "🇪🇸" },
  { id: "chef_jun", name: "Chef Jun", avatar: "🍜", cuisine: "Korean BBQ & Comfort Soups", flag: "🇰🇷" },
  { id: "chef_olivia", name: "Chef Olivia", avatar: "🥗", cuisine: "Mediterranean & Farm-to-Table", flag: "🇬🇷" },
];

const PERSONALITY_OPTIONS = [
  {
    id: "friendly",
    label: "Friendly & Warm",
    labelZh: "親切溫暖",
    description: "Supportive, encouraging, and empathetic like an everyday close friend in the kitchen.",
    descriptionZh: "溫暖鼓勵、善解人意，就像在廚房陪著你的好朋友。",
  },
  {
    id: "professional",
    label: "Executive Chef",
    labelZh: "專業星廚",
    description: "Meticulous, precise culinary techniques, Michelin-standard advice and plating guidance.",
    descriptionZh: "注重精準刀工火候、米芝蓮星級食材配搭與專業技巧。",
  },
  {
    id: "playful",
    label: "Playful & Fun",
    labelZh: "活潑搞怪",
    description: "Humorous, energetic, loaded with joyful cooking puns and upbeat vibes.",
    descriptionZh: "幽默生動、活力滿滿，讓每天烹飪充滿歡笑。",
  },
  {
    id: "calm",
    label: "Mindful & Calm",
    labelZh: "療癒平靜",
    description: "Serene, patient, grounding—focuses on soothing rituals and stress-free comfort food.",
    descriptionZh: "沉穩舒緩、耐性陪伴，專注為你帶來身心放鬆的療癒美食。",
  },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/chat")}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === "zh-HK" ? "返回 AI 聊天室" : "Back to AI Chat"}
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {hasCustomAvatar ? (
                <ChefAvatarBadge avatarConfig={user?.chefAvatarConfig} emoji={selectedAvatar} size={64} className="shadow-md ring-4 ring-amber-100" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner border border-amber-200">
                  {selectedAvatar}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-stone-900">{chefName || "My Personal Chef"}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {language === "zh-HK" ? "專屬夥伴" : "Companion"}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-1">
                  {language === "zh-HK"
                    ? "自訂專屬 AI 大廚的名稱、頭像形象與對話性格，打造專屬於你的廚房避風港。"
                    : "Customize your AI Chef's name, avatar, and conversation style to make your cooking safe space."}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  {language === "zh-HK" ? "已儲存！" : "Saved!"}
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === "zh-HK" ? "儲存中..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {language === "zh-HK" ? "儲存設定" : "Save Changes"}
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Avatar Studio entry point */}
          <div className="rounded-2xl p-6 sm:p-8 border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <ChefAvatarBadge avatarConfig={user?.chefAvatarConfig} emoji={selectedAvatar} size={112} className="shadow-lg ring-4 ring-white" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-stone-900 flex items-center justify-center sm:justify-start gap-2">
                <Palette className="w-5 h-5 text-amber-600" />
                {language === "zh-HK" ? "大廚造型工作室" : "Chef Avatar Studio"}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {language === "zh-HK"
                  ? "親手設計大廚的膚色、髮型、表情、廚師服與帽子。"
                  : "Design your chef's skin tone, hair, expression, uniform and hat."}
              </p>
              {hasCustomAvatar && (
                <p className="text-xs text-stone-500 mt-2">
                  {language === "zh-HK" ? "已使用自訂造型（會取代下方的 Emoji 頭像）。" : "Your designed look is shown instead of the emoji below."}{" "}
                  <button type="button" onClick={handleUseEmoji} className="font-semibold text-amber-700 hover:underline">
                    {language === "zh-HK" ? "改用 Emoji" : "Use emoji instead"}
                  </button>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push("/onboarding/chef?next=/chef-settings")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {hasCustomAvatar ? (language === "zh-HK" ? "編輯造型" : "Edit Look") : language === "zh-HK" ? "設計造型" : "Design Look"}
            </button>
          </div>
          {/* Section 1: Name & Custom Emoji */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-600" />
              {language === "zh-HK" ? "1. 大廚稱號與頭像" : "1. Chef Name & Avatar"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  {language === "zh-HK" ? "大廚名字" : "Chef Name"}
                </label>
                <input
                  type="text"
                  value={chefName}
                  onChange={(e) => setChefName(e.target.value)}
                  placeholder="e.g. Chef Mei, Gordon, Grandma's Kitchen"
                  maxLength={30}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-900"
                />
                <p className="text-xs text-stone-400 mt-1.5">
                  {language === "zh-HK"
                    ? "在聊天室中 AI 將使用此名字稱呼自己並與您對話。"
                    : "The AI will identify with this name in every chat."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  {language === "zh-HK" ? "頭像圖示 / Emoji" : "Avatar Emoji"}
                </label>
                <input
                  type="text"
                  value={selectedAvatar}
                  onChange={(e) => setSelectedAvatar(e.target.value)}
                  maxLength={5}
                  className="w-full text-center text-2xl px-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-stone-400 mt-1.5 text-center">
                  {language === "zh-HK" ? "可輸入任何 Emoji" : "Any emoji or character"}
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="mt-6 pt-6 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                {language === "zh-HK" ? "或從 12 款預設大廚中選擇" : "Or Pick From 12 Signature Chef Presets"}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CHEF_AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      selectedAvatar === preset.avatar && chefName === preset.name
                        ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/20"
                        : "border-stone-200 hover:border-amber-300 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-3xl">{preset.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-stone-900 truncate">{preset.name}</span>
                        <span className="text-xs">{preset.flag}</span>
                      </div>
                      <p className="text-xs text-stone-500 truncate">{preset.cuisine}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Personality Style */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {language === "zh-HK" ? "2. 對話風格與性格" : "2. Personality & Conversation Tone"}
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              {language === "zh-HK"
                ? "選擇你的 AI 大廚與你溝通、提供下廚建議與日常生活閒聊時的說話風格。"
                : "Choose how your chef communicates during everyday chats and culinary guidance."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERSONALITY_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPersonality(item.id)}
                  className={`p-5 rounded-xl border text-left transition ${
                    selectedPersonality === item.id
                      ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/20 shadow-sm"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-stone-900">
                      {language === "zh-HK" ? item.labelZh : item.label}
                    </span>
                    {selectedPersonality === item.id && (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {language === "zh-HK" ? item.descriptionZh : item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition"
            >
              {language === "zh-HK" ? "取消" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  {language === "zh-HK" ? "設定已儲存！" : "Saved Successfully!"}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {language === "zh-HK" ? "確認並儲存" : "Save Chef Settings"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

