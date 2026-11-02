"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { QuickStartForm } from "@/components/QuickStartForm";
import { DishSuggestionCard } from "@/components/DishSuggestionCard";
import { DishSuggestion } from "@/types";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  structuredSuggestions?: DishSuggestion[];
}

interface ConversationItem {
  id: string;
  title: string;
  cuisine?: string;
  updatedAt: string;
}

const THINKING_PHRASES_EN = [
  "Hmm, let me think...",
  "Simmering some delicious ideas...",
  "Looking through my kitchen notebook...",
  "Pairing flavours for you...",
];

const THINKING_PHRASES_ZH = [
  "嗯……等我諗下先……",
  "正在廚房筆記中尋找美味靈感……",
  "慢慢品味緊最啱你口味嘅配搭……",
  "熱鑊起油，即刻為你準備好……",
];

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCuisineParam = searchParams.get("cuisine") || undefined;

  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [conversationId, setConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChefName = user?.chefName || "Chef Cart";
  const activeChefAvatar = user?.chefAvatarUrl || "🧑‍🍳";
  const activeChefConfig = user?.chefAvatarConfig ?? null;
  // When the chef has a designed SVG avatar, don't append the emoji to greetings.
  const greetingAvatar = activeChefConfig ? "" : ` ${activeChefAvatar}`;

  // Rotate companion thoughts naturally while thinking
  useEffect(() => {
    if (!isLoading) {
      setThinkingIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_PHRASES_EN.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchConversations();
    startNewChat(initialCuisineParam);
  }, [user, initialCuisineParam]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("Could not fetch conversations:", e);
    }
  };

  const loadConversationHistory = async (id: string) => {
    setConversationId(id);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation && Array.isArray(data.conversation.messages)) {
          setMessages(data.conversation.messages);
        }
      }
    } catch (e) {
      console.error("Failed to load conversation messages:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        if (conversationId === id) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  const startNewChat = (cuisineHint?: string) => {
    const newId = "convo_" + Math.random().toString(36).substring(2, 9);
    setConversationId(newId);

    const welcomeEn = cuisineHint
      ? `Hello! I'm your personal chef and companion, ${activeChefName}${greetingAvatar}. I see you're exploring ${cuisineHint} cuisine! Pick your ingredients above or ask me anything about ${cuisineHint} dishes, cookware, or how your day is going.`
      : `Hello! I'm your personal chef and everyday companion, ${activeChefName}${greetingAvatar}. Whether you want to chat about your day, relax, or ask me anything about recipes, ingredients, and cookware, I'm always here for you. How can I help today?`;

    const welcomeZh = cuisineHint
      ? `您好！我是您的專屬廚伴 ${activeChefName}${greetingAvatar}。看到您正探索「${cuisineHint}」料理！歡迎在上方挑選食材，或隨時向我詢問正宗做法、調味秘訣，甚至聊聊今天的生活點滴！`
      : `您好！我是您的專屬廚伴 ${activeChefName}${greetingAvatar}。無論你想聊聊今天過得怎樣、尋求心靈放鬆，抑或探索各種菜式做法、食材挑選與鍋具心得，我都隨時在這裡陪伴你！今天想聊點甚麼呢？`;

    setMessages([
      {
        role: "assistant",
        content: language === "zh-HK" ? welcomeZh : welcomeEn,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleQuickStartSubmit = async (formData: any) => {
    setIsLoading(true);

    const userPrompt =
      language === "zh-HK"
        ? `請為我推薦 3 款「${formData.cuisine}」菜式，必須全數使用以下食材：${formData.ingredients.join("、")}。用餐人數：${formData.servings}人。烹調時間：${formData.cookingTimeLimit}。設備：${formData.equipment.join("、")}。`
        : `Please recommend 3 ${formData.cuisine} dishes that incorporate ALL of the following ingredients: ${formData.ingredients.join(", ")}. Servings: ${formData.servings} people. Time limit: ${formData.cookingTimeLimit}. Equipment: ${formData.equipment.join(", ")}.`;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: userPrompt,
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(newMessages);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: newMessages,
          quickStartData: formData,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
        }
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date().toISOString(),
            structuredSuggestions: data.structuredSuggestions,
          },
        ]);
        fetchConversations();
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Sorry, I encountered an issue. " + (data.error || ""),
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setIsLoading(false);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Network connection error: " + err.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    setInputMessage("");

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: newMessages,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
        }
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date().toISOString(),
            structuredSuggestions: data.structuredSuggestions,
          },
        ]);
        fetchConversations();
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Error: " + (data.error || "Failed to respond"),
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setIsLoading(false);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Network error: " + err.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSelectDish = (dish: DishSuggestion) => {
    try {
      sessionStorage.setItem("cookcart_active_dish", JSON.stringify(dish));
      router.push(`/recipe/${dish.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartCooking = (dish: DishSuggestion) => {
    try {
      sessionStorage.setItem("cookcart_active_dish", JSON.stringify(dish));
      router.push(`/recipe/${dish.id}/cook`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Conversations & New Chat (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <button
            onClick={() => startNewChat()}
            className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "zh-HK" ? "新煮食對話" : "New Cooking Chat"}</span>
          </button>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              {language === "zh-HK" ? "歷史對話記錄" : "Saved Chats"}
            </h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">
                {language === "zh-HK" ? "暫無歷史對話" : "No saved chats yet."}
              </p>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversationHistory(c.id)}
                    className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between group transition ${
                      conversationId === c.id
                        ? "bg-brand-50 text-brand-800 font-bold border border-brand-200"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded transition flex-shrink-0"
                      title={language === "zh-HK" ? "刪除對話" : "Delete chat"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Chef Profile Widget */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 text-xs text-stone-700 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={44} title={activeChefName} />
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{activeChefName}</h4>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {language === "zh-HK" ? "專屬陪伴 AI 大廚" : "Personal Companion Chef"}
                  </span>
                </div>
              </div>
              <Link
                href="/chef-settings"
                className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-amber-700 hover:border-amber-300 transition"
                title="Customize Chef"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              {language === "zh-HK"
                ? "像 ChatGPT / Gemini 般無所不談的廚房避風港。兼備深厚環球烹調、食材選購與鍋具知識。"
                : "Your supportive safe space to talk about daily life and master any cooking question."}
            </p>
            <Link
              href="/onboarding/chef?next=/chat"
              className="block w-full text-center py-1.5 px-3 rounded-lg bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-800 font-semibold text-xs transition"
            >
              {language === "zh-HK" ? "打扮我的大廚 →" : "Design Chef's Look →"}
            </Link>
            <Link
              href="/chef-settings"
              className="block w-full text-center py-1.5 px-3 rounded-lg text-amber-800 hover:bg-amber-100/60 font-semibold text-xs transition"
            >
              {language === "zh-HK" ? "自訂大廚形象與性格 →" : "Customize Chef Avatar →"}
            </Link>
          </div>
        </aside>

        {/* Main Chat & Quick Start Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Quick-Start Form at the top */}
          <QuickStartForm
            onSubmit={handleQuickStartSubmit}
            isLoading={isLoading}
            initialCuisine={initialCuisineParam}
          />

          {/* Chat Messages Feed */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6 space-y-6 min-h-[450px] flex flex-col justify-between">
            <div className="space-y-6 flex-1">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={36} title={activeChefName} className="shadow-xs" />
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-stone-900 text-white rounded-tr-none"
                        : "bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-none space-y-4"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* AI Structured Suggestions (3 Cards) */}
                    {msg.structuredSuggestions && msg.structuredSuggestions.length > 0 && (
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-brand-900 pb-1 border-b border-brand-200">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-brand-600" />
                            {t("suggestionsTitle")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {msg.structuredSuggestions.map((suggestion) => (
                            <DishSuggestionCard
                              key={suggestion.id}
                              suggestion={suggestion}
                              onSelectDish={handleSelectDish}
                              onStartCooking={handleStartCooking}
                            />
                          ))}
                        </div>

                        <p className="text-[11px] text-stone-500 italic pt-1">
                          {t("aiDisclaimer")}
                        </p>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      👤
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking state */}
              {isLoading && (
                <div className="flex gap-3 items-center text-stone-500 text-sm">
                  <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={36} title={activeChefName} />
                  <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-700 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs border border-stone-200/60">
                    <Sparkles className="w-4 h-4 text-brand-600 animate-spin" />
                    <span key={thinkingIndex} className="cc-fade-in font-medium">
                      {language === "zh-HK"
                        ? THINKING_PHRASES_ZH[thinkingIndex]
                        : THINKING_PHRASES_EN[thinkingIndex]}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-stone-100 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  language === "zh-HK"
                    ? "聊聊日常心情，或詢問烹飪技巧、食材選購與鍋具心得..."
                    : "Chat about your day, or ask about recipes, cookware, and Hong Kong groceries..."
                }
                className="flex-1 px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{language === "zh-HK" ? "發送" : "Send"}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-stone-500">Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
