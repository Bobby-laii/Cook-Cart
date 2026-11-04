"use client";

import React, { useId } from "react";
import {
  BACKDROPS,
  ChefAvatarConfig,
  DEFAULT_CHEF_AVATAR,
  luminance,
  parseChefAvatarConfig,
  shade,
} from "@/lib/avatar/chefAvatar";

/**
 * Layered SVG chef avatar in a "soft flat" style.
 *
 * Style rules:
 *   - no outlines on shapes: every region is a flat fill, separated from its neighbours by colour;
 *   - at most one slightly darker tone of a colour for depth (neck shadow, hat band, pocket);
 *   - the backdrop is a plain full circle in a soft, muted colour, no rim;
 *   - facial features are small and simple (dot / soft-arc eyes, thin rounded mouth, soft blush),
 *     drawn in a dark tone derived from the hair or a warm dark brown.
 *
 * Every part shares one coordinate system (viewBox 0 0 300 300, head centred at x=150,
 * eyes on y=150), so any hair / outfit / hat combination lines up without per-combination
 * tweaks. Parts that must hug the face (buzz cut, stubble, beard) are clipped to the head shape.
 *
 * Paint order (bottom → top):
 *   backdrop → neck → outfit → neckerchief → back hair → ears → head
 *   → blush → facial hair → mouth → mustache → eyes → brows → glasses
 *   → front hair → headwear
 */

const WARM_DARK = "#3b2a20";
const DEEP_DARK = "#150e0b";
const BLUSH = "#e2806c";
const CREAM = "#f7f2ea";
/** Feature line width (eyes, mouth). */
const FL = 5.5;

/** Mixes two #rrggbb colours (t = 0 → a, t = 1 → b). */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t));
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** The one darker tone allowed for depth. */
const deeper = (color: string, amount = 0.1) => shade(color, -amount);

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.5523;
  const f = (n: number) => Math.round(n * 10) / 10;
  return [
    `M${cx - rx} ${cy}`,
    `C${cx - rx} ${f(cy - k * ry)} ${f(cx - k * rx)} ${cy - ry} ${cx} ${cy - ry}`,
    `C${f(cx + k * rx)} ${cy - ry} ${cx + rx} ${f(cy - k * ry)} ${cx + rx} ${cy}`,
    `C${cx + rx} ${f(cy + k * ry)} ${f(cx + k * rx)} ${cy + ry} ${cx} ${cy + ry}`,
    `C${f(cx - k * rx)} ${cy + ry} ${cx - rx} ${f(cy + k * ry)} ${cx - rx} ${cy} Z`,
  ].join(" ");
}

/** Head outline + half-width at ear height, per face shape. */
const HEADS: Record<ChefAvatarConfig["faceShape"], { d: string; earX: number }> = {
  oval: { d: ellipsePath(150, 147, 62, 69), earX: 61 },
  round: { d: ellipsePath(150, 146, 68, 65), earX: 66 },
  square: {
    d: "M86 128 C86 96 108 79 150 79 C192 79 214 96 214 128 L214 168 C214 198 190 212 150 212 C110 212 86 198 86 168 Z",
    earX: 63,
  },
  heart: {
    d: "M88 136 C88 98 112 79 150 79 C188 79 212 98 212 136 C212 170 192 196 170 208 C162 213 156 216 150 216 C144 216 138 213 130 208 C108 196 88 170 88 136 Z",
    earX: 60,
  },
};

const TORSO = "M52 300 C56 254 92 228 128 222 Q150 232 172 222 C208 228 244 254 248 300 Z";
/** Lower-face region (clipped to the head) used by beard and stubble. */
const JAW = "M50 138 L92 138 C96 166 118 172 150 172 C182 172 204 166 208 138 L250 138 L250 260 L50 260 Z";
/** Rounded corners on small flat shapes without adding an outline: stroke in the fill colour. */
const soft = (fill: string, w = 5) => ({ fill, stroke: fill, strokeWidth: w, strokeLinejoin: "round" as const });

interface Tones {
  feature: string;
  brow: string;
}

function tonesFor(c: ChefAvatarConfig): Tones {
  const feature =
    luminance(c.skinTone) < 110 ? DEEP_DARK : luminance(c.hairColor) < 60 ? mix(c.hairColor, WARM_DARK, 0.5) : WARM_DARK;
  const brow = luminance(c.hairColor) > 170 ? mix(c.hairColor, feature, 0.55) : mix(c.hairColor, feature, 0.2);
  return { feature, brow };
}

const line = (color: string, w = FL) => ({
  stroke: color,
  strokeWidth: w,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

function Outfit({ c }: { c: ChefAvatarConfig }) {
  const fabric = c.outfitColor;
  const fold = deeper(fabric, 0.07);

  switch (c.outfit) {
    case "chefCoat":
      return (
        <g>
          <path d={TORSO} fill={fabric} />
          {/* double-breasted overlap, one tone darker */}
          <path d="M176 240 Q173 270 176 300 L182 300 Q179 270 182 240 Z" fill={fold} />
          {[260, 284].map((y) => (
            <g key={y} fill={c.accentColor}>
              <circle cx={133} cy={y} r={5.5} />
              <circle cx={163} cy={y} r={5.5} />
            </g>
          ))}
          {/* mandarin collar in the trim colour */}
          <path d="M124 222 Q150 238 176 222 L178 235 Q150 252 122 235 Z" {...soft(c.accentColor, 4)} />
        </g>
      );
    case "apron":
      return (
        <g>
          <path d={TORSO} fill={c.accentColor} />
          <g {...line(fabric, 7)}>
            <path d="M122 250 L133 227" />
            <path d="M178 250 L167 227" />
          </g>
          <path d="M112 250 Q112 244 118 244 L182 244 Q188 244 188 250 L194 300 L106 300 Z" fill={fabric} />
          <rect x={134} y={268} width={32} height={20} rx={7} fill={fold} />
        </g>
      );
    case "tee":
      return (
        <g>
          <path d={TORSO} fill={fabric} />
          {/* crew-neck rib */}
          <path d="M127 224 Q150 242 173 224" {...line(fold, 6)} />
          <rect x={164} y={254} width={26} height={24} rx={7} fill={c.accentColor} />
        </g>
      );
    case "kimono":
      return (
        <g>
          <path d={TORSO} fill={fabric} />
          {/* light under-layer in the V */}
          <path d="M127 223 L150 260 L173 223 Q150 234 127 223 Z" {...soft(luminance(fabric) > 235 ? deeper(CREAM, 0.04) : CREAM, 3)} />
          {/* left-over-right collar band */}
          <path d="M126 222 L188 300 L208 300 L142 219 Z" {...soft(c.accentColor, 3)} />
          <path d="M174 222 L157 252 L165 261 L190 229 Z" {...soft(c.accentColor, 3)} />
        </g>
      );
  }
}

function Neckerchief({ c }: { c: ChefAvatarConfig }) {
  return (
    <g>
      <path d="M128 224 Q150 240 172 224 L174 233 Q150 251 126 233 Z" {...soft(c.accentColor, 4)} />
      <path d="M141 244 L159 244 L150 266 Z" {...soft(c.accentColor, 6)} />
      <circle cx={150} cy={243} r={7.5} fill={deeper(c.accentColor, 0.1)} />
    </g>
  );
}

/** Hair volume behind the head, so no front-hair style can leave a gap at the temples. */
const HAIR_UNDER = "M80 150 C74 90 108 64 150 64 C192 64 226 90 220 150 Z";

function BackHair({ c }: { c: ChefAvatarConfig }) {
  const hair = c.hairColor;
  switch (c.hairStyle) {
    case "long":
      return (
        <path
          d="M78 140 C72 84 108 62 150 62 C192 62 228 84 222 140 L226 224 C226 240 206 244 192 236 L184 150 L116 150 L108 236 C94 244 74 240 74 224 Z"
          fill={hair}
        />
      );
    case "ponytail":
      return (
        <g fill={hair}>
          <path d={HAIR_UNDER} />
          <path d="M194 90 C238 88 250 144 238 186 C232 208 238 224 222 232 C212 206 222 170 206 128 Z" />
          <circle cx={203} cy={98} r={9} fill={deeper(hair, 0.18)} />
        </g>
      );
    case "bun":
      return (
        <g fill={hair}>
          <path d={HAIR_UNDER} />
          <circle cx={150} cy={58} r={24} />
        </g>
      );
    case "buzz":
    case "bald":
      return null;
    default:
      return <path d={HAIR_UNDER} fill={hair} />;
  }
}

function Eyes({ c, t }: { c: ChefAvatarConfig; t: Tones }) {
  const ink = t.feature;
  const dot = (x: number) => <circle key={`d${x}`} cx={x} cy={150} r={7} fill={ink} />;
  const upArc = (x: number) => <path key={`u${x}`} d={`M${x - 8} 153 Q${x} 142 ${x + 8} 153`} {...line(ink)} />;

  switch (c.eyes) {
    case "friendly":
      return <g>{[dot(126), dot(174)]}</g>;
    case "happy":
      return <g>{[upArc(126), upArc(174)]}</g>;
    case "wink":
      return <g>{[dot(126), upArc(174)]}</g>;
    case "calm":
      return (
        <g>
          {[126, 174].map((x) => (
            <path key={x} d={`M${x - 8} 148 Q${x} 156 ${x + 8} 148`} {...line(ink)} />
          ))}
        </g>
      );
    case "focused":
      // half-lidded: a small half-disc
      return (
        <g>
          {[126, 174].map((x) => (
            <path key={x} d={`M${x - 7.5} 147 L${x + 7.5} 147 A7.5 7.5 0 0 1 ${x - 7.5} 147 Z`} {...soft(ink, 2)} />
          ))}
        </g>
      );
  }
}

function Brows({ c, t }: { c: ChefAvatarConfig; t: Tones }) {
  switch (c.brows) {
    case "soft":
      return (
        <g {...line(t.brow, 5)}>
          <path d="M116 130 Q126 125 136 129" />
          <path d="M164 129 Q174 125 184 130" />
        </g>
      );
    case "bold":
      return (
        <g {...line(t.brow, 8.5)}>
          <path d="M117 131 L136 127" />
          <path d="M164 127 L183 131" />
        </g>
      );
    case "arched":
      return (
        <g {...line(t.brow, 4.5)}>
          <path d="M115 133 Q123 120 137 126" />
          <path d="M163 126 Q177 120 185 133" />
        </g>
      );
  }
}

function Mouth({ c, t }: { c: ChefAvatarConfig; t: Tones }) {
  switch (c.mouth) {
    case "smile":
      return <path d="M135 178 Q150 191 165 178" {...line(t.feature)} />;
    case "grin":
      return (
        <g>
          <path d="M133 176 L167 176 Q166 198 150 198 Q134 198 133 176 Z" {...soft(t.feature, 3)} />
          <ellipse cx={150} cy={192} rx={8} ry={4.5} fill={mix(BLUSH, t.feature, 0.15)} />
        </g>
      );
    case "smirk":
      return <path d="M138 183 Q155 187 165 175" {...line(t.feature)} />;
    case "calm":
      return <path d="M141 182 Q150 185.5 159 182" {...line(t.feature)} />;
  }
}

function LowerFacialHair({ c, headClip, beardClip }: { c: ChefAvatarConfig; headClip: string; beardClip: string }) {
  switch (c.facialHair) {
    case "beard":
      return (
        <g>
          <path d={JAW} fill={c.hairColor} clipPath={`url(#${beardClip})`} />
          {/* skin around the mouth so the mouth stays readable */}
          <ellipse cx={150} cy={186} rx={18} ry={11} fill={c.skinTone} />
        </g>
      );
    case "stubble": {
      const tint = luminance(c.hairColor) > luminance(c.skinTone) ? deeper(c.skinTone, 0.1) : mix(c.skinTone, c.hairColor, 0.22);
      return <path d={JAW} fill={tint} clipPath={`url(#${headClip})`} />;
    }
    case "goatee":
      return <path d="M136 197 Q150 191 164 197 Q163 214 150 220 Q137 214 136 197 Z" fill={c.hairColor} />;
    default:
      return null;
  }
}

function Mustache({ c }: { c: ChefAvatarConfig }) {
  if (c.facialHair !== "mustache" && c.facialHair !== "beard") return null;
  return (
    <path
      d="M150 168 C141 161 124 162 118 172 C128 177 141 176 150 171 C159 176 172 177 182 172 C176 162 159 161 150 168 Z"
      fill={c.hairColor}
    />
  );
}

function Glasses({ c, t }: { c: ChefAvatarConfig; t: Tones }) {
  if (c.glasses === "none") return null;
  const ear = HEADS[c.faceShape].earX;
  return (
    <g {...line(t.feature, 4)}>
      {c.glasses === "round" ? (
        <>
          <circle cx={126} cy={150} r={15} fill="#ffffff" fillOpacity={0.3} />
          <circle cx={174} cy={150} r={15} fill="#ffffff" fillOpacity={0.3} />
          <path d="M141 148 Q150 143 159 148" />
        </>
      ) : (
        <>
          <rect x={110} y={138} width={32} height={24} rx={7} fill="#ffffff" fillOpacity={0.3} />
          <rect x={158} y={138} width={32} height={24} rx={7} fill="#ffffff" fillOpacity={0.3} />
          <path d="M142 146 L158 146" />
        </>
      )}
      <path d={`M${c.glasses === "round" ? 111 : 110} 146 L${150 - ear + 2} 143`} />
      <path d={`M${c.glasses === "round" ? 189 : 190} 146 L${150 + ear - 2} 143`} />
    </g>
  );
}

function FrontHair({ c, headClip }: { c: ChefAvatarConfig; headClip: string }) {
  const hair = c.hairColor;
  const depth = deeper(hair, 0.18);

  switch (c.hairStyle) {
    case "short":
      return (
        <path
          d="M80 142 C74 88 108 66 150 66 C192 66 226 88 220 142 C212 118 200 106 186 100 C164 110 132 108 112 98 C98 108 88 122 80 142 Z"
          fill={hair}
        />
      );
    case "sidePart":
      return (
        <g>
          <path
            d="M80 142 C72 88 108 62 152 62 C196 62 228 88 220 142 C212 126 200 114 184 108 C158 100 130 98 110 86 C100 102 88 120 80 142 Z"
            fill={hair}
          />
          {/* the parting, one tone darker */}
          <path d="M111 84 C114 76 118 70 124 65" {...line(depth, 4)} />
        </g>
      );
    case "curly": {
      const outer: [number, number][] = [
        [84, 124], [88, 100], [103, 80], [125, 67], [150, 63], [175, 67], [197, 80], [212, 100], [216, 124],
      ];
      const fringe: [number, number][] = [[118, 100], [150, 97], [182, 100]];
      return (
        <g fill={hair}>
          <path d="M80 138 C76 88 110 68 150 68 C190 68 224 88 220 138 C210 112 186 100 150 100 C114 100 90 112 80 138 Z" />
          {outer.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={16} />
          ))}
          {fringe.map(([x, y]) => (
            <circle key={`f${x}`} cx={x} cy={y} r={12} />
          ))}
        </g>
      );
    }
    case "bun":
      return (
        <g>
          <path d="M84 132 C80 88 112 68 150 68 C188 68 220 88 216 132 C206 106 182 94 150 94 C118 94 94 106 84 132 Z" fill={hair} />
          <rect x={138} y={74} width={24} height={9} rx={4.5} fill={depth} />
        </g>
      );
    case "long":
      return (
        <path
          d="M80 150 C72 88 108 64 150 64 C192 64 228 88 220 150 C212 120 196 98 158 92 Q150 100 142 92 C104 98 88 120 80 150 Z"
          fill={hair}
        />
      );
    case "ponytail":
      return (
        <path
          d="M82 140 C76 88 108 66 150 66 C192 66 224 88 218 140 C212 112 196 96 170 92 C146 98 118 100 100 96 C90 108 84 124 82 140 Z"
          fill={hair}
        />
      );
    case "buzz":
      return (
        <path
          d="M50 50 L250 50 L250 120 C214 100 186 94 150 94 C114 94 86 100 50 120 Z"
          fill={mix(hair, c.skinTone, 0.3)}
          clipPath={`url(#${headClip})`}
        />
      );
    case "bald":
      return null;
  }
}

function Headwear({ c }: { c: ChefAvatarConfig }) {
  const cloth = c.headwearColor;
  const depth = deeper(cloth, 0.08);

  switch (c.headwear) {
    case "none":
      return null;
    case "toque":
      return (
        <g>
          <g fill={cloth}>
            <circle cx={116} cy={54} r={26} />
            <circle cx={150} cy={40} r={30} />
            <circle cx={184} cy={54} r={26} />
            <rect x={96} y={50} width={108} height={40} />
          </g>
          <rect x={88} y={82} width={124} height={30} rx={15} fill={depth} />
        </g>
      );
    case "bandana": {
      const dots: [number, number][] = [[112, 84], [134, 74], [158, 72], [182, 78], [146, 92], [196, 96], [104, 102]];
      return (
        <g>
          <path d="M208 104 Q232 102 242 118 Q228 124 214 116 Z" {...soft(cloth, 4)} />
          <path d="M208 108 Q228 124 226 142 Q212 134 206 116 Z" {...soft(cloth, 4)} />
          <path d="M84 118 C82 78 112 62 150 62 C188 62 218 78 216 118 C196 106 174 102 150 102 C126 102 104 106 84 118 Z" fill={cloth} />
          {dots.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={3.6} fill={depth} />
          ))}
          <circle cx={211} cy={108} r={9} fill={depth} />
        </g>
      );
    }
    case "cap":
      return (
        <g>
          <path d="M82 116 C80 72 112 60 150 60 C188 60 220 72 218 116 C198 106 174 102 150 102 C126 102 102 106 82 116 Z" fill={cloth} />
          <path d="M88 112 Q150 92 212 112 Q216 124 204 126 Q150 110 96 126 Q84 124 88 112 Z" fill={depth} />
          <circle cx={150} cy={63} r={6} fill={depth} />
        </g>
      );
    case "beret":
      return (
        <g transform="rotate(-10 150 80)">
          <rect x={144} y={44} width={9} height={16} rx={4} fill={cloth} />
          <ellipse cx={148} cy={84} rx={66} ry={20} fill={depth} />
          <ellipse cx={148} cy={76} rx={70} ry={24} fill={cloth} />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Public components                                                   */
/* ------------------------------------------------------------------ */

export interface ChefAvatarProps {
  config: ChefAvatarConfig;
  size?: number;
  className?: string;
  title?: string;
}

export function ChefAvatar({ config, size = 64, className, title }: ChefAvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = config;
  const backdrop = BACKDROPS.find((b) => b.id === c.backdrop) ?? BACKDROPS[0];
  const head = HEADS[c.faceShape];
  const t = tonesFor(c);
  const ids = { field: `field${uid}`, head: `head${uid}`, beard: `beard${uid}` };

  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? "Chef avatar"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={ids.field}>
          <circle cx={150} cy={150} r={150} />
        </clipPath>
        <clipPath id={ids.head}>
          <path d={head.d} />
        </clipPath>
        <clipPath id={ids.beard}>
          <path d={head.d} />
          <ellipse cx={150} cy={212} rx={42} ry={24} />
        </clipPath>
      </defs>

      {/* 1. backdrop */}
      <circle cx={150} cy={150} r={150} fill={backdrop.fill} />

      <g clipPath={`url(#${ids.field})`}>
        {/* 2. neck, with a darker band under the chin */}
        <path d="M132 188 L168 188 L168 232 Q150 240 132 232 Z" fill={c.skinTone} />
        <path d="M132 198 L168 198 L168 214 Q150 228 132 214 Z" fill={deeper(c.skinTone, 0.1)} />

        {/* 3. outfit */}
        <Outfit c={c} />
        {c.neckerchief && <Neckerchief c={c} />}

        {/* 4. hair behind the head */}
        <BackHair c={c} />

        {/* 5. ears + head */}
        {[150 - head.earX, 150 + head.earX].map((x) => (
          <ellipse key={x} cx={x} cy={154} rx={11} ry={15} fill={c.skinTone} />
        ))}
        <path d={head.d} fill={c.skinTone} />

        {/* 6. face */}
        {c.blush && (
          <g fill={mix(c.skinTone, BLUSH, 0.45)}>
            <circle cx={108} cy={172} r={11} />
            <circle cx={192} cy={172} r={11} />
          </g>
        )}
        <LowerFacialHair c={c} headClip={ids.head} beardClip={ids.beard} />
        <Mouth c={c} t={t} />
        <Mustache c={c} />
        <Eyes c={c} t={t} />
        <Brows c={c} t={t} />
        <Glasses c={c} t={t} />

        {/* 7. hair in front + headwear */}
        <FrontHair c={c} headClip={ids.head} />
        <Headwear c={c} />
      </g>
    </svg>
  );
}

/**
 * Drop-in avatar for anywhere a chef is shown. Renders the user's designed chef, or the
 * default soft-flat chef when they haven't designed one yet.
 */
export function ChefAvatarBadge({
  avatarConfig,
  size = 36,
  className = "",
  title,
}: {
  avatarConfig?: string | null;
  /** @deprecated Emoji avatars are gone; ignored. TODO remove once callers stop passing it. */
  emoji?: string | null;
  size?: number;
  className?: string;
  title?: string;
}) {
  const config = parseChefAvatarConfig(avatarConfig) ?? DEFAULT_CHEF_AVATAR;
  return <ChefAvatar config={config} size={size} title={title} className={`rounded-full flex-shrink-0 ${className}`} />;
}

export { DEFAULT_CHEF_AVATAR };
