import type { Metadata } from "next";
import { Roboto, Poppins, Inconsolata, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CartProvider } from "@/lib/cart/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnboardingGate } from "@/components/avatar/OnboardingGate";

// Typography tokens from `design-clean` (.agents/skills/design-clean):
// primary=Roboto, display=Poppins, mono=Inconsolata + Cormorant Garamond for BON TASTE serif
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inconsolata",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BON TASTE — AI Culinary & Grocery Concierge in Hong Kong",
  description:
    "Curated AI recipe recommendations using 100% of your ingredients, paired with live Hong Kong supermarket price comparison.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${poppins.variable} ${inconsolata.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased flex flex-col min-h-screen bg-[#F8F9FA] text-[#0F2A3D]">
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
