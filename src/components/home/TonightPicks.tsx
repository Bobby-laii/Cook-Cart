"use client";

import React from "react";
import type { MenuDish } from "@/lib/recipes/mealdb";
import { dishLine, formatQuizSummary, type CravingQuizAnswers } from "./picks";
import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { button } from "@/components/ui/styles";

/**
 * "Tonight": three calm picks, photo first. One large lead dish with a clear way into
 * its recipe, and two smaller ones beside or below it. Opening a dish goes to the
 * recipe page, not straight into cooking mode, so people can check the ingredients.
 */
export function TonightPicks({
  picks,
  onOpen,
  opening,
  onShuffle,
  quiz = null,
  onOpenQuiz,
  onClearQuiz,
}: {
  /** null while the day's picks are worked out on this device. */
  picks: MenuDish[] | null;
  onOpen: (dish: MenuDish) => void;
  opening: string | null;
  onShuffle: () => void;
  quiz?: CravingQuizAnswers | null;
  onOpenQuiz?: () => void;
  onClearQuiz?: () => void;
}) {
  const [lead, ...rest] = picks ?? [];

  return (
    <section aria-labelledby="tonight-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="tonight-title" className="font-display font-medium text-[34px] md:text-[40px] leading-[1.1] text-stone-900">
            {quiz ? "Suggestions for you" : "Tonight"}
          </h1>
          {quiz && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-small text-stone-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-brand-700 font-medium">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {formatQuizSummary(quiz)}
              </span>
              {onOpenQuiz && (
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  className="text-stone-600 underline underline-offset-4 decoration-stone-300 hover:text-stone-900 px-1 py-0.5"
                >
                  Change answers
                </button>
              )}
              {onClearQuiz && (
                <button
                  type="button"
                  onClick={onClearQuiz}
                  aria-label="Clear preference filter"
                  className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 px-1 py-0.5"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
        {picks && picks.length > 1 && (
          <div className="flex items-center gap-1">
            {!quiz && onOpenQuiz && (
              <button
                type="button"
                onClick={onOpenQuiz}
                className={button("ghost", "sm", "px-2.5 font-normal text-stone-500 hover:text-stone-900")}
              >
                <Sparkles className="w-4 h-4 text-brand-600" aria-hidden="true" />
                Help me pick
              </button>
            )}
            <button
              type="button"
              onClick={onShuffle}
              className={button("ghost", "sm", "-mr-2 px-2.5 font-normal text-stone-500 hover:text-stone-900")}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Show me others
            </button>
          </div>
        )}
      </div>

      {picks === null ? (
        <div className="mt-4 grid gap-5 md:grid-cols-3 md:gap-6" aria-hidden="true">
          <div className="md:col-span-2 aspect-[4/3] md:aspect-[16/10] rounded-lg bg-stone-100" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-6">
            <div className="aspect-square md:aspect-[3/2] rounded-lg bg-stone-100" />
            <div className="aspect-square md:aspect-[3/2] rounded-lg bg-stone-100" />
          </div>
        </div>
      ) : !lead ? (
        <p className="mt-3 text-stone-500">
          Nothing on the menu fits your kitchen right now. Try turning off the oven filter below.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-3 md:gap-6">
          {/* Lead pick */}
          <article className="md:col-span-2">
            <button
              type="button"
              onClick={() => onOpen(lead)}
              disabled={opening !== null}
              aria-label={lead.title}
              className="group block w-full text-left rounded-lg disabled:cursor-wait"
            >
              <div className="overflow-hidden rounded-lg bg-stone-100">
                <img
                  data-dish-photo={lead.id}
                  src={lead.imageUrl}
                  alt=""
                  width={700}
                  height={525}
                  className={`aspect-[4/3] md:aspect-[16/10] w-full object-cover transition-opacity ${
                    opening === lead.id ? "opacity-60" : ""
                  }`}
                />
              </div>
            </button>
            <h2 className="mt-4 font-display font-medium text-[28px] md:text-[32px] leading-[1.15] text-stone-900">
              {lead.title}
            </h2>
            {lead.description && <p className="mt-2 text-stone-700 max-w-xl">{lead.description}</p>}
            <p className="mt-1 text-stone-500">{dishLine(lead)}</p>
            <button
              type="button"
              onClick={() => onOpen(lead)}
              disabled={opening !== null}
              className={button("primary", "md", "mt-4 w-full sm:w-auto disabled:cursor-wait")}
            >
              {opening === lead.id && (
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              )}
              {opening === lead.id ? "Opening the recipe" : "See the recipe"}
            </button>
          </article>

          {/* Two smaller picks: side by side on phones, stacked beside the lead on desktop */}
          {rest.length > 0 && (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-6 md:content-start">
              {rest.map((dish) => (
                <li key={dish.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(dish)}
                    disabled={opening !== null}
                    aria-label={dish.title}
                    className="group block w-full text-left rounded-lg disabled:cursor-wait"
                  >
                    <div className="overflow-hidden rounded-lg bg-stone-100">
                      <img
                        data-dish-photo={dish.id}
                        src={`${dish.imageUrl}/medium`}
                        alt=""
                        loading="lazy"
                        width={350}
                        height={350}
                        className={`aspect-square md:aspect-[3/2] w-full object-cover transition-opacity ${
                          opening === dish.id ? "opacity-60" : ""
                        }`}
                      />
                    </div>
                    <span className="mt-2.5 block font-display font-medium text-[18px] md:text-[20px] leading-[1.25] text-stone-900 group-hover:underline underline-offset-4 decoration-stone-300">
                      {dish.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-stone-500">
                      {opening === dish.id ? "Opening the recipe" : dishLine(dish)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
