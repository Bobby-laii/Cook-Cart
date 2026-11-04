"use client";

/**
 * Speaking out loud in cooking mode: steps, "repeat", and the chef's answers.
 *
 * First choice is the app's own voice (/api/ai/speech, Gemini text-to-speech: a warm,
 * natural voice). If that isn't available (no AI key, signed out, offline, daily
 * limit) it falls back to the best voice the phone already has. Phones ship robotic
 * defaults next to much better "Natural", "Enhanced", "Premium" or Siri/Google
 * voices, so we pick by name rather than taking the first one.
 */

let audio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let serverVoiceOff = false;
let token = 0;

/** Higher is better. Names come from the voices iOS, macOS, Android and Chrome ship. */
export function scoreVoice(v: Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">): number {
  if (!/^en[-_]/i.test(v.lang) && v.lang.toLowerCase() !== "en") return -1;
  const name = v.name.toLowerCase();
  let score = 0;
  if (/natural|neural|premium|enhanced|siri/.test(name)) score += 50;
  if (/google/.test(name)) score += 30;
  if (/samantha|ava|zoe|allison|serena|karen|daniel|moira/.test(name)) score += 15;
  if (/compact|espeak|novelty|whisper|zarvox|bells|bubbles|bad news|good news|jester|organ|trinoids|cellos|boing|albert|fred|junior|ralph/.test(name))
    score -= 60;
  if (/en[-_](us|gb)/i.test(v.lang)) score += 5;
  if (v.localService) score += 2;
  return score;
}

function bestSystemVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const s = scoreVoice(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

function speakWithSystem(text: string) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance(text);
  const voice = bestSystemVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.rate = 0.97;
  synth.speak(u);
}

export function stopSpeaking() {
  token++;
  if (typeof window === "undefined") return;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

/** Says `text`, replacing anything already being said. */
export async function speak(text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  stopSpeaking();
  const mine = token;

  if (!serverVoiceOff) {
    try {
      const res = await fetch("/api/ai/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (mine !== token) return;
      // 501 = no AI key on this server: stop asking for the rest of the visit.
      if (res.status === 501) serverVoiceOff = true;
      if (res.ok) {
        const blob = await res.blob();
        if (mine !== token) return;
        currentUrl = URL.createObjectURL(blob);
        audio = audio ?? new Audio();
        audio.src = currentUrl;
        await audio.play();
        return;
      }
    } catch {
      // Offline, or the browser refused to play: use the phone's voice.
    }
    if (mine !== token) return;
  }
  speakWithSystem(text);
}

/** Voice lists load late on some browsers; ask early so the first step has a good voice. */
export function warmUpVoices() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();
}
