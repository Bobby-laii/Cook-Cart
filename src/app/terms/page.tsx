import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms | Bon Taste",
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "An early test version",
    body: (
      <p>
        Bon Taste is free to use while we test it. Things will change, break now and then, and
        may be reset. We can&apos;t promise it will always be available.
      </p>
    ),
  },
  {
    heading: "Cooking safely",
    body: (
      <p>
        Recipes and your chef&apos;s advice are suggestions, not professional guidance. Your chef
        is an AI and can get things wrong, including cooking times, temperatures and whether a
        dish suits an allergy. Always cook food through, check labels for allergens, and use your
        own judgement in the kitchen.
      </p>
    ),
  },
  {
    heading: "Where recipes come from",
    body: (
      <p>
        Menu recipes and photos come from TheMealDB and belong to their creators. Chef replies are
        written by Google Gemini.
      </p>
    ),
  },
  {
    heading: "Your account",
    body: (
      <p>
        Keep your password to yourself and use Bon Taste for cooking, not to harm anyone or the
        service. The shared demo account is for looking around; anyone can see what&apos;s saved
        in it.
      </p>
    ),
  },
  {
    heading: "Your data",
    body: (
      <p>
        What we keep and why is on the{" "}
        <Link href="/privacy" className="font-bold text-stone-900 underline underline-offset-4">
          privacy page
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 pb-12 pt-8 sm:pt-12">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900 sm:text-[40px]">
        Terms
      </h1>
      <p className="mt-2 text-small text-stone-500">Updated November 2026</p>

      <div className="mt-8 space-y-8 text-body text-stone-900">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-[19px] font-bold leading-snug">{s.heading}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </article>
  );
}
