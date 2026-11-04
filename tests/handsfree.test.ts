import { describe, it, expect } from "vitest";
import { detectSwipe, frameMotion, parseCommand, type MotionSample } from "@/lib/handsfree/commands";

describe("parseCommand", () => {
  it("understands short step commands", () => {
    expect(parseCommand("next")).toEqual({ kind: "next" });
    expect(parseCommand("Next step")).toEqual({ kind: "next" });
    expect(parseCommand("go back")).toEqual({ kind: "back" });
    expect(parseCommand("repeat that")).toEqual({ kind: "repeat" });
    expect(parseCommand("start the timer")).toEqual({ kind: "startTimer" });
    expect(parseCommand("stop timer")).toEqual({ kind: "stopTimer" });
    expect(parseCommand("show ingredients")).toEqual({ kind: "ingredients" });
    expect(parseCommand("check pan")).toEqual({ kind: "checkStep" });
    expect(parseCommand("show the chef")).toEqual({ kind: "checkStep" });
    expect(parseCommand("look at this")).toEqual({ kind: "checkStep" });
  });

  it("ignores long phrases, so a step read aloud can't change the page", () => {
    expect(parseCommand("then go back to the pan and stir it well")).toBeNull();
    expect(parseCommand("")).toBeNull();
    expect(parseCommand("hello")).toBeNull();
  });

  it("passes questions that start with chef to the chef", () => {
    expect(parseCommand("Chef, how do I know the onions are done?")).toEqual({
      kind: "ask",
      question: "how do I know the onions are done?",
    });
    expect(parseCommand("hey chef can I use butter instead")).toEqual({
      kind: "ask",
      question: "can I use butter instead",
    });
  });

  it("treats 'chef next' as a command, not a question", () => {
    expect(parseCommand("chef next")).toEqual({ kind: "next" });
    expect(parseCommand("chef")).toBeNull();
  });
});

function sweep(from: number, to: number, ms = 400, amount = 0.1): MotionSample[] {
  const n = 6;
  return Array.from({ length: n }, (_, i) => ({ t: (i * ms) / (n - 1), amount, x: from + ((to - from) * i) / (n - 1) }));
}

describe("detectSwipe", () => {
  it("reads a quick sweep towards the frame's left as next (the cook waved to their right)", () => {
    expect(detectSwipe(sweep(0.8, 0.2))).toBe("next");
  });

  it("reads a sweep towards the frame's right as back", () => {
    expect(detectSwipe(sweep(0.2, 0.8))).toBe("back");
  });

  it("ignores small, slow or faint movement", () => {
    expect(detectSwipe(sweep(0.5, 0.6))).toBeNull();
    expect(detectSwipe(sweep(0.8, 0.2, 2000))).toBeNull();
    expect(detectSwipe(sweep(0.8, 0.2, 400, 0.01))).toBeNull();
  });

  it("ignores a shake that goes both ways", () => {
    const shake = [0.3, 0.7, 0.3, 0.7, 0.3, 0.75].map((x, i) => ({ t: i * 60, amount: 0.1, x }));
    expect(detectSwipe(shake)).toBeNull();
  });
});

describe("frameMotion", () => {
  it("finds where the frame changed", () => {
    const width = 4;
    const prev = new Uint8ClampedArray(16);
    const next = new Uint8ClampedArray(16);
    // Change the right-hand column only.
    for (let row = 0; row < 4; row++) next[row * width + 3] = 200;
    const m = frameMotion(prev, next, width);
    expect(m.amount).toBeCloseTo(0.25);
    expect(m.x).toBeCloseTo(1);
  });

  it("reports no motion for identical frames", () => {
    const a = new Uint8ClampedArray(16).fill(100);
    expect(frameMotion(a, a, 4).amount).toBe(0);
  });
});

import { pcmToWav, speechStyleText } from "@/lib/ai/speech";
import { scoreVoice } from "@/lib/handsfree/speech";

describe("chef voice", () => {
  it("wraps Gemini's raw PCM in a playable WAV header", () => {
    const pcm = Buffer.alloc(480);
    const wav = pcmToWav(pcm, 24000);
    expect(wav.length).toBe(44 + 480);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt32LE(40)).toBe(480);
  });

  it("asks for a calm delivery and keeps the text", () => {
    expect(speechStyleText("Stir the onions.")).toMatch(/calmly.*Stir the onions\.$/);
  });

  it("prefers natural phone voices over robotic defaults", () => {
    const natural = scoreVoice({ name: "Ava (Premium)", lang: "en-US", localService: true });
    const google = scoreVoice({ name: "Google US English", lang: "en-US", localService: false });
    const robot = scoreVoice({ name: "Fred", lang: "en-US", localService: true });
    const french = scoreVoice({ name: "Amélie (Enhanced)", lang: "fr-CA", localService: true });
    expect(natural).toBeGreaterThan(robot);
    expect(google).toBeGreaterThan(robot);
    expect(french).toBe(-1);
  });
});
