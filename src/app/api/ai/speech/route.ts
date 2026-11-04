import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { pcmToWav, speechStyleText } from "@/lib/ai/speech";

/**
 * The chef's voice: turns a cooking step or a chef answer into natural speech with
 * Gemini text-to-speech, returned as a WAV file.
 *
 * Status codes the client relies on (src/lib/handsfree/speech.ts):
 *   501 no Gemini key on this server → the client stops asking and uses the phone's voice
 *   401 signed out, 429 today's allowance used, 502 Gemini failed → phone's voice this time
 *
 * Steps are the same for everyone who cooks a dish, so answers are cached in memory.
 */

const MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
/** A warm, calm prebuilt Gemini voice. Override with GEMINI_TTS_VOICE. */
const VOICE = process.env.GEMINI_TTS_VOICE || "Sulafat";
const MAX_CHARS = 700;
const DAILY_LIMIT_PER_USER = 150;
const CACHE_MAX = 300;

const cache = new Map<string, Buffer>();
const usage = new Map<string, { day: string; count: number }>();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function withinAllowance(userId: string): boolean {
  const day = today();
  const entry = usage.get(userId);
  if (!entry || entry.day !== day) {
    usage.set(userId, { day, count: 1 });
    return true;
  }
  if (entry.count >= DAILY_LIMIT_PER_USER) return false;
  entry.count++;
  return true;
}

function wav(body: Buffer) {
  return new NextResponse(new Uint8Array(body), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" },
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No voice on this server" }, { status: 501 });

  const session = await getCurrentSession();
  if (!session?.userId) return NextResponse.json({ error: "Sign in to hear the chef's voice" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
  if (!text) return NextResponse.json({ error: "Nothing to say" }, { status: 400 });

  const cached = cache.get(text);
  if (cached) return wav(cached);

  if (!withinAllowance(session.userId)) {
    return NextResponse.json({ error: "Today's voice allowance is used up" }, { status: 429 });
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: speechStyleText(text) }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    });
    if (!res.ok) {
      console.warn(`Gemini TTS ${MODEL} returned ${res.status}:`, await res.text());
      return NextResponse.json({ error: "The chef's voice isn't available right now" }, { status: 502 });
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!part?.data) return NextResponse.json({ error: "The chef's voice isn't available right now" }, { status: 502 });

    // Gemini returns raw 16-bit PCM ("audio/L16;codec=pcm;rate=24000"); browsers need a WAV header.
    const rate = Number(/rate=(\d+)/.exec(part.mimeType ?? "")?.[1]) || 24000;
    const audio = pcmToWav(Buffer.from(part.data, "base64"), rate);

    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(text, audio);
    return wav(audio);
  } catch (error) {
    console.warn("Gemini TTS failed:", error);
    return NextResponse.json({ error: "The chef's voice isn't available right now" }, { status: 502 });
  }
}
