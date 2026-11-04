/**
 * Helpers for the chef's voice (src/app/api/ai/speech/route.ts). Kept separate so
 * they can be tested without a network or a key.
 */

/**
 * Gemini text-to-speech takes the delivery as plain words before the text. A calm,
 * unhurried kitchen voice suits someone cooking after work.
 */
export function speechStyleText(text: string): string {
  return `Read this calmly and warmly, at an unhurried pace, like a friend cooking beside you: ${text}`;
}

/** Wraps mono 16-bit little-endian PCM in a WAV header so any browser can play it. */
export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
