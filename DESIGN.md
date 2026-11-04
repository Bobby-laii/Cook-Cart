# Bon Taste design: Photo first

Bon Taste is a calm cooking companion for home cooks everywhere. Its main moment is a
phone propped up on a kitchen counter in the evening, read from about a metre away by
someone cooking after work to unwind. The look comes from a good cooking magazine: a
white page, big honest food photos, quiet type. The food does the talking.

It is a phone app first (installable web app now, App Store later). Desktop is the
same app with more room, not a website.

## Colour

| Token | Hex | Tailwind | Use |
| --- | --- | --- | --- |
| Paper | `#FFFFFF` | `stone-50` | Page and sheets |
| Wash | `#F6F5F3` | `stone-100` | Quiet fills: chips, inputs at rest, the timer tray |
| Line | `#EBEAE7` | `stone-200` | Hairlines between things |
| Muted | `#6B6862` | `stone-500` | Secondary text and placeholders (5.6:1 on white) |
| Ink | `#1A1A1A` | `stone-900` / `brand-500` | Text, icons, primary buttons, active tab |
| Herb | `#2F6B3F` | `fresh-500` (`butter-*` is the same scale) | The only accent: what is live right now (running timer, current step) and "you already have this" |

**Dark mode** follows the phone; the sun/moon button in the header flips it and is
remembered. Every token is a CSS variable (globals.css), so the same classes work in
both. At night the page is a warm near-black (`#171614`), text a soft light
(`#F0EDE6`), and primary buttons turn herb (`#357A47`) so their white text keeps its
contrast. Never hard-code `bg-white` or a hex colour in a component.

Colour comes from the photos. Nothing else on the page competes with them: no tinted
cards, no gradients, no shadows. Errors use `#B3261E` (`danger`).

## Type

| Role | Face | Size / line height | Weight |
| --- | --- | --- | --- |
| Dish names, page titles | Newsreader (`font-display`) | 30–40px / 1.1 | 500 |
| Card dish names | Newsreader | 17–19px / 1.25 | 500 |
| Step text in cooking mode | Atkinson Hyperlegible | 26–32px / 1.3 | 700 |
| Body | Atkinson Hyperlegible | 17px / 1.55 | 400 |
| Small | Atkinson Hyperlegible | 14px / 1.45 | 400 |

Newsreader is only for names of things (a dish, a page). Everything you read while
cooking is Atkinson Hyperlegible, which was designed for low-vision readers: the same
problem as reading a step from across a kitchen. Timers use tabular figures (`font-mono`).

## Shape and layout

- Phone first: one column, 20px side gutter, reading content max 40rem.
- Photos are big and edge to edge where they lead (recipe header); 8px corners in grids.
- Radius: photos and buttons 8px, sheets 16px, chips fully round.
- Tap targets at least 48px. Primary buttons are ink with white text, 52px tall.
- No drop shadows, no cards inside cards. Separation is whitespace and Line hairlines.
- **The one bold thing is the photo.** In cooking mode, where there is no photo, the
  current step gets a 2px herb ring (`.enamel-rim`, kept as a class name).
- The app header shows a large Bon Taste wordmark at the top of the page that shrinks
  into a compact bar as you scroll.

## Words

- Sentence case everywhere. No all-caps labels, no labels above headings.
- No "A · B · C" metadata strings; write a short phrase.
- No arrows appended to buttons, no emoji as icons (icons come from lucide-react).
- A button says what happens: "Start cooking", "Share list".
- The chef is a quiet, competent kitchen voice, not a companion that asks about your day.

## Hands-free cooking

Cooking mode has a "Hands-free" button: wave at the front camera to turn the page
(frames stay on the phone, 48×36 greyscale, never recorded), say "next", "back",
"repeat", "start timer" or "chef, …", and a far view readable from across the kitchen.
Steps and chef answers are spoken in Gemini's voice when the server has a key, else
the best voice on the phone.

## Motion

Only in answer to an action. The one authored moment: the dish photo you tap grows
into the recipe's header photo (src/lib/motion/photoFlip.ts). Supporting motion: a
step sliding in after "Next", a tick drawing itself, a timer starting, the header
shrinking with scroll. Respect `prefers-reduced-motion`.
