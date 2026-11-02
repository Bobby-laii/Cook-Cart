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
 * Layered SVG chef avatar (upper-body bust).
 *
 * Every part shares one coordinate system (viewBox 0 0 300 300, head centred at x=150),
 * so any hair / outfit / hat combination lines up without per-combination tweaks.
 *
 * Paint order (bottom → top):
 *   backdrop → neck → outfit → neckerchief → back hair → ears → head
 *   → blush/nose → beard → mouth → mustache → eyes → brows → glasses
 *   → front hair → headwear
 */

const INK = "#2a1d17";

const HEAD_PATHS: Record<ChefAvatarConfig["faceShape"], string> = {
  oval: "M96 128 C96 84 120 64 150 64 C180 64 204 84 204 128 C204 170 180 192 150 192 C120 192 96 170 96 128 Z",
  round: "M92 130 C92 88 116 66 150 66 C184 66 208 88 208 130 C208 168 184 190 150 190 C116 190 92 168 92 130 Z",
  square: "M96 112 C96 78 118 64 150 64 C182 64 204 78 204 112 L204 158 C204 180 186 192 150 193 C114 192 96 180 96 158 Z",
  heart:
    "M94 120 C94 82 118 64 150 64 C182 64 206 82 206 120 C206 152 188 174 168 186 C160 191 155 194 150 194 C145 194 140 191 132 186 C112 174 94 152 94 120 Z",
};

const TORSO = "M30 300 C34 256 70 232 118 224 Q150 236 182 224 C230 232 266 256 270 300 Z";
const BEARD = "M98 138 C98 182 124 202 150 202 C176 202 202 182 202 138 C198 160 186 172 172 176 C162 168 138 168 128 176 C114 172 102 160 98 138 Z";

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

function Outfit({ c }: { c: ChefAvatarConfig }) {
  const fabric = c.outfitColor;
  const line = luminance(fabric) > 200 ? "#d6d3d1" : shade(fabric, -0.3);

  switch (c.outfit) {
    case "chefCoat": {
      const button = luminance(fabric) > 180 ? "#44403c" : shade(fabric, 0.55);
      return (
        <g>
          <path d={TORSO} fill={fabric} stroke={line} strokeWidth={2} />
          {/* sleeve seams */}
          <path d="M86 246 C92 264 94 282 94 300" stroke={line} strokeWidth={2} fill="none" opacity={0.7} />
          <path d="M214 246 C208 264 206 282 206 300" stroke={line} strokeWidth={2} fill="none" opacity={0.7} />
          {/* double-breasted front flap with piping */}
          <path d="M184 238 C182 258 182 280 182 300" stroke={c.accentColor} strokeWidth={3.5} fill="none" />
          {/* two rows of buttons */}
          {[256, 282].map((y) => (
            <g key={y}>
              <circle cx={128} cy={y} r={4.5} fill={button} />
              <circle cx={166} cy={y} r={4.5} fill={button} />
            </g>
          ))}
          {/* sleeve pen pocket */}
          <rect x={70} y={258} width={5} height={16} rx={2} fill={c.accentColor} transform="rotate(-18 72 266)" />
          {/* mandarin collar with piping */}
          <path d="M118 222 Q150 236 182 222 L184 238 Q150 254 116 238 Z" fill={fabric} stroke={c.accentColor} strokeWidth={3} strokeLinejoin="round" />
        </g>
      );
    }
    case "apron": {
      const shirt = c.accentColor;
      const shirtLine = luminance(shirt) > 200 ? "#d6d3d1" : shade(shirt, -0.3);
      const stripe = luminance(fabric) > 140 ? "#000000" : "#ffffff";
      return (
        <g>
          <path d={TORSO} fill={shirt} stroke={shirtLine} strokeWidth={2} />
          <path d="M118 224 Q150 244 182 224" stroke={shirtLine} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* neck straps */}
          <path d="M124 252 L134 226" stroke={fabric} strokeWidth={7} strokeLinecap="round" />
          <path d="M176 252 L166 226" stroke={fabric} strokeWidth={7} strokeLinecap="round" />
          {/* bib */}
          <path d="M114 248 L186 248 L192 300 L108 300 Z" fill={fabric} stroke={line} strokeWidth={2} strokeLinejoin="round" />
          {[130, 150, 170].map((x) => (
            <line key={x} x1={x} y1={250} x2={x} y2={300} stroke={stripe} strokeWidth={3} opacity={0.18} />
          ))}
          <rect x={134} y={268} width={32} height={20} rx={3} fill="none" stroke={line} strokeWidth={2} />
        </g>
      );
    }
    case "tee":
      return (
        <g>
          <path d={TORSO} fill={fabric} stroke={line} strokeWidth={2} />
          <path d="M84 244 C90 262 92 282 92 300" stroke={line} strokeWidth={2} fill="none" opacity={0.6} />
          <path d="M216 244 C210 262 208 282 208 300" stroke={line} strokeWidth={2} fill="none" opacity={0.6} />
          <path d="M120 224 Q150 248 180 224" stroke={shade(fabric, luminance(fabric) > 200 ? -0.15 : -0.3)} strokeWidth={6} fill="none" strokeLinecap="round" />
          <rect x={168} y={256} width={22} height={20} rx={3} fill={c.accentColor} opacity={0.95} />
        </g>
      );
    case "kimono":
      return (
        <g>
          <path d={TORSO} fill={fabric} stroke={line} strokeWidth={2} />
          {/* inner layer visible in the V */}
          <path d="M124 222 L150 262 L176 222 Q150 238 124 222 Z" fill="#f5f5f4" />
          {/* left-over-right collar bands */}
          <path d="M172 222 L148 260 L158 270 L188 226 Z" fill={shade(c.accentColor, -0.15)} />
          <path d="M124 222 L178 300 L198 300 L140 220 Z" fill={c.accentColor} />
        </g>
      );
  }
}

function Neckerchief({ c }: { c: ChefAvatarConfig }) {
  const dark = shade(c.accentColor, -0.25);
  return (
    <g>
      <path d="M128 222 Q150 238 172 222 L174 230 Q150 246 126 230 Z" fill={c.accentColor} stroke={dark} strokeWidth={1.5} />
      <path d="M144 242 L136 268 L150 260 L164 268 L156 242 Z" fill={c.accentColor} stroke={dark} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M140 232 Q150 238 160 232 L157 244 Q150 247 143 244 Z" fill={dark} />
    </g>
  );
}

function BackHair({ c }: { c: ChefAvatarConfig }) {
  if (c.hairStyle === "long") {
    return (
      <path
        d="M88 132 C82 72 114 46 150 46 C186 46 218 72 212 132 L218 226 Q202 238 184 228 L184 160 L116 160 L116 228 Q98 238 82 226 Z"
        fill={shade(c.hairColor, -0.08)}
      />
    );
  }
  if (c.hairStyle === "ponytail") {
    return (
      <g>
        <path d="M196 92 C232 92 240 140 226 178 C218 200 228 214 214 222 C206 196 214 160 202 124 Z" fill={shade(c.hairColor, -0.08)} />
        <circle cx={201} cy={98} r={6} fill={shade(c.hairColor, -0.35)} />
      </g>
    );
  }
  if (c.hairStyle === "bun") {
    return (
      <g>
        <circle cx={150} cy={44} r={20} fill={c.hairColor} />
        <path d="M140 38 Q150 30 160 38" stroke={shade(c.hairColor, 0.3)} strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

function Eyes({ c }: { c: ChefAvatarConfig }) {
  const open = (x: number) => (
    <g key={`o${x}`}>
      <ellipse cx={x} cy={132} rx={6.5} ry={8} fill={INK} />
      <circle cx={x + 2.2} cy={129} r={2.2} fill="#ffffff" />
    </g>
  );
  const arc = (x: number) => (
    <path key={`a${x}`} d={`M${x - 8} 134 Q${x} 124 ${x + 8} 134`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
  );

  switch (c.eyes) {
    case "friendly":
      return <g>{[open(128), open(172)]}</g>;
    case "happy":
      return <g>{[arc(128), arc(172)]}</g>;
    case "wink":
      return <g>{[open(128), arc(172)]}</g>;
    case "calm":
      return (
        <g>
          {[128, 172].map((x) => (
            <path key={x} d={`M${x - 8} 132 Q${x} 138 ${x + 8} 132`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          ))}
        </g>
      );
    case "focused":
      return (
        <g>
          <ellipse cx={128} cy={133} rx={6.5} ry={6} fill={INK} />
          <ellipse cx={172} cy={133} rx={6.5} ry={6} fill={INK} />
          <circle cx={130} cy={131} r={1.8} fill="#ffffff" />
          <circle cx={174} cy={131} r={1.8} fill="#ffffff" />
          <path d="M119 127 L137 129" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <path d="M163 129 L181 127" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
  }
}

function Brows({ c }: { c: ChefAvatarConfig }) {
  const color = luminance(c.hairColor) > 200 ? shade(c.hairColor, -0.4) : c.hairColor;
  switch (c.brows) {
    case "soft":
      return (
        <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round">
          <path d="M118 113 Q128 108 138 112" />
          <path d="M162 112 Q172 108 182 113" />
        </g>
      );
    case "bold":
      return (
        <g fill={color}>
          <path d="M116 114 Q128 104 140 110 L139 115 Q128 111 117 118 Z" />
          <path d="M184 114 Q172 104 160 110 L161 115 Q172 111 183 118 Z" />
        </g>
      );
    case "arched":
      return (
        <g stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d="M118 115 Q126 103 138 110" />
          <path d="M162 110 Q174 103 182 115" />
        </g>
      );
  }
}

function Mouth({ c }: { c: ChefAvatarConfig }) {
  const lip = "#4a2420";
  switch (c.mouth) {
    case "smile":
      return <path d="M136 166 Q150 178 164 166" stroke={lip} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    case "grin":
      return (
        <g>
          <path d="M134 164 Q150 188 166 164 Z" fill="#5b2121" strokeLinejoin="round" />
          <path d="M137 164 L163 164 Q162 169 150 170 Q138 169 137 164 Z" fill="#ffffff" />
          <path d="M142 173 Q150 168 158 173 Q150 177 142 173 Z" fill="#e8737a" />
        </g>
      );
    case "smirk":
      return <path d="M138 169 Q152 174 164 162" stroke={lip} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    case "calm":
      return <path d="M142 168 Q150 172 158 168" stroke={lip} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  }
}

function LowerFacialHair({ c }: { c: ChefAvatarConfig }) {
  if (c.facialHair === "beard") return <path d={BEARD} fill={c.hairColor} />;
  if (c.facialHair === "stubble") return <path d={BEARD} fill={c.hairColor} opacity={0.22} />;
  if (c.facialHair === "goatee") return <path d="M138 178 Q150 174 162 178 Q160 194 150 197 Q140 194 138 178 Z" fill={c.hairColor} />;
  return null;
}

function Mustache({ c }: { c: ChefAvatarConfig }) {
  if (c.facialHair !== "mustache" && c.facialHair !== "beard") return null;
  return (
    <path
      d="M150 156 C144 151 134 151 128 157 C124 161 119 161 117 157 C118 166 128 169 137 165 C142 163 147 161 150 160 C153 161 158 163 163 165 C172 169 182 166 183 157 C181 161 176 161 172 157 C166 151 156 151 150 156 Z"
      fill={c.facialHair === "beard" ? shade(c.hairColor, -0.1) : c.hairColor}
    />
  );
}

function Glasses({ c }: { c: ChefAvatarConfig }) {
  if (c.glasses === "none") return null;
  const frame = "#292524";
  return (
    <g stroke={frame} strokeWidth={3} fill="#ffffff" fillOpacity={0.15} strokeLinecap="round">
      {c.glasses === "round" ? (
        <>
          <circle cx={128} cy={132} r={13} />
          <circle cx={172} cy={132} r={13} />
          <path d="M141 131 Q150 126 159 131" fill="none" />
        </>
      ) : (
        <>
          <rect x={114} y={121} width={28} height={22} rx={5} />
          <rect x={158} y={121} width={28} height={22} rx={5} />
          <path d="M142 129 Q150 125 158 129" fill="none" />
        </>
      )}
      <path d="M115 129 L98 126" fill="none" />
      <path d="M185 129 L202 126" fill="none" />
    </g>
  );
}

function FrontHair({ c }: { c: ChefAvatarConfig }) {
  const hair = c.hairColor;
  const shine = shade(hair, 0.3);
  const dark = shade(hair, -0.3);

  switch (c.hairStyle) {
    case "short":
      return (
        <g>
          <path d="M94 124 C88 74 118 52 152 54 C188 56 212 80 206 124 C202 106 196 96 186 90 C168 100 136 98 116 88 C106 96 98 108 94 124 Z" fill={hair} />
          <path d="M128 66 Q150 60 172 66" stroke={shine} strokeWidth={4} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      );
    case "sidePart":
      return (
        <g>
          <path d="M94 126 C86 74 116 50 154 52 C192 54 214 80 206 126 C202 102 194 90 182 84 C152 92 120 94 104 80 C98 94 95 110 94 126 Z" fill={hair} />
          <path d="M118 58 C112 68 108 75 104 80" stroke={dark} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M140 62 Q168 58 190 72" stroke={shine} strokeWidth={4} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      );
    case "curly": {
      const outer: [number, number][] = [
        [96, 112], [100, 90], [114, 72], [132, 60], [152, 56], [172, 60], [188, 72], [200, 90], [204, 112],
      ];
      const fringe: [number, number][] = [[124, 92], [150, 90], [176, 92]];
      return (
        <g fill={hair}>
          <path d="M92 124 C88 74 118 56 150 56 C182 56 212 74 208 124 C200 104 184 92 150 92 C116 92 100 104 92 124 Z" />
          {outer.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={15} />)}
          {fringe.map(([x, y]) => <circle key={`f${x}`} cx={x} cy={y} r={10} />)}
          {outer.slice(2, 7).map(([x, y]) => (
            <path key={`s${x}`} d={`M${x - 6} ${y - 4} Q${x} ${y - 9} ${x + 6} ${y - 4}`} stroke={shine} strokeWidth={2.5} fill="none" opacity={0.5} strokeLinecap="round" />
          ))}
        </g>
      );
    }
    case "bun":
      return (
        <g>
          <path d="M96 120 C92 76 120 58 150 58 C180 58 208 76 204 120 C196 98 176 86 150 86 C124 86 104 98 96 120 Z" fill={hair} />
          <rect x={138} y={58} width={24} height={7} rx={3.5} fill={dark} />
        </g>
      );
    case "long":
      return (
        <g>
          <path d="M94 132 C88 74 118 52 150 52 C182 52 212 74 206 132 C200 106 184 88 158 82 C158 92 150 98 144 84 C122 90 102 106 94 132 Z" fill={hair} />
          <path d="M126 64 Q150 56 176 66" stroke={shine} strokeWidth={4} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <path d="M96 122 C92 76 120 56 150 56 C180 56 208 76 204 122 C198 100 182 86 160 82 C140 90 116 92 104 84 C100 96 97 108 96 122 Z" fill={hair} />
          <path d="M128 66 Q152 60 176 68" stroke={shine} strokeWidth={4} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      );
    case "buzz":
      return <path d="M96 116 C96 72 122 60 150 60 C178 60 204 72 204 116 C198 92 178 82 150 82 C122 82 102 92 96 116 Z" fill={hair} opacity={0.85} />;
    case "bald":
      return <ellipse cx={130} cy={82} rx={14} ry={6} fill="#ffffff" opacity={0.25} transform="rotate(-15 130 82)" />;
  }
}

function Headwear({ c }: { c: ChefAvatarConfig }) {
  const cloth = c.headwearColor;
  const line = luminance(cloth) > 200 ? "#d6d3d1" : shade(cloth, -0.3);

  switch (c.headwear) {
    case "none":
      return null;
    case "toque":
      return (
        <g>
          <path d="M100 80 C78 72 80 34 108 34 C112 10 146 2 160 20 C178 4 214 16 206 44 C228 52 222 82 200 80 Z" fill={cloth} stroke={line} strokeWidth={2} strokeLinejoin="round" />
          <path d="M128 40 C130 54 128 66 124 76" stroke={line} strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M172 40 C170 54 172 66 176 76" stroke={line} strokeWidth={2} fill="none" strokeLinecap="round" />
          <rect x={98} y={70} width={104} height={28} rx={8} fill={cloth} stroke={line} strokeWidth={2} />
          {[116, 133, 150, 167, 184].map((x) => (
            <line key={x} x1={x} y1={73} x2={x} y2={95} stroke={line} strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      );
    case "bandana": {
      const dots: [number, number][] = [[118, 78], [138, 68], [162, 68], [182, 78], [128, 86], [172, 86], [150, 78]];
      const dot = luminance(cloth) > 200 ? "#dc2626" : "#ffffff";
      return (
        <g>
          <path d="M210 98 L234 110 L224 120 Z" fill={shade(cloth, -0.12)} />
          <path d="M210 100 L228 128 L216 130 Z" fill={shade(cloth, -0.12)} />
          <path d="M92 104 C92 70 118 56 150 56 C182 56 208 70 208 104 C190 94 170 90 150 90 C130 90 110 94 92 104 Z" fill={cloth} stroke={line} strokeWidth={1.5} />
          {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} fill={dot} opacity={0.8} />)}
          <circle cx={208} cy={99} r={6} fill={shade(cloth, -0.18)} />
        </g>
      );
    }
    case "cap":
      return (
        <g>
          <path d="M90 104 C88 64 118 50 152 50 C188 50 212 66 210 104 C190 94 170 92 150 92 C130 92 110 94 90 104 Z" fill={cloth} stroke={line} strokeWidth={1.5} />
          <path d="M100 100 Q150 86 200 100 Q204 110 196 112 Q150 102 104 112 Q96 110 100 100 Z" fill={shade(cloth, -0.15)} />
          <circle cx={152} cy={52} r={4} fill={shade(cloth, -0.2)} />
        </g>
      );
    case "beret":
      return (
        <g transform="rotate(-10 150 72)">
          <rect x={145} y={42} width={7} height={10} rx={2} fill={shade(cloth, -0.2)} />
          <ellipse cx={148} cy={70} rx={66} ry={22} fill={cloth} stroke={line} strokeWidth={1.5} />
          <path d="M98 82 Q150 96 202 82" stroke={shade(cloth, -0.2)} strokeWidth={5} fill="none" strokeLinecap="round" />
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
  const skinShade = shade(c.skinTone, -0.18);

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
        <clipPath id={`clip${uid}`}>
          <circle cx={150} cy={150} r={150} />
        </clipPath>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={backdrop.from} />
          <stop offset="100%" stopColor={backdrop.to} />
        </linearGradient>
      </defs>

      <g clipPath={`url(#clip${uid})`}>
        {/* 1. backdrop */}
        <circle cx={150} cy={150} r={150} fill={`url(#bg${uid})`} />
        <circle cx={58} cy={70} r={34} fill="#ffffff" opacity={0.12} />
        <circle cx={250} cy={210} r={22} fill="#ffffff" opacity={0.1} />

        {/* 2. neck */}
        <path d="M128 168 L128 226 Q150 240 172 226 L172 168 Z" fill={c.skinTone} />
        <path d="M128 182 Q150 206 172 182 L172 198 Q150 214 128 198 Z" fill={skinShade} />

        {/* 3. outfit */}
        <Outfit c={c} />
        {c.neckerchief && <Neckerchief c={c} />}

        {/* 4. hair behind the head */}
        <BackHair c={c} />

        {/* 5. ears + head */}
        {[96, 204].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={136} rx={11} ry={15} fill={c.skinTone} />
            <ellipse cx={x} cy={136} rx={5} ry={8} fill={skinShade} />
          </g>
        ))}
        <path d={HEAD_PATHS[c.faceShape]} fill={c.skinTone} />

        {/* 6. face */}
        {c.blush && (
          <g fill="#f87171" opacity={0.28}>
            <ellipse cx={118} cy={158} rx={11} ry={6} />
            <ellipse cx={182} cy={158} rx={11} ry={6} />
          </g>
        )}
        <path d="M150 140 C146 150 146 154 152 155" stroke={shade(c.skinTone, -0.32)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
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
      className={`rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      title={title}
    >
      {emoji || "🧑‍🍳"}
    </span>
  );
}

export { DEFAULT_CHEF_AVATAR };

