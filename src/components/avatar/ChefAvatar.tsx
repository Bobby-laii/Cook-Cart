"use client";

import React, { useId } from "react";
import {
  BACKDROPS,
  ChefAvatarConfig,
  DEFAULT_CHEF_AVATAR,
  luminance,
  parseChefAvatarConfig,
} from "@/lib/avatar/chefAvatar";

/**
 * Layered SVG chef avatar, drawn as a flat enamel badge.
 *
 * Style rules (see DESIGN.md, "Enamelware"):
 *   - every coloured region is a flat fill with one navy (INK) outline of the same weight;
 *   - no gradients, no shine, no glossy highlights; at most one flat shadow tone (neck);
 *   - the backdrop is a solid enamel disc with a white rim and a navy edge.
 *
 * Every part shares one coordinate system (viewBox 0 0 300 300, head centred at x=150),
 * so any hair / outfit / hat combination lines up without per-combination tweaks.
 * The whole figure is scaled into the badge's inner disc by FIGURE_TRANSFORM.
 *
 * Paint order (bottom → top):
 *   badge → neck → outfit → neckerchief → back hair → ears → head
 *   → blush/nose → beard → mouth → mustache → eyes → brows → glasses
 *   → front hair → headwear → inner rim line
 */

const INK = "#12204A";
const WHITE = "#FFFFFF";
const TOMATO = "#D9553B";
/** Silhouette outline (in figure units, before the 0.94 scale). */
const OL = 7;
/** Feature lines: eyes, mouth, seams. */
const FL = 5;

/** Badge geometry. */
const FIELD_R = 131;
const RIM_R = 143;
/** Scales the figure by 0.94 around (150, 180) so the tallest hat still fits inside the field. */
const FIGURE_TRANSFORM = "translate(9 10.8) scale(0.94)";

/** Mixes two #rrggbb colours (t = 0 → a, t = 1 → b). Flat, so no gradients needed. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t));
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** Shared props for any outlined region. */
const outlined = { stroke: INK, strokeWidth: OL, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const line = (w = FL) => ({ stroke: INK, strokeWidth: w, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

const HEAD_PATHS: Record<ChefAvatarConfig["faceShape"], string> = {
  oval: "M98 128 C98 86 120 64 150 64 C180 64 202 86 202 128 C202 172 180 194 150 194 C120 194 98 172 98 128 Z",
  round: "M90 132 C90 88 116 66 150 66 C184 66 210 88 210 132 C210 170 186 190 150 190 C114 190 90 170 90 132 Z",
  square: "M94 110 C94 76 118 64 150 64 C182 64 206 76 206 110 L206 160 C206 182 188 192 150 193 C112 192 94 182 94 160 Z",
  heart:
    "M92 118 C92 80 118 64 150 64 C182 64 208 80 208 118 C208 150 190 174 170 186 C162 191 156 196 150 196 C144 196 138 191 130 186 C110 174 92 150 92 118 Z",
};

const TORSO = "M30 300 C34 256 70 232 118 224 Q150 236 182 224 C230 232 266 256 270 300 Z";
const BEARD =
  "M98 136 C98 184 124 206 150 206 C176 206 202 184 202 136 C198 160 186 172 172 176 C162 168 138 168 128 176 C114 172 102 160 98 136 Z";

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

function Outfit({ c }: { c: ChefAvatarConfig }) {
  const fabric = c.outfitColor;

  switch (c.outfit) {
    case "chefCoat":
      return (
        <g>
          <path d={TORSO} fill={fabric} {...outlined} />
          {/* double-breasted front edge */}
          <path d="M184 240 C182 260 182 282 182 300" {...line()} />
          {/* two rows of buttons */}
          {[258, 284].map((y) => (
            <g key={y} fill={c.accentColor} stroke={INK} strokeWidth={3.5}>
              <circle cx={128} cy={y} r={6} />
              <circle cx={166} cy={y} r={6} />
            </g>
          ))}
          {/* mandarin collar in the trim colour */}
          <path d="M116 222 Q150 238 184 222 L186 240 Q150 258 114 240 Z" fill={c.accentColor} {...outlined} />
        </g>
      );
    case "apron": {
      const shirt = c.accentColor;
      return (
        <g>
          <path d={TORSO} fill={shirt} {...outlined} />
          {/* neck straps: an ink stroke under a fabric stroke gives an outlined strap */}
          {[
            "M124 254 L136 226",
            "M176 254 L164 226",
          ].map((d) => (
            <g key={d}>
              <path d={d} stroke={INK} strokeWidth={14} strokeLinecap="round" />
              <path d={d} stroke={fabric} strokeWidth={6} strokeLinecap="round" />
            </g>
          ))}
          {/* bib */}
          <path d="M112 248 L188 248 L194 304 L106 304 Z" fill={fabric} {...outlined} />
          {/* kangaroo pocket */}
          <path d="M132 270 L168 270 L168 292 L132 292 Z" {...line(4)} />
          <path d="M150 270 L150 292" {...line(4)} />
        </g>
      );
    }
    case "tee":
      return (
        <g>
          <path d={TORSO} fill={fabric} {...outlined} />
          {/* sleeve seams */}
          <path d="M84 246 C90 264 92 282 92 300" {...line(4)} />
          <path d="M216 246 C210 264 208 282 208 300" {...line(4)} />
          {/* crew-neck rib */}
          <path d="M118 224 Q150 252 182 224" {...line(FL + 1)} />
          {/* chest pocket */}
          <path d="M166 258 L192 258 L192 282 Q179 288 166 282 Z" fill={c.accentColor} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      );
    case "kimono":
      return (
        <g>
          <path d={TORSO} fill={fabric} {...outlined} />
          {/* white under-layer in the V */}
          <path d="M122 222 L150 266 L178 222 Q150 238 122 222 Z" fill={WHITE} {...outlined} />
          {/* left-over-right collar band */}
          <path d="M122 222 L184 304 L206 304 L140 218 Z" fill={c.accentColor} {...outlined} />
          <path d="M178 222 L156 256 L166 266 L192 228 Z" fill={c.accentColor} {...outlined} />
        </g>
      );
  }
}

function Neckerchief({ c }: { c: ChefAvatarConfig }) {
  return (
    <g fill={c.accentColor} {...outlined} strokeWidth={5.5}>
      <path d="M144 242 L134 272 L150 262 L166 272 L156 242 Z" />
      <path d="M126 224 Q150 242 174 224 L176 234 Q150 250 124 234 Z" />
      <circle cx={150} cy={243} r={8} />
    </g>
  );
}

function BackHair({ c }: { c: ChefAvatarConfig }) {
  const hair = c.hairColor;
  if (c.hairStyle === "long") {
    return (
      <path
        d="M88 132 C82 72 114 46 150 46 C186 46 218 72 212 132 L220 226 Q202 240 184 228 L184 160 L116 160 L116 228 Q98 240 80 226 Z"
        fill={hair}
        {...outlined}
      />
    );
  }
  if (c.hairStyle === "ponytail") {
    return (
      <g>
        <path d="M194 92 C234 90 244 140 230 180 C222 202 230 216 214 226 C204 198 214 160 200 124 Z" fill={hair} {...outlined} />
        <rect x={190} y={88} width={18} height={14} rx={6} fill={TOMATO} {...outlined} strokeWidth={5} />
      </g>
    );
  }
  if (c.hairStyle === "bun") {
    return <circle cx={150} cy={46} r={22} fill={hair} {...outlined} />;
  }
  return null;
}

function Eyes({ c }: { c: ChefAvatarConfig }) {
  const dot = (x: number) => <ellipse key={`d${x}`} cx={x} cy={133} rx={7.5} ry={9} fill={INK} />;
  const upArc = (x: number) => <path key={`u${x}`} d={`M${x - 9} 136 Q${x} 124 ${x + 9} 136`} {...line(FL + 0.5)} />;

  switch (c.eyes) {
    case "friendly":
      return <g>{[dot(128), dot(172)]}</g>;
    case "happy":
      return <g>{[upArc(128), upArc(172)]}</g>;
    case "wink":
      return <g>{[dot(128), upArc(172)]}</g>;
    case "calm":
      return (
        <g>
          {[128, 172].map((x) => (
            <path key={x} d={`M${x - 9} 132 Q${x} 140 ${x + 9} 132`} {...line(FL + 0.5)} />
          ))}
        </g>
      );
    case "focused":
      return (
        <g>
          {[128, 172].map((x) => (
            <g key={x}>
              <path d={`M${x - 7} 132 L${x + 7} 132 Q${x + 7} 142 ${x} 142 Q${x - 7} 142 ${x - 7} 132 Z`} fill={INK} />
              <path d={`M${x - 10} 131 L${x + 10} 131`} {...line(FL)} />
            </g>
          ))}
        </g>
      );
  }
}

function Brows({ c }: { c: ChefAvatarConfig }) {
  const color = mix(c.hairColor, INK, luminance(c.hairColor) > 170 ? 0.55 : 0.3);
  switch (c.brows) {
    case "soft":
      return (
        <g stroke={color} strokeWidth={5} fill="none" strokeLinecap="round">
          <path d="M117 113 Q128 108 139 112" />
          <path d="M161 112 Q172 108 183 113" />
        </g>
      );
    case "bold":
      return (
        <g stroke={color} strokeWidth={9} fill="none" strokeLinecap="round">
          <path d="M118 114 L139 109" />
          <path d="M161 109 L182 114" />
        </g>
      );
    case "arched":
      return (
        <g stroke={color} strokeWidth={4.5} fill="none" strokeLinecap="round">
          <path d="M117 116 Q125 101 139 108" />
          <path d="M161 108 Q175 101 183 116" />
        </g>
      );
  }
}

function Mouth({ c }: { c: ChefAvatarConfig }) {
  switch (c.mouth) {
    case "smile":
      return <path d="M135 166 Q150 180 165 166" {...line()} />;
    case "grin":
      return (
        <g>
          <path d="M132 163 L168 163 Q166 188 150 188 Q134 188 132 163 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M136 165 L164 165 Q163 171 150 171 Q137 171 136 165 Z" fill={WHITE} />
          <path d="M141 181 Q150 174 159 181 Q155 185 150 185 Q145 185 141 181 Z" fill={TOMATO} />
        </g>
      );
    case "smirk":
      return <path d="M138 170 Q154 175 165 162" {...line()} />;
    case "calm":
      return <path d="M141 169 L159 169" {...line()} />;
  }
}

function LowerFacialHair({ c }: { c: ChefAvatarConfig }) {
  if (c.facialHair === "beard") return <path d={BEARD} fill={c.hairColor} {...outlined} />;
  if (c.facialHair === "stubble") {
    const tint = mix(c.skinTone, c.hairColor, 0.3);
    const dots: [number, number][] = [
      [118, 168], [128, 180], [140, 188], [160, 188], [172, 180], [182, 168], [150, 192], [124, 156], [176, 156],
    ];
    return (
      <g>
        <path d={BEARD} fill={tint} />
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.8} fill={mix(c.hairColor, INK, 0.3)} />
        ))}
      </g>
    );
  }
  if (c.facialHair === "goatee") {
    return <path d="M138 180 Q150 175 162 180 Q161 198 150 202 Q139 198 138 180 Z" fill={c.hairColor} {...outlined} strokeWidth={5} />;
  }
  return null;
}

function Mustache({ c }: { c: ChefAvatarConfig }) {
  if (c.facialHair !== "mustache" && c.facialHair !== "beard") return null;
  return (
    <path
      d="M150 155 C144 150 133 150 127 156 C123 160 118 160 116 156 C117 166 128 170 137 166 C142 164 147 162 150 161 C153 162 158 164 163 166 C172 170 183 166 184 156 C182 160 177 160 173 156 C167 150 156 150 150 155 Z"
      fill={c.hairColor}
      {...outlined}
      strokeWidth={4.5}
    />
  );
}

function Glasses({ c }: { c: ChefAvatarConfig }) {
  if (c.glasses === "none") return null;
  return (
    <g stroke={INK} strokeWidth={4.5} fill={WHITE} fillOpacity={0.28} strokeLinecap="round" strokeLinejoin="round">
      {c.glasses === "round" ? (
        <>
          <circle cx={128} cy={133} r={14} />
          <circle cx={172} cy={133} r={14} />
          <path d="M142 131 Q150 125 158 131" fill="none" />
        </>
      ) : (
        <>
          <rect x={112} y={121} width={32} height={24} rx={4} />
          <rect x={156} y={121} width={32} height={24} rx={4} />
          <path d="M144 129 L156 129" fill="none" />
        </>
      )}
      <path d="M113 129 L98 126" fill="none" />
      <path d="M187 129 L202 126" fill="none" />
    </g>
  );
}

function FrontHair({ c }: { c: ChefAvatarConfig }) {
  const hair = c.hairColor;

  switch (c.hairStyle) {
    case "short":
      return (
        <path
          d="M94 124 C88 74 118 52 152 54 C188 56 212 80 206 124 C202 106 196 96 186 90 C168 100 136 98 116 88 C106 96 98 108 94 124 Z"
          fill={hair}
          {...outlined}
        />
      );
    case "sidePart":
      return (
        <g>
          <path
            d="M94 126 C86 74 116 50 154 52 C192 54 214 80 206 126 C202 102 194 90 182 84 C152 94 120 94 104 80 C98 94 95 110 94 126 Z"
            fill={hair}
            {...outlined}
          />
          {/* the parting */}
          <path d="M120 58 C114 68 109 75 104 80" {...line(4.5)} />
          <path d="M132 66 Q160 70 186 82" {...line(4)} />
        </g>
      );
    case "curly": {
      const outer: [number, number][] = [
        [96, 114], [100, 92], [114, 74], [132, 62], [152, 58], [172, 62], [188, 74], [200, 92], [204, 114],
      ];
      const fringe: [number, number][] = [[126, 92], [150, 90], [174, 92]];
      return (
        <g fill={hair} {...outlined}>
          <path d="M92 124 C88 74 118 56 150 56 C182 56 212 74 208 124 C200 104 184 94 150 94 C116 94 100 104 92 124 Z" />
          {outer.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={15} />
          ))}
          {fringe.map(([x, y]) => (
            <circle key={`f${x}`} cx={x} cy={y} r={11} />
          ))}
        </g>
      );
    }
    case "bun":
      return (
        <g>
          <path d="M96 120 C92 76 120 58 150 58 C180 58 208 76 204 120 C196 98 176 86 150 86 C124 86 104 98 96 120 Z" fill={hair} {...outlined} />
          <rect x={136} y={58} width={28} height={10} rx={5} fill={TOMATO} {...outlined} strokeWidth={5} />
        </g>
      );
    case "long":
      return (
        <path
          d="M94 132 C88 74 118 52 150 52 C182 52 212 74 206 132 C200 106 184 88 158 82 C158 92 150 98 144 84 C122 90 102 106 94 132 Z"
          fill={hair}
          {...outlined}
        />
      );
    case "ponytail":
      return (
        <path
          d="M96 122 C92 76 120 56 150 56 C180 56 208 76 204 122 C198 100 182 86 160 82 C140 90 116 92 104 84 C100 96 97 108 96 122 Z"
          fill={hair}
          {...outlined}
        />
      );
    case "buzz":
      return (
        <path
          d="M98 112 C98 74 122 62 150 62 C178 62 202 74 202 112 C196 92 176 84 150 84 C124 84 104 92 98 112 Z"
          fill={mix(hair, c.skinTone, 0.25)}
          {...outlined}
          strokeWidth={FL}
        />
      );
    case "bald":
      return null;
  }
}

function Headwear({ c }: { c: ChefAvatarConfig }) {
  const cloth = c.headwearColor;
  const darker = mix(cloth, INK, 0.22);

  switch (c.headwear) {
    case "none":
      return null;
    case "toque":
      return (
        <g>
          <path
            d="M104 84 C82 80 80 50 106 48 C110 26 140 18 158 34 C176 18 212 28 206 54 C226 60 224 84 196 84 Z"
            fill={cloth}
            {...outlined}
          />
          <path d="M130 52 C132 62 130 70 127 78" {...line(4.5)} />
          <path d="M172 52 C170 62 172 70 175 78" {...line(4.5)} />
          <rect x={98} y={72} width={104} height={28} rx={8} fill={cloth} {...outlined} />
          {[124, 150, 176].map((x) => (
            <path key={x} d={`M${x} 77 L${x} 95`} {...line(4)} />
          ))}
        </g>
      );
    case "bandana": {
      const dots: [number, number][] = [[118, 80], [138, 70], [162, 70], [182, 80], [150, 82]];
      const dot = luminance(cloth) > 200 ? TOMATO : WHITE;
      return (
        <g>
          <path d="M206 98 L236 106 L226 122 Z" fill={cloth} {...outlined} strokeWidth={5.5} />
          <path d="M206 102 L230 130 L214 134 Z" fill={cloth} {...outlined} strokeWidth={5.5} />
          <path
            d="M92 106 C92 70 118 56 150 56 C182 56 208 70 208 106 C190 96 170 92 150 92 C130 92 110 96 92 106 Z"
            fill={cloth}
            {...outlined}
          />
          {dots.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={3.6} fill={dot} />
          ))}
          <circle cx={207} cy={101} r={7} fill={cloth} {...outlined} strokeWidth={5} />
        </g>
      );
    }
    case "cap":
      return (
        <g>
          <path
            d="M90 104 C88 64 118 50 152 50 C188 50 212 66 210 104 C190 94 170 92 150 92 C130 92 110 94 90 104 Z"
            fill={cloth}
            {...outlined}
          />
          <path d="M96 102 Q150 84 204 102 Q208 114 198 116 Q150 102 102 116 Q92 114 96 102 Z" fill={darker} {...outlined} />
          <circle cx={152} cy={52} r={5} fill={darker} {...outlined} strokeWidth={4} />
        </g>
      );
    case "beret":
      return (
        <g transform="rotate(-10 150 72)">
          <rect x={144} y={38} width={9} height={14} rx={3} fill={cloth} {...outlined} strokeWidth={5} />
          <ellipse cx={148} cy={70} rx={66} ry={23} fill={cloth} {...outlined} />
          <path d="M100 84 Q150 98 198 84" {...line(4.5)} />
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
  const skinShadow = mix(c.skinTone, INK, 0.2);

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
        <clipPath id={`field${uid}`}>
          <circle cx={150} cy={150} r={FIELD_R} />
        </clipPath>
      </defs>

      {/* 1. badge: navy edge, white rim, enamel field */}
      <circle cx={150} cy={150} r={150} fill={INK} />
      <circle cx={150} cy={150} r={RIM_R} fill={WHITE} />
      <circle cx={150} cy={150} r={FIELD_R} fill={backdrop.fill} />

      <g clipPath={`url(#field${uid})`}>
        <g transform={FIGURE_TRANSFORM}>
          {/* 2. neck */}
          <path d="M128 166 L128 228 Q150 242 172 228 L172 166 Z" fill={c.skinTone} {...outlined} />
          <path d="M131.5 184 Q150 206 168.5 184 L168.5 200 Q150 216 131.5 200 Z" fill={skinShadow} />

          {/* 3. outfit */}
          <Outfit c={c} />
          {c.neckerchief && <Neckerchief c={c} />}

          {/* 4. hair behind the head */}
          <BackHair c={c} />

          {/* 5. ears + head */}
          {[96, 204].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={136} rx={12} ry={15} fill={c.skinTone} {...outlined} />
              <path d={x < 150 ? `M${x + 2} 130 Q${x - 4} 136 ${x + 2} 142` : `M${x - 2} 130 Q${x + 4} 136 ${x - 2} 142`} {...line(3.5)} />
            </g>
          ))}
          <path d={HEAD_PATHS[c.faceShape]} fill={c.skinTone} {...outlined} />

          {/* 6. face */}
          {c.blush && (
            <g fill={mix(c.skinTone, TOMATO, 0.45)}>
              <ellipse cx={116} cy={159} rx={11} ry={7} />
              <ellipse cx={184} cy={159} rx={11} ry={7} />
            </g>
          )}
          <path d="M150 140 C145 150 145 155 153 156" {...line(4)} stroke={mix(c.skinTone, INK, 0.45)} />
          <LowerFacialHair c={c} />
          <Mouth c={c} />
          <Mustache c={c} />
          <Eyes c={c} />
          <Brows c={c} />
          <Glasses c={c} />

          {/* 7. hair in front + headwear */}
          <FrontHair c={c} />
          <Headwear c={c} />
        </g>
      </g>

      {/* 8. inner rim line keeps the figure inside the badge */}
      <circle cx={150} cy={150} r={FIELD_R} fill="none" stroke={INK} strokeWidth={6} />
    </svg>
  );
}

/**
 * Drop-in avatar for anywhere a chef is shown. Renders the custom SVG when the user
 * has designed one, otherwise falls back to the legacy emoji avatar.
 */
export function ChefAvatarBadge({
  avatarConfig,
  emoji,
  size = 36,
  className = "",
  title,
}: {
  avatarConfig?: string | null;
  emoji?: string | null;
  size?: number;
  className?: string;
  title?: string;
}) {
  const config = parseChefAvatarConfig(avatarConfig);
  if (config) {
    return <ChefAvatar config={config} size={size} title={title} className={`rounded-full flex-shrink-0 ${className}`} />;
  }
  return (
    <span
      className={`rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      title={title}
    >
      {emoji || "🧑‍🍳"}
    </span>
  );
}

export { DEFAULT_CHEF_AVATAR };
