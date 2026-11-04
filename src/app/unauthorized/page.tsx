import type { Metadata } from "next";
import Link from "next/link";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Not available | Bon Taste",
};

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pb-12 pt-12 sm:pt-20">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900">
        This page isn&apos;t available
      </h1>
      <p className="mt-3 text-body text-stone-500">
        Your account can&apos;t open this page. Everything for cooking is on the menu.
      </p>
      <Link
        href="/"
        className={button("primary", "md", "mt-8")}
      >
        Go to the menu
      </Link>
    </div>
  );
}
