/**
 * Chef avatar data model.
 *
 * The avatar is stored as a small JSON config (not an image) on User.chefAvatarConfig.
 * The same config is rendered by <ChefAvatar /> everywhere in the app, so changing
 * the look updates the chat, sidebar and settings instantly.
 *
 * This module is shared by the client (customizer UI) and the server (API validation),
 * so it must stay free of React / browser APIs.
 */

export const FACE_SHAPES = ["oval", "round", "square", "heart"] as const;
export const EYE_STYLES = ["friendly", "focused", "happy", "wink", "calm"] as const;
export const BROW_STYLES = ["soft", "bold", "arched"] as const;
export const MOUTH_STYLES = ["smile", "grin", "smirk", "calm"] as const;
export const FACIAL_HAIR_STYLES = ["none", "stubble", "mustache", "goatee", "beard"] as const;
export const HAIR_STYLES = ["short", "sidePart", "curly", "bun", "long", "ponytail", "buzz", "bald"] as const;
export const OUTFIT_STYLES = ["chefCoat", "apron", "tee", "kimono"] as const;
export const HEADWEAR_STYLES = ["none", "toque", "bandana", "cap", "beret"] as const;
export const GLASSES_STYLES = ["none", "round", "square"] as const;

export type FaceShape = (typeof FACE_SHAPES)[number];
export type EyeStyle = (typeof EYE_STYLES)[number];
export type BrowStyle = (typeof BROW_STYLES)[number];
export type MouthStyle = (typeof MOUTH_STYLES)[number];
export type FacialHairStyle = (typeof FACIAL_HAIR_STYLES)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type OutfitStyle = (typeof OUTFIT_STYLES)[number];
export type HeadwearStyle = (typeof HEADWEAR_STYLES)[number];
export type GlassesStyle = (typeof GLASSES_STYLES)[number];

/**
 * Backdrops. Each one is a soft, muted colour that fills the avatar's round background.
 * Ids are stored in saved configs, so never rename or remove them (the old enamel names
 * are kept as ids; the label is what people see).
 */
export interface BackdropPreset {
  id: string;
  fill: string;
  label: string;
}

export const BACKDROPS: BackdropPreset[] = [
  { id: "peach", fill: "#f4d9c6", label: "Peach" },
  { id: "basil", fill: "#d5e0cd", label: "Sage" },
  { id: "blueberry", fill: "#d4e1ed", label: "Sky" },
  { id: "saffron", fill: "#f3e4b9", label: "Butter" },
  { id: "taro", fill: "#e2d8ec", label: "Lilac" },
  { id: "matcha", fill: "#ebe2d3", label: "Sand" },
  { id: "tomato", fill: "#f1d1cb", label: "Rose" },
  { id: "charcoal", fill: "#dfe4e9", label: "Mist" },
];

/** Light to deep. All lowercase: the validator lowercases colours. */
export const SKIN_TONES = ["#fbe3cf", "#f3cfae", "#e6b48c", "#d39c6f", "#b87d52", "#96603c", "#744528", "#55311d"];
/** The first eight are natural shades (the randomiser prefers them). */
export const HAIR_COLORS = ["#1d1a22", "#3b2618", "#6a4128", "#8f4a26", "#c46a2f", "#b98a4e", "#e2c17c", "#9aa0a8", "#eef0f2", "#2a4fbf", "#23744a", "#c2557a"];
export const OUTFIT_COLORS = ["#ffffff", "#f3ede2", "#3f4a5a", "#86a3c8", "#93b59c", "#e39a84", "#efce82", "#bcaad2", "#d9c8b2", "#5f7d68"];
export const ACCENT_COLORS = ["#e39a84", "#86a3c8", "#efce82", "#6f9a7c", "#3f4a5a", "#ffffff", "#bcaad2", "#eab0ba"];
export const HEADWEAR_COLORS = ["#ffffff", "#3f4a5a", "#86a3c8", "#e39a84", "#efce82", "#6f9a7c", "#bcaad2", "#f3ede2"];

export interface ChefAvatarConfig {
  v: 1;
  faceShape: FaceShape;
  skinTone: string;
  blush: boolean;
  eyes: EyeStyle;
  brows: BrowStyle;
  mouth: MouthStyle;
  facialHair: FacialHairStyle;
  hairStyle: HairStyle;
  hairColor: string;
  outfit: OutfitStyle;
  outfitColor: string;
  accentColor: string;
  neckerchief: boolean;
  headwear: HeadwearStyle;
  headwearColor: string;
  glasses: GlassesStyle;
  backdrop: string;
}

export const DEFAULT_CHEF_AVATAR: ChefAvatarConfig = {
  v: 1,
  faceShape: "oval",
  skinTone: "#e6b48c",
  blush: true,
  eyes: "friendly",
  brows: "soft",
  mouth: "smile",
  facialHair: "none",
  hairStyle: "short",
  hairColor: "#3b2618",
  outfit: "chefCoat",
  outfitColor: "#ffffff",
  accentColor: "#e39a84",
  neckerchief: true,
  headwear: "toque",
  headwearColor: "#ffffff",
  glasses: "none",
  backdrop: "peach",
};

/** Human labels for every option, used by the customizer UI. */
export const OPTION_LABELS: Record<string, string> = {
  // face
  oval: "Oval",
  round: "Round",
  square: "Square",
  heart: "Heart",
  // eyes
  friendly: "Friendly",
  focused: "Focused",
  happy: "Happy",
  wink: "Wink",
  calm: "Calm",
  // brows
  soft: "Soft",
  bold: "Bold",
  arched: "Arched",
  // mouth
  smile: "Smile",
  grin: "Big grin",
  smirk: "Smirk",
  // facial hair
  none: "None",
  stubble: "Stubble",
  mustache: "Mustache",
  goatee: "Goatee",
  beard: "Beard",
  // hair
  short: "Short crop",
  sidePart: "Side part",
  curly: "Curly",
  bun: "Chef bun",
  long: "Long",
  ponytail: "Ponytail",
  buzz: "Buzz cut",
  bald: "Bald",
  // outfit
  chefCoat: "Chef coat",
  apron: "Bistro apron",
  tee: "Kitchen tee",
  kimono: "Sushi wrap",
  // headwear
  toque: "Toque",
  bandana: "Bandana",
  cap: "Flat cap",
  beret: "Beret",
  // glasses (round/square reuse face keys above)
};

export function optionLabel(id: string): string {
  return OPTION_LABELS[id] ?? id;
}

/* ---------------------------------- Personalities ---------------------------------- */

export const CHEF_PERSONALITIES = [
  {
    id: "friendly",
    label: "Friendly and warm",
    description: "Supportive and encouraging, like a close friend in the kitchen.",
    greeting: "Hi! I'm so happy to meet you. Let's cook something cozy together — no pressure, ever.",
  },
  {
    id: "professional",
    label: "Executive chef",
    description: "Precise techniques and Michelin-standard plating advice.",
    greeting: "Welcome to my kitchen. Sharp knives, hot pans, clean station — let's make something exceptional.",
  },
  {
    id: "playful",
    label: "Playful and fun",
    description: "Energetic, full of food puns and upbeat vibes.",
    greeting: "Heyyy! Ready to have a grate time? I promise my puns are only slightly cheesy.",
  },
  {
    id: "calm",
    label: "Mindful and calm",
    description: "Patient and soothing — stress-free comfort cooking.",
    greeting: "Hello, friend. Take a breath. We'll cook slowly and simply, one gentle step at a time.",
  },
] as const;

export type ChefPersonalityId = (typeof CHEF_PERSONALITIES)[number]["id"];

export function isValidPersonality(id: unknown): id is ChefPersonalityId {
  return typeof id === "string" && CHEF_PERSONALITIES.some((p) => p.id === id);
}

/* ---------------------------------- Validation ---------------------------------- */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function pick<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

function hex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value) ? value.toLowerCase() : fallback;
}

/**
 * Coerces untrusted input (request body, DB string) into a valid config.
 * Unknown keys are dropped; invalid values fall back to defaults. Never throws.
 */
export function sanitizeChefAvatarConfig(input: unknown): ChefAvatarConfig {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_CHEF_AVATAR;
  return {
    v: 1,
    faceShape: pick(FACE_SHAPES, raw.faceShape, d.faceShape),
    skinTone: hex(raw.skinTone, d.skinTone),
    blush: typeof raw.blush === "boolean" ? raw.blush : d.blush,
    eyes: pick(EYE_STYLES, raw.eyes, d.eyes),
    brows: pick(BROW_STYLES, raw.brows, d.brows),
    mouth: pick(MOUTH_STYLES, raw.mouth, d.mouth),
    facialHair: pick(FACIAL_HAIR_STYLES, raw.facialHair, d.facialHair),
    hairStyle: pick(HAIR_STYLES, raw.hairStyle, d.hairStyle),
    hairColor: hex(raw.hairColor, d.hairColor),
    outfit: pick(OUTFIT_STYLES, raw.outfit, d.outfit),
    outfitColor: hex(raw.outfitColor, d.outfitColor),
    accentColor: hex(raw.accentColor, d.accentColor),
    neckerchief: typeof raw.neckerchief === "boolean" ? raw.neckerchief : d.neckerchief,
    headwear: pick(HEADWEAR_STYLES, raw.headwear, d.headwear),
    headwearColor: hex(raw.headwearColor, d.headwearColor),
    glasses: pick(GLASSES_STYLES, raw.glasses, d.glasses),
    backdrop: BACKDROPS.some((b) => b.id === raw.backdrop) ? (raw.backdrop as string) : d.backdrop,
  };
}

/** Parses the JSON string stored in the DB. Returns null when absent or unparsable. */
export function parseChefAvatarConfig(stored: string | null | undefined): ChefAvatarConfig | null {
  if (!stored) return null;
  try {
    return sanitizeChefAvatarConfig(JSON.parse(stored));
  } catch {
    return null;
  }
}

/* ---------------------------------- Randomizer ---------------------------------- */

function rand<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Produces a random but coordinated look (e.g. white coats get a coloured accent). */
export function randomChefAvatar(): ChefAvatarConfig {
  const outfit = rand(OUTFIT_STYLES);
  const outfitColor = outfit === "chefCoat" && Math.random() < 0.6 ? "#ffffff" : rand(OUTFIT_COLORS);
  const accentPool = ACCENT_COLORS.filter((c) => c !== outfitColor);
  const headwear = Math.random() < 0.35 ? "toque" : rand(HEADWEAR_STYLES);
  return {
    v: 1,
    faceShape: rand(FACE_SHAPES),
    skinTone: rand(SKIN_TONES),
    blush: Math.random() < 0.6,
    eyes: rand(EYE_STYLES),
    brows: rand(BROW_STYLES),
    mouth: rand(MOUTH_STYLES),
    facialHair: Math.random() < 0.6 ? "none" : rand(FACIAL_HAIR_STYLES),
    hairStyle: rand(HAIR_STYLES),
    hairColor: Math.random() < 0.8 ? rand(HAIR_COLORS.slice(0, 8)) : rand(HAIR_COLORS),
    outfit,
    outfitColor,
    accentColor: rand(accentPool),
    neckerchief: Math.random() < 0.4,
    headwear,
    headwearColor: headwear === "toque" ? "#ffffff" : rand(HEADWEAR_COLORS),
    glasses: Math.random() < 0.75 ? "none" : rand(GLASSES_STYLES),
    backdrop: rand(BACKDROPS).id,
  };
}

/**
 * Names for "Surprise me", from kitchens around the world. Short enough for the
 * chat header (the field allows 30 characters).
 */
export const CHEF_NAMES = [
  "Chef Mei", "Nonna Rosa", "Chef Oliver", "Sous-chef Kai", "Chef Amara", "Chef Mateo",
  "Auntie Lin", "Chef Priya", "Chef Hiro", "Chef Leila", "Chef Tomás", "Chef Noor",
  "Chef Sofia", "Chef Kofi", "Chef Ana", "Chef Ravi", "Chef Yuna", "Chef Malik",
  "Chef Ingrid", "Chef Dara", "Chef Bao", "Chef Elena", "Chef Sami", "Chef Wren",
] as const;

/** A random chef name, never the one passed in (so each tap changes it). */
export function randomChefName(current = ""): string {
  const pool = CHEF_NAMES.filter((n) => n !== current);
  return rand(pool);
}

/* ---------------------------------- Colour helpers ---------------------------------- */

/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb colour. amount in [-1, 1]. */
export function shade(hexColor: string, amount: number): string {
  const n = parseInt(hexColor.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const target = amount < 0 ? 0 : 255;
    return Math.round(c + (target - c) * Math.abs(amount));
  });
  return "#" + channels.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** Perceived brightness 0–255, used to pick contrasting line colours. */
export function luminance(hexColor: string): number {
  const n = parseInt(hexColor.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

