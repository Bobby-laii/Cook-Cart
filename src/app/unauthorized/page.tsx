import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not available | Bon Taste",
};

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pb-12 pt-12 sm:pt-20">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900">
        This page isn&apos;t available
      </h1>
      <p className="mt-3 text-[17px] text-stone-500">
        Your account can&apos;t open this page. Everything for cooking is on the menu.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-[52px] items-center justify-center rounded-lg bg-brand-500 px-6 text-[17px] font-bold text-white transition-colors hover:bg-brand-600"
      >
        Go to the menu
      </Link>
    </div>
  );
}
