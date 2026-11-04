# Bon Taste: notes for AI coding assistants

Two friends build this, both with AI help (Claude Code, Gemini). Read this before you change anything.

## What it is

Bon Taste is a calm cooking companion for home cooks worldwide: a menu of real recipes, an AI chef you can ask, and step-by-step cooking mode (hands-free: wave at the camera, voice commands, far view). First users are working adults cooking after work to unwind. It's a phone web app now; the goal is an App Store app.

**Out of scope, don't add:** grocery shopping, prices, stores, checkout, delivery, partner shops. They were removed on purpose. **English only** (the Chinese version was removed on purpose).

## Stack and commands

Next.js 14 App Router, React 18, TypeScript, Tailwind 3, Prisma (SQLite locally), Vitest.

```bash
npm install
cp .env.example .env    # then fill in the values; never commit .env
npm run db:push && npm run db:seed
npm run dev             # http://localhost:3000
npm test                # must pass before every commit
npx tsc --noEmit        # must be clean
```

Demo login: the "Try the demo account" button on /login.

## Rules

- **Secrets:** API keys live only in `.env` (git-ignored), GitHub Actions secrets, or the hosting provider's environment settings. Never write a key into code, docs, commits or issues.
- **Recipes** come from TheMealDB (free, keyless) via `src/lib/recipes/mealdb.ts`, which also cleans them (step titles, timers, merged ingredients, kitchen fractions). Dish descriptions and oven flags are hand-written in `mealdbDescriptions.ts` / `mealdbMeta.ts`: honest, no made-up cook times or claims.
- **The chef** (`src/lib/ai/aiService.ts`, prompt in `src/config/systemPrompt.ts`) uses Gemini first, then Groq/OpenRouter as backups, with a daily limit per user. It is a quiet kitchen voice: brief, never a therapist, no shop or price claims. When it fails, the UI says so; never show a made-up answer.
- **Design:** follow `DESIGN.md` ("Photo first", light and dark mode). Use the shared helpers in `src/components/ui/styles.ts` (`button`, `chip`, `field`, `iconButton`) instead of new class strings. Colours only through the Tailwind tokens (`stone`, `brand`, `fresh`); never `bg-white` or hex colours in components, or dark mode breaks. Sentence case, no emoji as icons (use lucide-react), tap targets at least 48px.
- **Git:** work on a branch, open a pull request into `main`, and let the other person review it. Don't push straight to `main`. Small commits with clear messages.
- **Tests:** add or update a Vitest test in `tests/` for any logic you change (data cleaning, units, parsing, API routes).

## Where things are

- `src/app/`: pages (`/` menu, `/recipe/[id]`, `/recipe/[id]/cook`, `/chat`, `/my-recipes`, `/chef-settings`) and API routes (`src/app/api/`)
- `src/components/`: shared UI; `cook/` and `handsfree/` for cooking mode; `avatar/` for the chef avatar
- `src/lib/`: data, AI, units, hands-free logic
- `DESIGN.md`: the design system; `prisma/schema.prisma`: the database
