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
 * Badge backdrops. Each one is a flat enamel colour that fills the inner circle of the
 * badge; the renderer adds the white rim and navy edge. Ids are stored in saved configs,
 * so never rename or remove them.
 */
export interface BackdropPreset {
  id: string;
  fill: string;
  label: string;
  labelZh: string;
}

export const BACKDROPS: BackdropPreset[] = [
  { id: "saffron", fill: "#f5c842", label: "Butter", labelZh: "牛油黃" },
  { id: "tomato", fill: "#d9553b", label: "Tomato", labelZh: "番茄紅" },
  { id: "basil", fill: "#3f8a5c", label: "Herb", labelZh: "香草綠" },
  { id: "blueberry", fill: "#2a4fbf", label: "Cobalt", labelZh: "鈷藍" },
  { id: "matcha", fill: "#a9c67e", label: "Matcha", labelZh: "抹茶" },
  { id: "peach", fill: "#f0a47c", label: "Peach", labelZh: "蜜桃" },
  { id: "taro", fill: "#a48cc4", label: "Taro", labelZh: "香芋" },
  { id: "charcoal", fill: "#47526b", label: "Slate", labelZh: "石板灰" },
];

/** Light to deep. All lowercase: the validator lowercases colours. */
export const SKIN_TONES = ["#fbe3cf", "#f3cfae", "#e6b48c", "#d39c6f", "#b87d52", "#96603c", "#744528", "#55311d"];
/** The first eight are natural shades (the randomiser prefers them). */
export const HAIR_COLORS = ["#1d1a22", "#3b2618", "#6a4128", "#8f4a26", "#c46a2f", "#b98a4e", "#e2c17c", "#9aa0a8", "#eef0f2", "#2a4fbf", "#23744a", "#c2557a"];
export const OUTFIT_COLORS = ["#ffffff", "#12204a", "#2a4fbf", "#8aa2e3", "#23744a", "#d9553b", "#f5c842", "#f3ead8", "#47526b", "#a48cc4"];
export const ACCENT_COLORS = ["#d9553b", "#2a4fbf", "#f5c842", "#23744a", "#12204a", "#ffffff", "#8aa2e3", "#e58fa0"];
export const HEADWEAR_COLORS = ["#ffffff", "#12204a", "#2a4fbf", "#d9553b", "#f5c842", "#23744a", "#8aa2e3", "#f3ead8"];

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
  accentColor: "#d9553b",
  neckerchief: true,
  headwear: "toque",
  headwearColor: "#ffffff",
  glasses: "none",
  backdrop: "blueberry",
};

/** Human labels for every option, used by the customizer UI. */
export const OPTION_LABELS: Record<string, { en: string; zh: string }> = {
  // face
  oval: { en: "Oval", zh: "鵝蛋臉" },
  round: { en: "Round", zh: "圓臉" },
  square: { en: "Square", zh: "方臉" },
  heart: { en: "Heart", zh: "心形臉" },
  // eyes
  friendly: { en: "Friendly", zh: "親切" },
  focused: { en: "Focused", zh: "專注" },
  happy: { en: "Happy", zh: "開心" },
  wink: { en: "Wink", zh: "眨眼" },
  calm: { en: "Calm", zh: "平靜" },
  // brows
  soft: { en: "Soft", zh: "柔和" },
  bold: { en: "Bold", zh: "濃眉" },
  arched: { en: "Arched", zh: "挑眉" },
  // mouth
  smile: { en: "Smile", zh: "微笑" },
  grin: { en: "Big grin", zh: "大笑" },
  smirk: { en: "Smirk", zh: "自信笑" },
  // facial hair
  none: { en: "None", zh: "無" },
  stubble: { en: "Stubble", zh: "鬍渣" },
  mustache: { en: "Mustache", zh: "八字鬍" },
  goatee: { en: "Goatee", zh: "山羊鬍" },
  beard: { en: "Beard", zh: "絡腮鬍" },
  // hair
  short: { en: "Short crop", zh: "短髮" },
  sidePart: { en: "Side part", zh: "側分" },
  curly: { en: "Curly", zh: "捲髮" },
  bun: { en: "Chef bun", zh: "丸子頭" },
  long: { en: "Long", zh: "長髮" },
  ponytail: { en: "Ponytail", zh: "馬尾" },
  buzz: { en: "Buzz cut", zh: "平頭" },
  bald: { en: "Bald", zh: "光頭" },
  // outfit
  chefCoat: { en: "Chef coat", zh: "廚師服" },
  apron: { en: "Bistro apron", zh: "小館圍裙" },
  tee: { en: "Kitchen tee", zh: "廚房 T 恤" },
  kimono: { en: "Sushi wrap", zh: "壽司師傅服" },
  // headwear
  toque: { en: "Toque", zh: "高帽" },
  bandana: { en: "Bandana", zh: "頭巾" },
  cap: { en: "Flat cap", zh: "鴨舌帽" },
  beret: { en: "Beret", zh: "貝雷帽" },
  // glasses (round/square reuse face keys above)
};

export function optionLabel(id: string, language: string): string {
  const entry = OPTION_LABELS[id];
  if (!entry) return id;
  return language === "zh-HK" ? entry.zh : entry.en;
}

/* ---------------------------------- Personalities ---------------------------------- */

export const CHEF_PERSONALITIES = [
  {
    id: "friendly",
    emoji: "🌟",
    label: "Friendly and warm",
    labelZh: "親切溫暖",
    description: "Supportive and encouraging, like a close friend in the kitchen.",
    descriptionZh: "溫暖鼓勵、善解人意，就像在廚房陪著你的好朋友。",
    greeting: "Hi! I'm so happy to meet you. Let's cook something cozy together — no pressure, ever.",
    greetingZh: "你好！好開心認識你。我哋一齊煮啲溫暖嘅嘢食，唔使有壓力！",
  },
  {
    id: "professional",
    emoji: "🔥",
    label: "Executive chef",
    labelZh: "專業星廚",
    description: "Precise techniques and Michelin-standard plating advice.",
    descriptionZh: "注重精準刀工火候、米芝蓮星級技巧。",
    greeting: "Welcome to my kitchen. Sharp knives, hot pans, clean station — let's make something exceptional.",
    greetingZh: "歡迎來到我的廚房。刀要利、鑊要熱，我們一起做出出色的菜式。",
  },
  {
    id: "playful",
    emoji: "🎉",
    label: "Playful and fun",
    labelZh: "活潑搞怪",
    description: "Energetic, full of food puns and upbeat vibes.",
    descriptionZh: "幽默生動、活力滿滿，讓烹飪充滿歡笑。",
    greeting: "Heyyy! Ready to have a grate time? I promise my puns are only slightly cheesy.",
    greetingZh: "嘿！準備好一齊玩轉廚房未？我保證笑話只係少少「芝士」！",
  },
  {
    id: "calm",
    emoji: "🍵",
    label: "Mindful and calm",
    labelZh: "療癒平靜",
    description: "Patient and soothing — stress-free comfort cooking.",
    descriptionZh: "沉穩舒緩、耐性陪伴，帶來放鬆的療癒美食。",
    greeting: "Hello, friend. Take a breath. We'll cook slowly and simply, one gentle step at a time.",
    greetingZh: "你好，朋友。深呼吸一下，我們慢慢來，一步一步輕鬆煮。",
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

