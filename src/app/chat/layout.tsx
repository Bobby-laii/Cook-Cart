import type { Metadata } from "next";

// The chat page is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Ask the chef – Bon Taste",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
