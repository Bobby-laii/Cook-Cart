/**
 * Unified Gemini endpoint resolver supporting both:
 * 1. Google AI Studio keys (`AIzaSy...` from https://aistudio.google.com/apikey)
 *    -> https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * 2. Google Cloud Vertex AI Express Mode keys (`AQ....` from Google Cloud / Vertex AI Studio)
 *    -> https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent
 */

export function getGeminiApiKey(): string {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

export function isVertexExpressApiKey(apiKey: string): boolean {
  return /^AQ\./i.test(apiKey.trim());
}

export function getGeminiGenerateContentUrl(model: string, apiKey: string): string {
  const cleanModel = model.replace(/^models\//, "").trim();
  if (isVertexExpressApiKey(apiKey)) {
    return `https://aiplatform.googleapis.com/v1/publishers/google/models/${cleanModel}:generateContent`;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
}

export function getGeminiStreamContentUrl(model: string, apiKey: string): string {
  const cleanModel = model.replace(/^models\//, "").trim();
  if (isVertexExpressApiKey(apiKey)) {
    return `https://aiplatform.googleapis.com/v1/publishers/google/models/${cleanModel}:streamGenerateContent?alt=sse`;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?alt=sse`;
}
