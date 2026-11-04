import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Newsreader } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnboardingGate } from "@/components/avatar/OnboardingGate";
import { THEME_BOOT_SCRIPT } from "@/components/ThemeSwitch";

// Designed for low-vision readers: the same problem as reading a step from across a kitchen.
const sans = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Dish names and page titles: a reading serif, like a cooking magazine.
const display = Newsreader({
  subsets: ["latin"],
  // Variable font: one file covers 500 and 600. Asking for fixed weights made
  // next/font fail to download it and silently fall back to Georgia.
  weight: "variable",
  variable: "--font-display",
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
  // Matches the page in each mode (stone-50 light / dark in globals.css).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#171614" },
  ],
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
      className={`${sans.variable} ${display.variable}`}
      // The boot script may set data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <OnboardingGate />
          <Navbar />
          <main className="flex-1 w-full pb-tabbar">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
