/**
 * Hands-free cooking: the pure logic behind voice commands and the wave gesture, kept
 * free of browser APIs so it can be unit-tested. The hooks in this folder feed it.
 */

export type CookCommand =
  | { kind: "next" }
  | { kind: "back" }
  | { kind: "repeat" }
  | { kind: "startTimer" }
  | { kind: "stopTimer" }
  | { kind: "ingredients" }
  | { kind: "ask"; question: string };

/** Words that ask the chef a question: "chef, how do I know the onions are done?" */
const ASK_PREFIX = /^(?:hey\s+|ok\s+|okay\s+)?chef[,.!?]?\s+(.+)$/i;

/**
 * Turns one recognised phrase into a command, or null.
 *
 * Plain commands only count when the phrase is short (up to four words), so a step
 * being read aloud ("…then go back to the pan and stir…") or kitchen chatter can't
 * flip the page. Questions must start with "chef" and are passed on whole.
 */
export function parseCommand(transcript: string): CookCommand | null {
  const text = transcript.trim().replace(/\s+/g, " ");
  if (!text) return null;

  const ask = text.match(ASK_PREFIX);
  if (ask) {
    const question = ask[1].trim();
    // "chef next" is a command addressed to the chef, not a question.
    const inner = parseCommand(question);
    if (inner && inner.kind !== "ask") return inner;
    return question.split(" ").length >= 2 ? { kind: "ask", question } : null;
  }

  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 4) return null;
  const phrase = words.join(" ");

  if (/\b(start|set) (the )?timer\b|^timer$/.test(phrase)) return { kind: "startTimer" };
  if (/\b(stop|pause|cancel) (the )?timer\b/.test(phrase)) return { kind: "stopTimer" };
  if (/\bingredients?\b/.test(phrase)) return { kind: "ingredients" };
  if (/\b(repeat|again|say that again|what was that)\b/.test(phrase)) return { kind: "repeat" };
  if (/\b(back|previous|go back|last step)\b/.test(phrase)) return { kind: "back" };
  if (/\b(next|continue|done|ok next|okay next)\b/.test(phrase)) return { kind: "next" };
  return null;
}

/** One motion sample from the camera: when it was taken and where the movement was. */
export interface MotionSample {
  t: number;
  /** Fraction of pixels that changed since the previous frame, 0–1. */
  amount: number;
  /** Horizontal centre of the changed pixels, 0 (left of the raw frame) to 1 (right). */
  x: number;
}

export type Swipe = "next" | "back";

/** A hand covering this much of the frame counts as movement; less is noise or light flicker. */
export const MIN_MOTION = 0.04;
/** The hand has to travel this far across the frame to count as a wave. */
const MIN_TRAVEL = 0.3;
/** A wave is a quick movement; slower drifts (someone walking past) are ignored. */
const MAX_DURATION_MS = 900;

/**
 * Reads a wave out of recent motion samples.
 *
 * The front camera's raw frame is not mirrored: a hand moving to the cook's right
 * moves to the left of the frame. So travel towards the frame's left reads as
 * "next" (wave to your right, like turning a page) and towards its right as "back".
 * Returns null unless the movement is one quick, wide sweep.
 */
export function detectSwipe(samples: MotionSample[]): Swipe | null {
  const moving = samples.filter((s) => s.amount >= MIN_MOTION);
  if (moving.length < 3) return null;
  const first = moving[0];
  const last = moving[moving.length - 1];
  if (last.t - first.t > MAX_DURATION_MS) return null;

  const travel = last.x - first.x;
  if (Math.abs(travel) < MIN_TRAVEL) return null;

  // Most steps must agree on the direction, or it was a shake, not a sweep.
  let agree = 0;
  for (let i = 1; i < moving.length; i++) {
    if (Math.sign(moving[i].x - moving[i - 1].x) === Math.sign(travel)) agree++;
  }
  if (agree / (moving.length - 1) < 0.75) return null;

  return travel < 0 ? "next" : "back";
}

/**
 * Compares two greyscale frames of the same size and returns how much changed and
 * where. `threshold` is the brightness difference (0–255) a pixel needs to count.
 */
export function frameMotion(prev: Uint8ClampedArray, next: Uint8ClampedArray, width: number, threshold = 28) {
  let changed = 0;
  let sumX = 0;
  for (let i = 0; i < next.length; i++) {
    if (Math.abs(next[i] - prev[i]) > threshold) {
      changed++;
      sumX += i % width;
    }
  }
  return {
    amount: next.length ? changed / next.length : 0,
    x: changed ? sumX / changed / Math.max(1, width - 1) : 0.5,
  };
}
