import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CartProvider } from "@/lib/cart/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnboardingGate } from "@/components/avatar/OnboardingGate";

export const metadata: Metadata = {
  title: "CookCart - AI Cooking & Grocery Shopping in Hong Kong",
  description:
    "Decide what to cook with AI based on your ingredients, and order groceries from Hong Kong supermarkets in one app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen bg-stone-50 text-stone-900">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <OnboardingGate />
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
