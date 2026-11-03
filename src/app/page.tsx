import { MenuBrowser } from "@/components/MenuBrowser";
import { fetchMenu } from "@/lib/recipes/mealdb";

// The home page is the menu: people start by browsing dishes, not by typing what
// is in their fridge. The fridge-first flow stays available at /chat.
export default async function HomePage() {
  const dishes = await fetchMenu();
  return <MenuBrowser dishes={dishes} />;
}
