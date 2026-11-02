"use client";

import React, { createContext, useContext, useState } from "react";
import { Check, Palette, Scissors, Shirt, Smile, ChefHat, Image as ImageIcon } from "lucide-react";
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
  optionLabel,
} from "@/lib/avatar/chefAvatar";

type TabId = "face" | "expression" | "hair" | "outfit" | "headwear" | "backdrop";
type ColorField = "skinTone" | "hairColor" | "outfitColor" | "accentColor" | "headwearColor";
type ToggleField = "blush" | "neckerchief";

const TABS: { id: TabId; en: string; zh: string; icon: React.ElementType }[] = [
  { id: "face", en: "Skin & Face", zh: "膚色與臉型", icon: Palette },
  { id: "expression", en: "Expression", zh: "表情", icon: Smile },
  { id: "hair", en: "Hair", zh: "髮型", icon: Scissors },
  { id: "outfit", en: "Outfit", zh: "服裝", icon: Shirt },
  { id: "headwear", en: "Hats & Glasses", zh: "帽子與眼鏡", icon: ChefHat },
  { id: "backdrop", en: "Backdrop", zh: "背景", icon: ImageIcon },
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
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">{title}</h3>
      {children}
    </section>
  );
}

/** Grid of tiles — each tile previews the current avatar with that option applied. */
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
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {options.map((opt) => {
        const active = value[field] === opt;
        const label = labelFor ? labelFor(opt) : optionLabel(String(opt), language);
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => set(field, opt)}
            aria-pressed={active}
            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition ${
              active
                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40 shadow-sm"
                : "border-stone-200 bg-white hover:border-amber-300 hover:-translate-y-0.5"
            }`}
          >
            <ChefAvatar config={{ ...value, [field]: opt }} size={64} className="rounded-full" />
            <span className={`text-[11px] font-semibold leading-tight text-center ${active ? "text-amber-800" : "text-stone-600"}`}>
              {label}
            </span>
            {active && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={3} />
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
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((color) => {
        const active = current === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => set(field, color)}
            aria-label={color}
            aria-pressed={active}
            className={`w-9 h-9 rounded-full border transition ${
              active ? "ring-2 ring-offset-2 ring-amber-500 scale-110 border-white" : "border-stone-300 hover:scale-110"
            }`}
            style={{ backgroundColor: color }}
          />
        );
      })}
      <label
        className={`relative w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition hover:scale-110 ${
          isCustom ? "ring-2 ring-offset-2 ring-amber-500 border-transparent" : "border-stone-300"
        }`}
        style={isCustom ? { backgroundColor: current } : undefined}
        title={language === "zh-HK" ? "自訂顏色" : "Custom colour"}
      >
        {!isCustom && <span className="text-stone-400 text-lg leading-none">+</span>}
        <input
          type="color"
          value={current}
          onChange={(e) => set(field, e.target.value.toLowerCase())}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}

function Toggle({ field, label }: { field: ToggleField; label: string }) {
  const { value, set } = useEditor();
  const on = value[field];
  return (
    <button type="button" onClick={() => set(field, !on)} aria-pressed={on} className="flex items-center gap-3 text-sm font-medium text-stone-700">
      <span className={`w-11 h-6 rounded-full p-0.5 transition ${on ? "bg-amber-500" : "bg-stone-300"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
      {label}
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
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto p-3 border-b border-stone-100 bg-stone-50/60">
          {TABS.map(({ id, en, zh: zhLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                tab === id ? "bg-stone-900 text-white shadow" : "text-stone-600 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {zh ? zhLabel : en}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 space-y-7 max-h-[560px] overflow-y-auto">
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
                title={value.outfit === "apron" ? L("Shirt & neckerchief colour", "襯衫與領巾顏色") : L("Trim & neckerchief colour", "滾邊與領巾顏色")}
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
            <Section title={L("Backdrop", "背景")}>
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
