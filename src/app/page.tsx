import type { Metadata } from "next";
import { MenuBrowser } from "@/components/MenuBrowser";
import { fetchMenu } from "@/lib/recipes/mealdb";

export const metadata: Metadata = {
  title: "What to cook tonight – Bon Taste",
};

// The home page is "Tonight" (three picks for this evening) with the menu below:
// people start by browsing dishes, not by typing what is in their fridge. The
// fridge-first flow stays available at /chat.
export default async function HomePage() {
  const dishes = await fetchMenu();
  return <MenuBrowser dishes={dishes} />;
}
