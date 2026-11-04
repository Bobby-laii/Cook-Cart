import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Bon Taste",
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "This is a test version",
    body: (
      <p>
        Bon Taste is early and still changing. Please don&apos;t put anything in it you&apos;d mind
        losing, and don&apos;t share sensitive personal details in the chat.
      </p>
    ),
  },
  {
    heading: "What we keep",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Your account: name, email and a hashed password (we never store the password itself).</li>
        <li>How you eat and any allergies, if you choose to add them.</li>
        <li>The recipes you save.</li>
        <li>Your chef: its name, look and personality.</li>
        <li>Your chats with your chef, so you can pick a conversation up again.</li>
      </ul>
    ),
  },
  {
    heading: "Your chef's replies",
    body: (
      <p>
        Your chef is written by Google Gemini. When you chat, your messages and the cooking
        preferences you set (such as cuisine, ingredients, how you eat and allergies) are sent to
        Google to write the reply. If Gemini is unavailable, this test version may use another AI
        service instead. Your email and password are never sent.
      </p>
    ),
  },
  {
    heading: "Recipes and photos",
    body: (
      <p>
        The recipes and dish photos on the menu come from TheMealDB. Looking up a dish asks
        TheMealDB for it; nothing about you is included.
      </p>
    ),
  },
  {
    heading: "What we don't do",
    body: <p>We don&apos;t sell your data, show ads, or share it with anyone else.</p>,
  },
  {
    heading: "Deleting your data",
    body: (
      <p>
        You can remove saved recipes on{" "}
        <Link href="/my-recipes" className="font-bold text-stone-900 underline underline-offset-4">
          My recipes
        </Link>
        . To delete your whole account and everything in it, ask the person who invited you to
        the test and we&apos;ll remove it.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-[40rem] px-5 pb-12 pt-8 sm:pt-12">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900 sm:text-[40px]">
        Privacy
      </h1>
      <p className="mt-2 text-[15px] text-stone-500">Updated November 2026</p>

      <div className="mt-8 space-y-8 text-[17px] leading-[1.55] text-stone-900">
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
