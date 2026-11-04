"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, RotateCcw, Send } from "lucide-react";
import { ChefAvatarBadge } from "@/components/avatar/ChefAvatar";
import { listenOnce, speak, voiceSupported } from "@/lib/handsfree/useVoiceCommands";

type ChefReply =
  | { kind: "answer"; text: string }
  | { kind: "error"; reason: "network" | "signin" | "limit"; question: string };

/**
 * Ask the chef about the step on screen. Failures are said plainly: the cook is
 * mid-recipe and needs to know the chef didn't answer, not a made-up reassurance.
 *
 * Typing with floury hands is hard, so the mic button asks by voice, and a question
 * heard by hands-free voice ("chef, …") arrives as `incoming`. With `speakAnswers`
 * on, the reply is read out too.
 */
export function AskChef({
  chefName,
  avatarConfig,
  dishId,
  buildPrompt,
  loginHref,
  incoming,
  speakAnswers = false,
  showMic = true,
}: {
  chefName: string;
  avatarConfig: string;
  dishId: string;
  buildPrompt: (question: string) => string;
  loginHref: string;
  /** A question asked by voice elsewhere; a new `id` asks it. */
  incoming?: { id: number; text: string } | null;
  speakAnswers?: boolean;
  /** Off while hands-free voice is listening: two microphones would fight. */
  showMic?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [reply, setReply] = useState<ChefReply | null>(null);

  useEffect(() => setCanListen(voiceSupported()), []);

  const ask = async (q: string) => {
    if (!q || asking) return;
    setAsking(true);
    setReply(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: `cook_helper_${dishId}`,
          messages: [{ role: "user", content: buildPrompt(q) }],
        }),
      });
      if (res.status === 401) {
        setReply({ kind: "error", reason: "signin", question: q });
        return;
      }
      if (res.status === 429) {
        setReply({ kind: "error", reason: "limit", question: q });
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { message?: string; modelUsed?: string }
        | null;
      // The chat route answers a used-up daily allowance with 200 and this model name.
      if (data?.modelUsed === "limit-enforcer") {
        setReply({ kind: "error", reason: "limit", question: q });
        return;
      }
      if (res.ok && data?.message) {
        setReply({ kind: "answer", text: data.message });
        if (speakAnswers) speak(data.message);
        setQuestion("");
      } else {
        setReply({ kind: "error", reason: "network", question: q });
      }
    } catch {
      setReply({ kind: "error", reason: "network", question: q });
    } finally {
      setAsking(false);
    }
  };

  useEffect(() => {
    if (!incoming) return;
    setQuestion(incoming.text);
    ask(incoming.text);
    // Only a new incoming id asks again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.id]);

  const askByVoice = async () => {
    if (listening || asking) return;
    setListening(true);
    const heard = await listenOnce();
    setListening(false);
    if (heard) {
      setQuestion(heard);
      ask(heard);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(question.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ChefAvatarBadge
          key={reply?.kind === "answer" ? reply.text.length : "idle"}
          avatarConfig={avatarConfig}
          size={48}
          title={chefName}
          mood={asking || listening ? "thinking" : reply?.kind === "answer" ? "nod" : "idle"}
        />
        <p className="text-stone-600 leading-snug">Ask about the step you are on.</p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="ask-chef" className="sr-only">
          {`Ask ${chefName} about this step`}
        </label>
        <input
          id="ask-chef"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How hot should the pan be?"
          enterKeyHint="send"
          className="flex-1 min-w-0 h-[52px] px-4 rounded-md bg-stone-100 border border-transparent text-[17px] placeholder:text-stone-500 focus:outline-none focus:border-stone-900 focus:bg-stone-50"
        />
        {canListen && showMic && (
          <button
            type="button"
            onClick={askByVoice}
            aria-label={listening ? "Listening" : "Ask by voice"}
            aria-pressed={listening}
            className={`w-[52px] h-[52px] flex-shrink-0 inline-flex items-center justify-center rounded-md transition-colors ${
              listening ? "bg-fresh-500 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"
            }`}
          >
            <Mic className={`w-5 h-5 ${listening ? "motion-safe:animate-pulse" : ""}`} aria-hidden />
          </button>
        )}
        <button
          type="submit"
          disabled={asking || !question.trim()}
          aria-label="Ask"
          className="w-[52px] h-[52px] flex-shrink-0 inline-flex items-center justify-center rounded-md bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40"
        >
          {asking ? (
            <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden />
          ) : (
            <Send className="w-5 h-5" aria-hidden />
          )}
        </button>
      </form>

      <div aria-live="polite">
        {listening && <p className="text-stone-500">Listening. Ask your question.</p>}
        {asking && <p className="text-stone-500">{`${chefName} is thinking…`}</p>}

        {reply?.kind === "answer" && (
          <div className="space-y-1 cc-fade-in">
            <p className="text-sm font-bold text-stone-500">{chefName}</p>
            <p className="text-[17px] leading-relaxed text-stone-900 whitespace-pre-line">{reply.text}</p>
          </div>
        )}

        {reply?.kind === "error" && reply.reason === "network" && (
          <div className="space-y-3">
            <p className="text-danger font-bold">I couldn&apos;t reach the chef just now.</p>
            <button
              type="button"
              onClick={() => ask(reply.question)}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-md border border-stone-200 text-stone-900 font-bold hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-5 h-5" aria-hidden />
              Try again
            </button>
          </div>
        )}

        {reply?.kind === "error" && reply.reason === "signin" && (
          <div className="space-y-3">
            <p className="text-stone-900">The chef answers questions once you are signed in.</p>
            <Link
              href={loginHref}
              className="inline-flex items-center h-12 px-5 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
            >
              Sign in to ask the chef
            </Link>
          </div>
        )}

        {reply?.kind === "error" && reply.reason === "limit" && (
          <p className="text-stone-900">
            You&apos;ve reached today&apos;s limit for questions to the chef. It resets at midnight.
          </p>
        )}
      </div>
    </div>
  );
}
