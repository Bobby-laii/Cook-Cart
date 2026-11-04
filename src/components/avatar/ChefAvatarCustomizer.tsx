"use client";

import React, { createContext, useContext, useState } from "react";
import { Check, Palette, Plus, Scissors, Shirt, Smile, ChefHat, Image as ImageIcon } from "lucide-react";
import { ChefAvatar } from "@/components/avatar/ChefAvatar";
import {
  ACCENT_COLORS,
  BACKDROPS,
  BROW_STYLES,
  ChefAvatarConfig,
  EYE_STYLES,
  FACE_SHAPES,
  FACIAL_HAIR_STYLES,
  GLASSES_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR_COLORS,
  HEADWEAR_STYLES,
  MOUTH_STYLES,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  SKIN_TONES,
  luminance,
  optionLabel,
} from "@/lib/avatar/chefAvatar";

type TabId = "face" | "expression" | "hair" | "outfit" | "headwear" | "backdrop";
type ColorField = "skinTone" | "hairColor" | "outfitColor" | "accentColor" | "headwearColor";
type ToggleField = "blush" | "neckerchief";

const TABS: { id: TabId; en: string; zh: string; icon: React.ElementType }[] = [
  { id: "face", en: "Skin and face", zh: "膚色與臉型", icon: Palette },
  { id: "expression", en: "Expression", zh: "表情", icon: Smile },
  { id: "hair", en: "Hair", zh: "髮型", icon: Scissors },
  { id: "outfit", en: "Outfit", zh: "服裝", icon: Shirt },
  { id: "headwear", en: "Hat and glasses", zh: "帽子與眼鏡", icon: ChefHat },
  { id: "backdrop", en: "Badge", zh: "徽章底色", icon: ImageIcon },
];

/* ------------------------------------------------------------------ */
/* Shared editor context (keeps the building blocks at module level so */
/* they don't remount — and close the colour picker — on every change) */
/* ------------------------------------------------------------------ */

interface EditorCtx {
  value: ChefAvatarConfig;
  set: <K extends keyof ChefAvatarConfig>(field: K, v: ChefAvatarConfig[K]) => void;
  language: string;
}

const Ctx = createContext<EditorCtx | null>(null);

function useEditor(): EditorCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("ChefAvatarCustomizer building blocks must be used inside the customizer");
  return ctx;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[17px] font-bold leading-snug text-stone-900">{title}</h3>
      {children}
    </section>
  );
}

/** Grid of small tiles: each tile previews the current avatar with that option applied. */
function OptionGrid<K extends keyof ChefAvatarConfig>({
  field,
  options,
  labelFor,
}: {
  field: K;
  options: readonly ChefAvatarConfig[K][];
  labelFor?: (o: ChefAvatarConfig[K]) => string;
}) {
  const { value, set, language } = useEditor();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const active = value[field] === opt;
        const label = labelFor ? labelFor(opt) : optionLabel(String(opt), language);
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => set(field, opt)}
            aria-pressed={active}
            className={`relative flex min-h-[48px] flex-col items-center gap-1.5 rounded-[14px] border-2 px-1.5 pb-2 pt-2.5 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
              active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-stone-50 hover:border-brand-300"
            }`}
          >
            <ChefAvatar config={{ ...value, [field]: opt }} size={64} className="rounded-full" />
            <span className={`text-sm leading-tight text-center ${active ? "font-bold text-brand-600" : "text-stone-700"}`}>{label}</span>
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Swatches({ field, colors }: { field: ColorField; colors: string[] }) {
  const { value, set, language } = useEditor();
  const current = value[field];
  const isCustom = !colors.includes(current);
  const ring = "outline outline-[3px] outline-offset-2 outline-brand-500";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {colors.map((color) => {
        const active = current === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => set(field, color)}
            aria-label={color}
            aria-pressed={active}
            className={`h-12 w-12 rounded-full border-2 border-stone-900/15 transition-[outline-color] ${active ? ring : "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500"}`}
            style={{ backgroundColor: color }}
          >
            {active && <Check className="mx-auto h-5 w-5" strokeWidth={3} color={luminance(color) > 150 ? "#12204A" : "#FFFFFF"} aria-hidden />}
          </button>
        );
      })}
      <label
        className={`relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 ${
          isCustom ? `border-stone-900/15 ${ring}` : "border-dashed border-stone-300 bg-stone-50"
        }`}
        style={isCustom ? { backgroundColor: current } : undefined}
        title={language === "zh-HK" ? "自訂顏色" : "Custom colour"}
      >
        {!isCustom && <Plus className="h-5 w-5 text-stone-500" aria-hidden />}
        <span className="sr-only">{language === "zh-HK" ? "自訂顏色" : "Custom colour"}</span>
        <input
          type="color"
          value={current}
          onChange={(e) => set(field, e.target.value.toLowerCase())}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function Toggle({ field, label }: { field: ToggleField; label: string }) {
  const { value, set } = useEditor();
  const on = value[field];
  return (
    <button
      type="button"
      role="switch"
      onClick={() => set(field, !on)}
      aria-checked={on}
      className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-[17px] text-stone-900"
    >
      {label}
      <span className={`h-7 w-12 rounded-full p-1 transition-colors ${on ? "bg-brand-500" : "bg-stone-300"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Customizer                                                          */
/* ------------------------------------------------------------------ */

export interface ChefAvatarCustomizerProps {
  value: ChefAvatarConfig;
  onChange: (next: ChefAvatarConfig, changedField: keyof ChefAvatarConfig) => void;
  language: string;
}

export function ChefAvatarCustomizer({ value, onChange, language }: ChefAvatarCustomizerProps) {
  const [tab, setTab] = useState<TabId>("face");
  const zh = language === "zh-HK";
  const L = (en: string, zhText: string) => (zh ? zhText : en);

  const set: EditorCtx["set"] = (field, v) => onChange({ ...value, [field]: v }, field);

  return (
    <Ctx.Provider value={{ value, set, language }}>
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50">
        {/* Category chips */}
        <div role="tablist" aria-label={L("Parts of your chef", "大廚造型部分")} className="flex gap-2 overflow-x-auto border-b border-stone-200 px-4 py-3">
          {TABS.map(({ id, en, zh: zhLabel, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex min-h-[48px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-2 px-4 text-[15px] transition-colors ${
                  active ? "border-brand-500 bg-brand-500 font-bold text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-brand-300"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {zh ? zhLabel : en}
              </button>
            );
          })}
        </div>

        <div className="space-y-7 p-4 sm:p-6 lg:max-h-[600px] lg:overflow-y-auto">
          {tab === "face" && (
            <>
              <Section title={L("Skin tone", "膚色")}>
                <Swatches field="skinTone" colors={SKIN_TONES} />
              </Section>
              <Section title={L("Face shape", "臉型")}>
                <OptionGrid field="faceShape" options={FACE_SHAPES} />
              </Section>
              <Toggle field="blush" label={L("Rosy cheeks", "臉頰紅暈")} />
            </>
          )}

          {tab === "expression" && (
            <>
              <Section title={L("Eyes", "眼睛")}>
                <OptionGrid field="eyes" options={EYE_STYLES} />
              </Section>
              <Section title={L("Mouth", "嘴巴")}>
                <OptionGrid field="mouth" options={MOUTH_STYLES} />
              </Section>
              <Section title={L("Eyebrows", "眉毛")}>
                <OptionGrid field="brows" options={BROW_STYLES} />
              </Section>
            </>
          )}

          {tab === "hair" && (
            <>
              <Section title={L("Hair colour", "髮色")}>
                <Swatches field="hairColor" colors={HAIR_COLORS} />
              </Section>
              <Section title={L("Hairstyle", "髮型")}>
                <OptionGrid field="hairStyle" options={HAIR_STYLES} />
              </Section>
              <Section title={L("Facial hair", "鬍子")}>
                <OptionGrid field="facialHair" options={FACIAL_HAIR_STYLES} />
              </Section>
            </>
          )}

          {tab === "outfit" && (
            <>
              <Section title={L("Uniform", "制服")}>
                <OptionGrid field="outfit" options={OUTFIT_STYLES} />
              </Section>
              <Section title={value.outfit === "apron" ? L("Apron colour", "圍裙顏色") : L("Fabric colour", "布料顏色")}>
                <Swatches field="outfitColor" colors={OUTFIT_COLORS} />
              </Section>
              <Section
                title={value.outfit === "apron" ? L("Shirt and neckerchief colour", "襯衫與領巾顏色") : L("Trim and neckerchief colour", "滾邊與領巾顏色")}
              >
                <Swatches field="accentColor" colors={ACCENT_COLORS} />
              </Section>
              <Toggle field="neckerchief" label={L("Neckerchief", "領巾")} />
            </>
          )}

          {tab === "headwear" && (
            <>
              <Section title={L("Headwear", "帽子")}>
                <OptionGrid field="headwear" options={HEADWEAR_STYLES} />
              </Section>
              {value.headwear !== "none" && (
                <Section title={L("Hat colour", "帽子顏色")}>
                  <Swatches field="headwearColor" colors={HEADWEAR_COLORS} />
                </Section>
              )}
              <Section title={L("Glasses", "眼鏡")}>
                <OptionGrid
                  field="glasses"
                  options={GLASSES_STYLES}
                  labelFor={(o) => (o === "none" ? L("None", "無") : o === "round" ? L("Round", "圓框") : L("Square", "方框"))}
                />
              </Section>
            </>
          )}

          {tab === "backdrop" && (
            <Section title={L("Badge colour", "徽章底色")}>
              <OptionGrid
                field="backdrop"
                options={BACKDROPS.map((b) => b.id)}
                labelFor={(id) => {
                  const b = BACKDROPS.find((x) => x.id === id);
                  return b ? (zh ? b.labelZh : b.label) : String(id);
                }}
              />
            </Section>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
