"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { QuickStartForm } from "@/components/QuickStartForm";
import { DishSuggestionCard } from "@/components/DishSuggestionCard";
import { DishSuggestion } from "@/types";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { Send, Plus, MessageSquare, Trash2, Settings, Loader2, X } from "lucide-react";
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
  const [savedOpen, setSavedOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChefName = user?.chefName || "Chef Cart";
  const activeChefAvatar = user?.chefAvatarUrl || "🧑‍🍳";
  const activeChefConfig = user?.chefAvatarConfig ?? null;

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

  // Close the saved chats sheet with Escape.
  useEffect(() => {
    if (!savedOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSavedOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [savedOpen]);

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
      ? `Hello! I'm your personal chef and companion, ${activeChefName}. I see you're exploring ${cuisineHint} cuisine! Pick your ingredients above or ask me anything about ${cuisineHint} dishes, cookware, or how your day is going.`
      : `Hello! I'm your personal chef and everyday companion, ${activeChefName}. Whether you want to chat about your day, relax, or ask me anything about recipes, ingredients, and cookware, I'm always here for you. How can I help today?`;

    const welcomeZh = cuisineHint
      ? `您好！我是您的專屬廚伴 ${activeChefName}。看到您正探索「${cuisineHint}」料理！歡迎在上方挑選食材，或隨時向我詢問正宗做法、調味秘訣，甚至聊聊今天的生活點滴！`
      : `您好！我是您的專屬廚伴 ${activeChefName}。無論你想聊聊今天過得怎樣、尋求心靈放鬆，抑或探索各種菜式做法、食材挑選與鍋具心得，我都隨時在這裡陪伴你！今天想聊點甚麼呢？`;

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

  const zh = language === "zh-HK";
  const hasConversation = messages.some((m) => m.role === "user");

  const savedChatsList = (onPicked?: () => void) =>
    conversations.length === 0 ? (
      <p className="text-sm text-stone-500 py-2">
        {zh ? "暫時未有儲存嘅對話。" : "No saved chats yet."}
      </p>
    ) : (
      <ul className="space-y-1">
        {conversations.map((c) => {
          const active = conversationId === c.id;
          return (
            <li
              key={c.id}
              className={`flex items-center rounded-md ${
                active ? "bg-brand-50 text-brand-700" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  loadConversationHistory(c.id);
                  onPicked?.();
                }}
                aria-current={active ? "true" : undefined}
                className={`flex-1 min-w-0 min-h-12 px-3 text-left text-sm flex items-center gap-2 ${
                  active ? "font-bold" : ""
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-stone-400" aria-hidden />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(e, c.id)}
                className="shrink-0 w-12 h-12 flex items-center justify-center rounded-md text-stone-400 hover:text-danger"
                aria-label={zh ? `刪除對話：${c.title}` : `Delete chat: ${c.title}`}
                title={zh ? "刪除對話" : "Delete chat"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>
    );

  const newChatLabel = zh ? "新對話" : "New chat";

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-4 lg:pt-6">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Sidebar: saved chats and the chef (desktop) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <button
            type="button"
            onClick={() => startNewChat()}
            className="w-full h-[52px] px-4 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-5 h-5" aria-hidden />
            <span>{newChatLabel}</span>
          </button>

          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <h2 className="px-2 pt-1 pb-2 font-bold text-stone-900">
              {zh ? "已儲存對話" : "Saved chats"}
            </h2>
            <div className="max-h-[460px] overflow-y-auto">{savedChatsList()}</div>
          </section>

          {/* The chef */}
          <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={44} title={activeChefName} />
                <div className="min-w-0">
                  <h2 className="font-bold text-stone-900 truncate">{activeChefName}</h2>
                  <p className="text-sm text-stone-500">{zh ? "你嘅專屬大廚" : "Your own chef"}</p>
                </div>
              </div>
              <Link
                href="/chef-settings"
                className="shrink-0 w-12 h-12 flex items-center justify-center rounded-md text-stone-500 hover:text-brand-600 hover:bg-stone-100 transition"
                title={zh ? "大廚設定" : "Chef settings"}
                aria-label={zh ? "大廚設定" : "Chef settings"}
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-stone-600">
              {zh
                ? "你嘅廚房拍檔：問佢點煮、點替代材料，或者一路煮一路傾兩句。"
                : "Your kitchen companion: ask how to cook anything, what to swap, or just chat while you cook."}
            </p>
            <div className="space-y-1">
              <Link
                href="/onboarding/chef?next=/chat"
                className="flex items-center justify-center h-12 px-3 rounded-md border border-stone-200 text-brand-600 font-bold text-sm hover:border-brand-500 transition"
              >
                {zh ? "打扮我的大廚" : "Design your chef's look"}
              </Link>
              <Link
                href="/chef-settings"
                className="flex items-center justify-center h-12 px-3 rounded-md text-brand-600 font-bold text-sm hover:bg-stone-100 transition"
              >
                {zh ? "自訂大廚形象與性格" : "Customise your chef"}
              </Link>
            </div>
          </section>
        </aside>

        {/* Chat column */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="max-w-2xl mx-auto">
            {/* Phone header: chef, saved chats, new chat */}
            <div className="lg:hidden flex items-center justify-between gap-2 pb-3">
              <Link href="/chef-settings" className="flex items-center gap-2 min-w-0 min-h-12">
                <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={32} title={activeChefName} />
                <span className="font-bold text-stone-900 truncate">{activeChefName}</span>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSavedOpen(true)}
                  className="h-12 px-3 rounded-md text-sm font-bold text-stone-700 hover:bg-stone-200/60 flex items-center gap-2"
                  aria-haspopup="dialog"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden />
                  {zh ? "已儲存對話" : "Saved chats"}
                </button>
                <button
                  type="button"
                  onClick={() => startNewChat()}
                  className="w-12 h-12 rounded-md text-brand-600 hover:bg-stone-200/60 flex items-center justify-center"
                  aria-label={newChatLabel}
                  title={newChatLabel}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <QuickStartForm
              onSubmit={handleQuickStartSubmit}
              isLoading={isLoading}
              initialCuisine={initialCuisineParam}
              collapsed={hasConversation}
            />

            {/* Messages. Bottom padding keeps the last message clear of the fixed input bar on phone. */}
            <div
              className="pt-5 space-y-5 pb-[calc(var(--tabbar-space)+6rem)] md:pb-4"
              aria-live="polite"
            >
              {messages.map((msg, idx) =>
                msg.role === "user" ? (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 text-white px-4 py-3">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-end gap-2">
                      <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={28} title={activeChefName} />
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>

                    {/* Dish suggestions from the chef */}
                    {msg.structuredSuggestions && msg.structuredSuggestions.length > 0 && (
                      <div className="space-y-3 md:pl-9">
                        <h3 className="font-bold text-stone-900">
                          {zh ? "用晒你所有食材嘅菜式" : "Dishes that use all your ingredients"}
                        </h3>
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
                        <p className="text-sm text-stone-500">{t("aiDisclaimer")}</p>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Thinking state */}
              {isLoading && (
                <div className="flex items-end gap-2">
                  <ChefAvatarBadge avatarConfig={activeChefConfig} emoji={activeChefAvatar} size={28} title={activeChefName} />
                  <div className="rounded-2xl rounded-bl-md bg-stone-50 border border-stone-200 text-stone-600 px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin motion-reduce:animate-none" aria-hidden />
                    <span key={thinkingIndex} className="cc-fade-in">
                      {zh ? THINKING_PHRASES_ZH[thinkingIndex] : THINKING_PHRASES_EN[thinkingIndex]}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input: fixed above the tab bar on phone, sticky at the bottom of the column from md up */}
            <div className="fixed inset-x-0 above-tabbar z-20 md:sticky md:inset-x-auto border-t border-stone-200 md:border-t-0 bg-stone-100">
              <form
                onSubmit={handleSendMessage}
                className="max-w-2xl mx-auto px-5 md:px-0 py-3 md:pb-5 flex items-center gap-2"
              >
                <label htmlFor="chat-input" className="sr-only">
                  {zh ? "傳訊息俾大廚" : "Message your chef"}
                </label>
                <input
                  id="chat-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={zh ? "問你嘅大廚任何嘢" : "Ask your chef anything"}
                  className="flex-1 min-w-0 h-12 px-4 rounded-md border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-500"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="shrink-0 w-[52px] h-[52px] rounded-md bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition disabled:bg-stone-200 disabled:text-stone-500"
                  aria-label={zh ? "發送" : "Send"}
                  title={zh ? "發送" : "Send"}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Saved chats sheet (phone and tablet) */}
      {savedOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="saved-chats-title">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40"
            aria-label={zh ? "關閉" : "Close"}
            onClick={() => setSavedOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] flex flex-col rounded-t-2xl bg-stone-50 pb-safe">
            <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-2 border-b border-stone-200">
              <h2 id="saved-chats-title" className="text-[22px] font-bold text-stone-900">
                {zh ? "已儲存對話" : "Saved chats"}
              </h2>
              <button
                type="button"
                onClick={() => setSavedOpen(false)}
                className="w-12 h-12 -mr-3 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-900"
                aria-label={zh ? "關閉" : "Close"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">{savedChatsList(() => setSavedOpen(false))}</div>
            <div className="px-5 pt-2 pb-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  startNewChat();
                  setSavedOpen(false);
                }}
                className="w-full h-[52px] rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" aria-hidden />
                {newChatLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatLoading() {
  const { language } = useLanguage();
  return (
    <div className="p-10 text-center text-sm text-stone-500">
      {language === "zh-HK" ? "載入緊對話……" : "Loading chat…"}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
