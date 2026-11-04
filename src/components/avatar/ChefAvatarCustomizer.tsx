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
  optionLabel,
} from "@/lib/avatar/chefAvatar";
import { chip, cx } from "@/components/ui/styles";

type TabId = "face" | "expression" | "hair" | "outfit" | "headwear" | "backdrop";
type ColorField = "skinTone" | "hairColor" | "outfitColor" | "accentColor" | "headwearColor";
type ToggleField = "blush" | "neckerchief";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "face", label: "Skin and face", icon: Palette },
  { id: "expression", label: "Expression", icon: Smile },
  { id: "hair", label: "Hair", icon: Scissors },
  { id: "outfit", label: "Outfit", icon: Shirt },
  { id: "headwear", label: "Hat and glasses", icon: ChefHat },
  { id: "backdrop", label: "Background", icon: ImageIcon },
];

/* ------------------------------------------------------------------ */
/* Shared editor context (keeps the building blocks at module level so */
/* they don't remount — and close the colour picker — on every change) */
/* ------------------------------------------------------------------ */

interface EditorCtx {
  value: ChefAvatarConfig;
  set: <K extends keyof ChefAvatarConfig>(field: K, v: ChefAvatarConfig[K]) => void;
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
      <h3 className="text-body font-bold leading-snug text-stone-900">{title}</h3>
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
  const { value, set } = useEditor();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const active = value[field] === opt;
        const label = labelFor ? labelFor(opt) : optionLabel(String(opt));
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => set(field, opt)}
            aria-pressed={active}
            className={`relative flex min-h-[48px] flex-col items-center gap-1.5 rounded-[14px] border-2 px-1.5 pb-2 pt-2.5 transition-colors ${
              active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-stone-50 hover:border-brand-300"
            }`}
          >
            <ChefAvatar config={{ ...value, [field]: opt }} size={64} className="rounded-full" />
            <span className={`text-caption leading-tight text-center ${active ? "font-bold text-brand-600" : "text-stone-700"}`}>{label}</span>
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
  const { value, set } = useEditor();
  const current = value[field];
  const isCustom = !colors.includes(current);
  // "Selected" is a ring (box-shadow), so the global focus outline still shows on top of it.
  const ring = "ring-2 ring-stone-900 ring-offset-2 ring-offset-stone-50";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {colors.map((color, i) => {
        const active = current === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => set(field, color)}
            aria-label={`Colour ${i + 1}`}
            title={`Colour ${i + 1}`}
            aria-pressed={active}
            className={cx("flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-900/15", active && ring)}
            style={{ backgroundColor: color }}
          >
            {/* The tick sits on its own paper disc, so it reads on any swatch in light and dark. */}
            {active && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-50 text-stone-900">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </span>
            )}
          </button>
        );
      })}
      {/* The colour input is invisible, so its keyboard focus ring is drawn on the label. */}
      <label
        className={`relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stone-900 ${
          isCustom ? `border-stone-900/15 ${ring}` : "border-dashed border-stone-300 bg-stone-50"
        }`}
        style={isCustom ? { backgroundColor: current } : undefined}
        title="Custom colour"
      >
        {!isCustom && <Plus className="h-5 w-5 text-stone-500" aria-hidden />}
        {isCustom && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-50 text-stone-900" aria-hidden>
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
        <span className="sr-only">Custom colour</span>
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
      className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-body text-stone-900"
    >
      {label}
      <span className={`h-7 w-12 rounded-full p-1 transition-colors ${on ? "bg-brand-500" : "bg-stone-300"}`}>
        <span className={`block h-5 w-5 rounded-full bg-stone-50 transition-transform motion-reduce:transition-none ${on ? "translate-x-5" : ""}`} />
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
}

export function ChefAvatarCustomizer({ value, onChange }: ChefAvatarCustomizerProps) {
  const [tab, setTab] = useState<TabId>("face");

  const set: EditorCtx["set"] = (field, v) => onChange({ ...value, [field]: v }, field);

  return (
    <Ctx.Provider value={{ value, set }}>
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50">
        {/* Category chips */}
        <div role="tablist" aria-label="Parts of your chef" className="flex gap-2 overflow-x-auto border-b border-stone-200 px-4 py-3">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={chip(active, "shrink-0 gap-2")}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div className="space-y-7 p-4 sm:p-6 lg:max-h-[600px] lg:overflow-y-auto">
          {tab === "face" && (
            <>
              <Section title="Skin tone">
                <Swatches field="skinTone" colors={SKIN_TONES} />
              </Section>
              <Section title="Face shape">
                <OptionGrid field="faceShape" options={FACE_SHAPES} />
              </Section>
              <Toggle field="blush" label="Rosy cheeks" />
            </>
          )}

          {tab === "expression" && (
            <>
              <Section title="Eyes">
                <OptionGrid field="eyes" options={EYE_STYLES} />
              </Section>
              <Section title="Mouth">
                <OptionGrid field="mouth" options={MOUTH_STYLES} />
              </Section>
              <Section title="Eyebrows">
                <OptionGrid field="brows" options={BROW_STYLES} />
              </Section>
            </>
          )}

          {tab === "hair" && (
            <>
              <Section title="Hair colour">
                <Swatches field="hairColor" colors={HAIR_COLORS} />
              </Section>
              <Section title="Hairstyle">
                <OptionGrid field="hairStyle" options={HAIR_STYLES} />
              </Section>
              <Section title="Facial hair">
                <OptionGrid field="facialHair" options={FACIAL_HAIR_STYLES} />
              </Section>
            </>
          )}

          {tab === "outfit" && (
            <>
              <Section title="Uniform">
                <OptionGrid field="outfit" options={OUTFIT_STYLES} />
              </Section>
              <Section title={value.outfit === "apron" ? "Apron colour" : "Fabric colour"}>
                <Swatches field="outfitColor" colors={OUTFIT_COLORS} />
              </Section>
              <Section
                title={value.outfit === "apron" ? "Shirt and neckerchief colour" : "Trim and neckerchief colour"}
              >
                <Swatches field="accentColor" colors={ACCENT_COLORS} />
              </Section>
              <Toggle field="neckerchief" label="Neckerchief" />
            </>
          )}

          {tab === "headwear" && (
            <>
              <Section title="Headwear">
                <OptionGrid field="headwear" options={HEADWEAR_STYLES} />
              </Section>
              {value.headwear !== "none" && (
                <Section title="Hat colour">
                  <Swatches field="headwearColor" colors={HEADWEAR_COLORS} />
                </Section>
              )}
              <Section title="Glasses">
                <OptionGrid field="glasses" options={GLASSES_STYLES} />
              </Section>
            </>
          )}

          {tab === "backdrop" && (
            <Section title="Background colour">
              <OptionGrid
                field="backdrop"
                options={BACKDROPS.map((b) => b.id)}
                labelFor={(id) => {
                  const b = BACKDROPS.find((x) => x.id === id);
                  return b ? b.label : String(id);
                }}
              />
            </Section>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
