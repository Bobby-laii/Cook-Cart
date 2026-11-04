# AGENTS.md — Bon Taste (CookCart)

This document defines the architecture, design system rules, and engineering conventions for AI coding agents and contributors working on **Bon Taste** (`Cook-Cart`).

---

## 1. Product Purpose & Core Loop

Bon Taste is a guided cooking assistant built for real kitchens across both **Mobile/Desktop Web** and **React Native / Capacitor Phone App** shells.

1. **Tell the chef what you have** (or pick from the photo-first recipe browser on `/`).
2. **Choose a dish** on `/recipe/[id]` with clear ingredient scaling, metric/US unit conversion, and dietary swap chips.
3. **Cook step by step** on `/recipe/[id]/cook` with one instruction per screen, automatic timers, hands-free wave gesture navigation, live camera step inspection ("Show the chef"), and voice commands ("next", "back", "repeat", "check pan", "start timer", "chef, ...").

---

## 2. Visual & UX Rules (`DESIGN.md` & `src/components/ui/styles.ts`)

Always read [`DESIGN.md`](./DESIGN.md) before modifying any UI component or page.

- **Photo-first hierarchy**: The dish photograph leads every recipe card and detail screen. Keep text overlays off photos.
- **Colour tokens only**: Never hard-code `bg-white` or raw hex colours in components. Use the CSS variable-backed Tailwind tokens (`stone-50`, `stone-100`, `stone-200`, `stone-300`, `stone-500`, `stone-600`, `stone-900`, `brand-500`, `brand-600`, `fresh-500`, `fresh-600`, `butter-400`, `danger`) so light mode (Warm Stone) and dark mode (Cast Iron) adapt automatically.
- **Shared control recipes**: Always import `button()`, `chip()`, `field()`, `iconButton()`, and `errorText` from [`src/components/ui/styles.ts`](./src/components/ui/styles.ts) rather than inventing ad-hoc button or input class strings.
- **Typography**:
  - `font-display` (*Newsreader*): Dish titles, screen headings, chef greetings.
  - `font-sans` (*Atkinson Hyperlegible*): Body copy, buttons, ingredients, step instructions (minimum `16px` everywhere; `26px–32px` in Cook Mode; `clamp(32px, 5vw, 56px)` in Far View).
  - `font-mono` (*JetBrains Mono*): Timers, quantities, temperatures, step counters.
- **Copywriting**: Sentence case everywhere (`Start cooking`, `Save to My recipes`, `Ask the chef`). No emoji icons (`lucide-react` stroke icons only). No exclamation marks in chef responses.

---

## 3. Directory & Module Architecture

- **`src/config/`**:
  - `appConfig.ts`: Central application settings, AI spending caps (`monthlySpendingCapHkd`, `dailyUserRequestLimit`), and supported cuisines (`CUISINES`).
  - `systemPrompt.ts`: The chef persona rules (`COOKCART_SYSTEM_PROMPT` and `buildSystemPrompt`). Enforces concise replies, mandatory metric + US unit pairs, all-ingredient inclusion, and `<COOKCART_MENU>` JSON formatting.
  - `ingredientsCatalogue.ts`: Common pantry and regional ingredient catalogue.
- **`src/components/`**:
  - `ui/styles.ts`: Single source of truth for buttons, chips, fields, icon buttons, and error text.
  - `cook/`: Step-by-step cooking controls (`AskChef.tsx`, `BottomSheet.tsx`, `Timers.tsx`, `cookHelpers.ts`).
  - `handsfree/`: Hands-free kitchen controls (`HandsFreeControls.tsx`, `FarView.tsx`, `LiveCameraStepFeed.tsx`).
  - `avatar/`: SVG chef avatar renderer (`ChefAvatar.tsx`).
- **`src/lib/`**:
  - `ai/aiService.ts`: Unified AI service chain (Gemini `gemini-2.5-flash` -> OpenRouter -> Groq -> Ollama -> Spoonacular -> Pollinations -> Local Culinary & Step Q&A Engine) with Prisma usage logging and spending cap enforcement.
  - `handsfree/`:
    - `commands.ts`: Pure, unit-tested command parser (`parseCommand`) and optical motion/wave detector (`frameMotion`, `detectSwipe`).
    - `cameraPlatform.ts`: Cross-platform camera & native mobile bridge (`getUserMedia`, frame capture, and `window.ReactNativeWebView` / `window.CookCartNativeCamera` hooks for phone app builds).
    - `useWaveGesture.ts`: `useLiveCameraStep` and `useWaveGesture` hooks for real-time 48×36 greyscale wave detection and live step frame capture.
    - `useVoiceCommands.ts` & `speech.ts`: Web Speech API recognition and natural voice synthesis (Gemini TTS + device speech fallback).
  - `prisma.ts`: Resilient Prisma client supporting both local SQLite (`file:./dev.db`) and Vercel PostgreSQL (`POSTGRES_PRISMA_URL` / `DATABASE_URL`) with automatic demo account provisioning and serverless fallback.
  - `jwtSecret.ts` & `auth.ts`: Edge-safe JWT session signing and verification.
- **`prisma/` & `scripts/prepare-db.mjs`**:
  - `prisma/schema.prisma`: Data model (`User`, `Recipe`, `SavedRecipe`, `ChatConversation`, `AIUsageLog`, `AppSetting`, `Store`, `Ingredient`, `StoreInventory`, `SavedPantry`).
  - `scripts/prepare-db.mjs`: Pre-build hook that detects PostgreSQL URLs in serverless environments (such as Vercel Prisma Postgres) and configures `schema.prisma` automatically before `prisma generate && next build`.

---

## 4. Verification & CI Commands

Before opening a pull request or pushing to `main`, run all three checks:

```bash
npx tsc --noEmit
npm test -- --run
npm run build
```

All 15+ Vitest test suites in `tests/` must pass with zero TypeScript or Next.js build errors.

