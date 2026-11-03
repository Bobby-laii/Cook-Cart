# Bon Taste design: Enamelware

Bon Taste is a calm cooking companion. Its main moment is a phone propped up on a
kitchen counter in the evening, read from about a metre away by someone whose hands
are busy. The look comes from enamel cookware and old kitchen timers: clean white
enamel, a deep cobalt rim, butter yellow for the thing that is running right now.

It is a phone app first (installable web app now, App Store later). Desktop is the
same app with more room, not a website.

## Colour

| Token | Hex | Tailwind | Use |
| --- | --- | --- | --- |
| Enamel | `#F4F6F8` | `stone-100` | App background |
| Pot white | `#FFFFFF` | `stone-50` | Raised surfaces: sheets, inputs, the step card |
| Speckle | `#E3E8EF` | `stone-200` | Lines and quiet borders |
| Ink | `#12204A` | `stone-900` | Text, icons |
| Cobalt | `#2A4FBF` / `#1D3B9A` | `brand-500` / `brand-600` | Primary actions, the rim, active tab |
| Butter | `#F5C842` | `butter-400` | Only what is live: a running timer, the current step, a ticked item's flash |
| Herb | `#23744A` | `fresh-600` | "You already have this" |

Muted text is `stone-500` (`#5B6680`, 5.6:1 on enamel). Errors use `#B3261E` (`danger`).
`amber-*` is an alias of cobalt for older pages; do not use it in new code.

## Type

One family: **Atkinson Hyperlegible** (Regular 400, Bold 700). It was designed for
low-vision readers, which is the same problem as reading a step from across a kitchen.
Hierarchy comes from size and weight only.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Step text in cooking mode | 28–34px / 1.3 | 700 |
| Page title | 32–40px / 1.1 | 700 |
| Section title | 22px / 1.25 | 700 |
| Body | 17px / 1.55 | 400 |
| Small | 14px / 1.45 | 400 |

Timers use tabular figures (`font-mono` maps to the same family with `tabular-nums`).

## Shape and layout

- Phone first: one column, 20px side gutter, content max 40rem on reading pages.
- Tap targets at least 48px tall. Primary buttons are 52px, cobalt, radius 14px.
- Radius has a hierarchy: photos 16px, sheets and the step card 24px, buttons 14px,
  chips fully round. Not one radius on everything.
- No drop shadows. Separation comes from Pot white on Enamel and Speckle lines.
- **The one bold thing is the enamel rim**: a 3px cobalt ring on a white sheet. It is
  used only for the current step in cooking mode. Everything else stays quiet.

## Words

- Sentence case everywhere. No all-caps labels, no labels above headings that only
  repeat the heading.
- No "A · B · C" strings of metadata; write it as a short phrase or separate lines.
- No arrows appended to buttons. A button says what happens: "Start cooking", "Share list".
- Only number things that really are a sequence (cooking steps).

## Motion

Only in answer to an action: a step sliding in after "Next", a timer starting. Respect
`prefers-reduced-motion`.
