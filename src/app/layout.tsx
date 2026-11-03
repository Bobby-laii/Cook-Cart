import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CartProvider } from "@/lib/cart/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnboardingGate } from "@/components/avatar/OnboardingGate";

// Designed for low-vision readers: the same problem as reading a step from across a kitchen.
const sans = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bon Taste — what do you feel like eating?",
  description:
    "Pick a dish from a menu of real recipes from around the world, then cook it step by step with your own AI chef.",
  applicationName: "Bon Taste",
  // The manifest (src/app/manifest.ts) and the icons (src/app/icon.tsx, apple-icon.tsx,
  // icons/[size]) are linked automatically by their file conventions.
  appleWebApp: {
    capable: true,
    title: "Bon Taste",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F4F6F8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={sans.variable}
    >
      <body className="font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <OnboardingGate />
              <Navbar />
              <main className="flex-1 w-full pb-tabbar">{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
