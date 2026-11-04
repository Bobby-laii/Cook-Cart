import { describe, it, expect } from "vitest";
import {
  DEFAULT_CHEF_AVATAR,
  HAIR_STYLES,
  isValidPersonality,
  parseChefAvatarConfig,
  randomChefAvatar,
  sanitizeChefAvatarConfig,
  shade,
} from "../src/lib/avatar/chefAvatar";

describe("Chef avatar config", () => {
  it("returns defaults for empty or non-object input", () => {
    expect(sanitizeChefAvatarConfig(undefined)).toEqual(DEFAULT_CHEF_AVATAR);
    expect(sanitizeChefAvatarConfig("nope")).toEqual(DEFAULT_CHEF_AVATAR);
    expect(sanitizeChefAvatarConfig(null)).toEqual(DEFAULT_CHEF_AVATAR);
  });

  it("keeps valid values and normalises colour case", () => {
    const out = sanitizeChefAvatarConfig({ hairStyle: "curly", skinTone: "#ABCDEF", headwear: "beret", neckerchief: false });
    expect(out.hairStyle).toBe("curly");
    expect(out.skinTone).toBe("#abcdef");
    expect(out.headwear).toBe("beret");
    expect(out.neckerchief).toBe(false);
  });

  it("rejects unknown parts, unsafe colours and extra keys (no SVG/CSS injection)", () => {
    const out = sanitizeChefAvatarConfig({
      hairStyle: "<script>",
      skinTone: "red;} body{display:none",
      hairColor: "url(javascript:alert(1))",
      backdrop: "../../etc",
      blush: "yes",
      evil: "payload",
    }) as unknown as Record<string, unknown>;
    expect(out.hairStyle).toBe(DEFAULT_CHEF_AVATAR.hairStyle);
    expect(out.skinTone).toBe(DEFAULT_CHEF_AVATAR.skinTone);
    expect(out.hairColor).toBe(DEFAULT_CHEF_AVATAR.hairColor);
    expect(out.backdrop).toBe(DEFAULT_CHEF_AVATAR.backdrop);
    expect(out.blush).toBe(DEFAULT_CHEF_AVATAR.blush);
    expect(out).not.toHaveProperty("evil");
  });

  it("parses stored JSON and tolerates corrupt data", () => {
    expect(parseChefAvatarConfig(null)).toBeNull();
    expect(parseChefAvatarConfig("{not json")).toBeNull();
    expect(parseChefAvatarConfig(JSON.stringify({ hairStyle: "bun" }))?.hairStyle).toBe("bun");
  });

  it("randomizer always produces a valid config", () => {
    for (let i = 0; i < 200; i++) {
      const cfg = randomChefAvatar();
      expect(sanitizeChefAvatarConfig(cfg)).toEqual(cfg);
      expect(HAIR_STYLES).toContain(cfg.hairStyle);
    }
  });

  it("validates personalities", () => {
    expect(isValidPersonality("friendly")).toBe(true);
    expect(isValidPersonality("evil")).toBe(false);
    expect(isValidPersonality(42)).toBe(false);
  });

  it("shades colours toward black/white", () => {
    expect(shade("#808080", -1)).toBe("#000000");
    expect(shade("#808080", 1)).toBe("#ffffff");
    expect(shade("#808080", 0)).toBe("#808080");
  });
});


import { CHEF_NAMES, randomChefName } from "@/lib/avatar/chefAvatar";

describe("randomChefName", () => {
  it("picks a name from the list and never repeats the current one", () => {
    for (let i = 0; i < 50; i++) {
      const name = randomChefName("Chef Mei");
      expect(CHEF_NAMES).toContain(name);
      expect(name).not.toBe("Chef Mei");
    }
  });

  it("keeps every name within the 30-character limit", () => {
    for (const n of CHEF_NAMES) expect(n.length).toBeLessThanOrEqual(30);
  });
});
