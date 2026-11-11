"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { QuickStartForm, type QuickStartData } from "@/components/QuickStartForm";
import { DishSuggestionCard } from "@/components/DishSuggestionCard";
import { DishSuggestion } from "@/types";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { Send, Plus, MessageSquare, Trash2, Settings, Loader2, X, Square } from "lucide-react";
import Link from "next/link";
import { button, cx, field, iconButton } from "@/components/ui/styles";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  structuredSuggestions?: DishSuggestion[];
  traceId?: string;
  isStreaming?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  cuisine?: string;
  updatedAt: string;
}

const THINKING_PHRASES = ["Thinking it through", "Checking what goes together", "Looking at your ingredients"];

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCuisineParam = searchParams.get("cuisine") || undefined;

  const { t } = useLanguage();
  const { user } = useAuth();

  const [conversationId, setConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [savedOpen, setSavedOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // "Chef Cart" was the old default name; treat it as unset.
  const activeChefName = user?.chefName && user.chefName !== "Chef Cart" ? user.chefName : "Your chef";
  const activeChefConfig = user?.chefAvatarConfig ?? null;

  // Rotate the thinking line while the chef works
  useEffect(() => {
    if (!isLoading) {
      setThinkingIndex(0);
      setStatusNote(null);
      return;
    }
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
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

  // Follow the conversation, but leave a fresh chat at the top so the form is in view.
  useEffect(() => {
    if (!isLoading && !messages.some((m) => m.role === "user")) return;
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchConversations();
    startNewChat(initialCuisineParam);
    return () => {
      abortControllerRef.current?.abort();
    };
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
    abortControllerRef.current?.abort();
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
    abortControllerRef.current?.abort();
    setIsLoading(false);
    const newId = "convo_" + Math.random().toString(36).substring(2, 9);
    setConversationId(newId);

    const welcome = cuisineHint
      ? `Tell me what's in your fridge, or ask anything about ${cuisineHint} cooking.`
      : "Tell me what's in your fridge, or ask anything about cooking.";

    setMessages([
      {
        role: "assistant",
        content: welcome,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStatusNote(null);
    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === prev.length - 1 && m.role === "assistant" && m.isStreaming
          ? {
              ...m,
              content: m.content.trim() || "Stopped.",
              isStreaming: false,
            }
          : m
      )
    );
  };

  /**
   * Stream response from POST /api/ai/chat via SSE, updating the assistant message progressively.
   */
  const streamChefResponse = async (
    baseMessages: ChatMessage[],
    quickStartData?: QuickStartData
  ) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setStatusNote(null);

    const placeholderAssistant: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages([...baseMessages, placeholderAssistant]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          conversationId,
          messages: baseMessages,
          quickStartData,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errText = "Something went wrong on my side. Please try again.";
        try {
          const errJson = await res.json();
          if (errJson?.error) errText = errJson.error;
        } catch {
          // Keep default error
        }
        setIsLoading(false);
        setMessages([
          ...baseMessages,
          {
            role: "assistant",
            content: errText,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream") || !res.body) {
        // Fallback if server returned standard JSON
        const data = await res.json();
        setIsLoading(false);
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
        }
        setMessages([
          ...baseMessages,
          {
            role: "assistant",
            content: data.message || "",
            timestamp: new Date().toISOString(),
            structuredSuggestions: data.structuredSuggestions,
            traceId: data.traceId,
          },
        ]);
        fetchConversations();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let accumulatedText = "";
      let finalSuggestions: DishSuggestion[] | undefined;
      let finalTraceId: string | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const frames = sseBuffer.split("\n\n");
        sseBuffer = frames.pop() || "";

        for (const frame of frames) {
          const lines = frame.split("\n");
          let eventName = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }
          if (!dataLine) continue;

          try {
            const payload = JSON.parse(dataLine);
            if (eventName === "status") {
              if (payload.phase === "calling_tool" && payload.toolName) {
                setStatusNote(`Checking ${payload.toolName.replace(/_/g, " ")}...`);
              } else {
                setStatusNote(null);
              }
            } else if (eventName === "delta" && typeof payload.text === "string") {
              accumulatedText += payload.text;
              const currentText = accumulatedText;
              setMessages([
                ...baseMessages,
                {
                  role: "assistant",
                  content: currentText,
                  timestamp: new Date().toISOString(),
                  structuredSuggestions: finalSuggestions,
                  traceId: finalTraceId,
                  isStreaming: true,
                },
              ]);
            } else if (eventName === "suggestions" && Array.isArray(payload.structuredSuggestions)) {
              finalSuggestions = payload.structuredSuggestions;
              setMessages([
                ...baseMessages,
                {
                  role: "assistant",
                  content: accumulatedText,
                  timestamp: new Date().toISOString(),
                  structuredSuggestions: finalSuggestions,
                  traceId: finalTraceId,
                  isStreaming: true,
                },
              ]);
            } else if (eventName === "done") {
              if (payload.conversationId && payload.conversationId !== conversationId) {
                setConversationId(payload.conversationId);
              }
              if (payload.message) accumulatedText = payload.message;
              if (payload.structuredSuggestions) finalSuggestions = payload.structuredSuggestions;
              if (payload.traceId) finalTraceId = payload.traceId;
            } else if (eventName === "error" && payload.error) {
              accumulatedText = payload.error;
            }
          } catch {
            // Ignore malformed SSE frame
          }
        }
      }

      setIsLoading(false);
      setStatusNote(null);
      setMessages([
        ...baseMessages,
        {
          role: "assistant",
          content: accumulatedText || "Here you go.",
          timestamp: new Date().toISOString(),
          structuredSuggestions: finalSuggestions,
          traceId: finalTraceId,
          isStreaming: false,
        },
      ]);
      fetchConversations();
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return;
      }
      setIsLoading(false);
      setStatusNote(null);
      setMessages([
        ...baseMessages,
        {
          role: "assistant",
          content: "I couldn't reach the kitchen. Check your connection and try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleQuickStartSubmit = async (formData: QuickStartData) => {
    const style = formData.cuisine === "Any style" ? "" : `${formData.cuisine} `;
    const time = formData.cookingTimeLimit === "any" ? "" : `, ready in ${formData.cookingTimeLimit}`;
    const userPrompt = `Three ${style}dishes using ${formData.ingredients.join(", ")}, for ${formData.servings} ${formData.servings === 1 ? "person" : "people"}${time}.`;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: userPrompt,
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(newMessages);
    await streamChefResponse(newMessages, formData);
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
    await streamChefResponse(newMessages);
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

  const hasConversation = messages.some((m) => m.role === "user");

  const savedChatsList = (onPicked?: () => void) =>
    conversations.length === 0 ? (
      <p className="text-small text-stone-500 py-2">No saved chats yet.</p>
    ) : (
      <ul className="space-y-0.5">
        {conversations.map((c) => {
          const active = conversationId === c.id;
          return (
            <li
              key={c.id}
              className={`flex items-center rounded-lg ${
                active ? "bg-stone-100 text-stone-900" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  loadConversationHistory(c.id);
                  onPicked?.();
                }}
                aria-current={active ? "true" : undefined}
                className={cx("flex-1 min-w-0 min-h-12 px-3 text-left text-small flex items-center gap-2", active && "font-bold")}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-stone-500" aria-hidden />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(e, c.id)}
                className={iconButton("ghost", "sm", "shrink-0 text-stone-500 hover:bg-transparent hover:text-danger")}
                aria-label={`Delete chat: ${c.title}`}
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    );

  const newChatLabel = "New chat";

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 pt-2 md:pt-8">
      <h1 className="sr-only">Ask the chef</h1>
      <div className="lg:grid lg:grid-cols-12 lg:gap-10">
        {/* Sidebar: the chef and saved chats (desktop) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ChefAvatarBadge avatarConfig={activeChefConfig} size={48} title={activeChefName} mood={isLoading ? "thinking" : "idle"} />
              <p className="font-display font-medium text-[22px] leading-tight text-stone-900 truncate">
                {activeChefName}
              </p>
            </div>
            <Link
              href="/chef-settings"
              className={iconButton("ghost", "sm", "shrink-0 -mr-2 text-stone-500 hover:text-stone-900")}
              title="Chef settings"
              aria-label="Chef settings"
            >
              <Settings className="w-5 h-5" aria-hidden />
            </Link>
          </div>
          <p className="mt-3 text-small text-stone-500">
            Ask how to cook anything, what to swap, or whether it is done.
          </p>
          <Link
            href="/onboarding/chef?next=/chat"
            className="mt-1 inline-flex items-center min-h-12 text-small text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
          >
            {"Change your chef's look"}
          </Link>

          <button
            type="button"
            onClick={() => startNewChat()}
            className={button("secondary", "md", "mt-6 w-full px-4")}
          >
            <Plus className="w-5 h-5" aria-hidden />
            <span>{newChatLabel}</span>
          </button>

          <section className="mt-8 pt-6 border-t border-stone-200">
            <h2 className="pb-2 font-bold text-stone-900">Saved chats</h2>
            <div className="max-h-[460px] overflow-y-auto -mx-3">{savedChatsList()}</div>
          </section>
        </aside>

        {/* Chat column */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="max-w-2xl mx-auto">
            {/* Phone and tablet header: chef, saved chats, new chat */}
            <div className="lg:hidden flex items-center justify-between gap-2 pb-4">
              <Link href="/chef-settings" className="flex items-center gap-3 min-w-0 min-h-12" aria-label={`${activeChefName}, chef settings`}>
                <ChefAvatarBadge avatarConfig={activeChefConfig} size={40} title={activeChefName} mood={isLoading ? "thinking" : "idle"} />
                <span className="font-display font-medium text-[20px] leading-tight text-stone-900 truncate">
                  {activeChefName}
                </span>
              </Link>
              <div className="flex items-center gap-1 shrink-0 -mr-2">
                <button
                  type="button"
                  onClick={() => setSavedOpen(true)}
                  className={button("ghost", "sm", "px-3 font-normal")}
                  aria-haspopup="dialog"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden />
                  Saved chats
                </button>
                <button
                  type="button"
                  onClick={() => startNewChat()}
                  className={iconButton("ghost", "sm")}
                  aria-label={newChatLabel}
                  title={newChatLabel}
                >
                  <Plus className="w-5 h-5" aria-hidden />
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
            <div className="pt-6 space-y-5 pb-[calc(var(--tabbar-space)+6rem)] md:pb-4" aria-live="polite">
              {messages.map((msg, idx) =>
                msg.role === "user" ? (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-stone-900 text-stone-50 px-4 py-3">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="space-y-4">
                    {(msg.content || !msg.isStreaming) && (
                      <div className="flex items-end gap-2.5">
                        {/* Only the newest answer nods as it arrives. */}
                        <ChefAvatarBadge
                          avatarConfig={activeChefConfig}
                          size={36}
                          title={activeChefName}
                          mood={idx === messages.length - 1 ? "nod" : "still"}
                        />
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-stone-100 text-stone-900 px-4 py-3">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    )}

                    {/* Dish suggestions from the chef */}
                    {msg.structuredSuggestions && msg.structuredSuggestions.length > 0 && (
                      <div className="md:pl-[46px]">
                        <h3 className="sr-only">Dishes that use all your ingredients</h3>
                        <div>
                          {msg.structuredSuggestions.map((suggestion) => (
                            <DishSuggestionCard
                              key={suggestion.id}
                              suggestion={suggestion}
                              onSelectDish={handleSelectDish}
                              onStartCooking={handleStartCooking}
                              traceId={msg.traceId}
                              conversationId={conversationId}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-stone-500">{t("aiDisclaimer")}</p>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Thinking state (shown while waiting for the first streamed chunk) */}
              {isLoading && (!messages.at(-1)?.content || statusNote) && (
                <div className="flex items-end gap-2.5">
                  <ChefAvatarBadge avatarConfig={activeChefConfig} size={36} title={activeChefName} mood="thinking" />
                  <div className="rounded-2xl rounded-bl-md bg-stone-100 text-stone-500 px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />
                    <span key={statusNote || thinkingIndex} className="cc-fade-in">
                      {statusNote || THINKING_PHRASES[thinkingIndex]}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input: fixed above the tab bar on phone, sticky at the bottom of the column from md up */}
            <div className="fixed inset-x-0 above-tabbar z-20 md:sticky md:inset-x-auto md:bottom-0 border-t border-stone-200 md:border-t-0 bg-stone-50">
              <form
                onSubmit={handleSendMessage}
                className="max-w-2xl mx-auto px-5 md:px-0 py-3 md:pb-5 flex items-center gap-2"
              >
                <label htmlFor="chat-input" className="sr-only">
                  Message your chef
                </label>
                <input
                  id="chat-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything about cooking"
                  className={field("flex-1 min-w-0 w-auto")}
                  autoComplete="off"
                  enterKeyHint="send"
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className={button("secondary", "md", "shrink-0 px-3.5")}
                    aria-label="Stop response"
                    title="Stop response"
                  >
                    <Square className="w-4 h-4 fill-current" aria-hidden />
                    <span className="text-small">Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className={iconButton("primary", "md", "shrink-0")}
                    aria-label="Send"
                    title="Send"
                  >
                    <Send className="w-5 h-5" aria-hidden />
                  </button>
                )}
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
            aria-label="Close"
            onClick={() => setSavedOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] flex flex-col rounded-t-2xl bg-stone-50 pb-safe">
            <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-2 border-b border-stone-200">
              <h2 id="saved-chats-title" className="font-display font-medium text-[24px] text-stone-900">
                Saved chats
              </h2>
              <button
                type="button"
                onClick={() => setSavedOpen(false)}
                className={iconButton("ghost", "sm", "-mr-3 text-stone-500 hover:text-stone-900")}
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden />
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
                className={button("primary", "md", "w-full")}
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
  return <div className="p-10 text-center text-small text-stone-500">Loading the chat</div>;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
