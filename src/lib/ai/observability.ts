/**
 * AI Observability & Telemetry Module (Langfuse + Local Audit Log)
 *
 * Follows the Langfuse skill best practices (`references/instrumentation.md` & `references/user-feedback.md`):
 * - Tracks model name, prompt version, latency, input/output tokens, API errors,
 *   tool execution spans (success/failure/duration), and estimated costs (USD & HKD).
 * - Groups multi-turn conversations with `sessionId` (`conversationId`) and attributes by `userId`.
 * - Redacts sensitive information (emails, phone numbers, API keys, JWTs, passwords)
 *   before any payload is logged or sent to Langfuse.
 * - Captures explicit user feedback scores (`user_rating` via Thumbs Up / Thumbs Down).
 * - Gracefully no-ops remote calls when `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` are not set.
 */

import { Langfuse } from "langfuse";
import { SYSTEM_PROMPT_VERSION } from "@/config/systemPrompt";

/* -------------------------------------------------------------------------- *
 * 1. Sensitive Information (PII & Secret) Redaction
 * -------------------------------------------------------------------------- */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{4}[\s-]?\d{4}\b/g;
const API_KEY_REGEX =
  /\b(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z._-]{16,}|sk-[A-Za-z0-9_-]{16,}|pk-lf-[A-Za-z0-9_-]{16,}|sk-lf-[A-Za-z0-9_-]{16,}|gsk_[A-Za-z0-9_-]{16,})\b/g;
const JWT_REGEX = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const PASSWORD_KV_REGEX = /((?:password|passwd|secret|api_key|apikey|token|authorization)\s*[:=]\s*)(["']?)[^\s"',;]+(\2)/gi;

/**
 * Redact emails, phone numbers, API keys, JWT tokens, and secret key-value pairs
 * from any string before logging to observability.
 */
export function redactSensitiveText(text: string): string {
  if (!text) return text;
  return text
    .replace(API_KEY_REGEX, "[REDACTED_API_KEY]")
    .replace(JWT_REGEX, "[REDACTED_JWT]")
    .replace(PASSWORD_KV_REGEX, "$1$2[REDACTED_SECRET]$3")
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, (match) => {
      // Avoid masking cooking temperatures or 4-digit years/grams like "1800"
      const digits = match.replace(/\D/g, "");
      return digits.length >= 8 ? "[REDACTED_PHONE]" : match;
    });
}

/**
 * Deeply redact sensitive values from arbitrary objects/arrays before telemetry logging.
 */
export function redactSensitiveData<T>(value: T): T {
  if (typeof value === "string") {
    return redactSensitiveText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/^(password|passwordHash|secret|apiKey|token|authorization|cookie)$/i.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactSensitiveData(v);
      }
    }
    return out as T;
  }
  return value;
}

/* -------------------------------------------------------------------------- *
 * 2. Cost Estimation (USD & HKD)
 * -------------------------------------------------------------------------- */

const USD_TO_HKD = 7.8;

/**
 * Approximate per-1M-token rates in USD for supported models.
 */
const MODEL_PRICING_PER_1M_USD: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function estimateAICost(
  modelName: string,
  promptTokens: number,
  completionTokens: number
): { costUsd: number; costHkd: number } {
  const lower = modelName.toLowerCase();
  let rate = { input: 0.15, output: 0.6 };

  for (const [key, r] of Object.entries(MODEL_PRICING_PER_1M_USD)) {
    if (lower.includes(key)) {
      rate = r;
      break;
    }
  }

  if (lower.includes("local-engine") || lower.includes("free") || lower.includes("limit-enforcer")) {
    return { costUsd: 0, costHkd: 0 };
  }

  const costUsd = (promptTokens / 1_000_000) * rate.input + (completionTokens / 1_000_000) * rate.output;
  const costHkd = Math.max(
    costUsd * USD_TO_HKD,
    ((promptTokens + completionTokens) / 1000) * 0.003
  );

  return {
    costUsd: Number(costUsd.toFixed(6)),
    costHkd: Number(costHkd.toFixed(6)),
  };
}

/* -------------------------------------------------------------------------- *
 * 3. Langfuse Client Singleton
 * -------------------------------------------------------------------------- */

let langfuseInstance: Langfuse | null = null;

export function isLangfuseConfigured(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY?.trim() && process.env.LANGFUSE_SECRET_KEY?.trim()
  );
}

export function getLangfuseClient(): Langfuse | null {
  if (!isLangfuseConfigured()) return null;
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!.trim(),
      secretKey: process.env.LANGFUSE_SECRET_KEY!.trim(),
      baseUrl: (
        process.env.LANGFUSE_BASE_URL ||
        process.env.LANGFUSE_HOST ||
        "https://cloud.langfuse.com"
      ).trim(),
      flushAt: 1,
      flushInterval: 1000,
    });
  }
  return langfuseInstance;
}

/* -------------------------------------------------------------------------- *
 * 4. Trace & Observation Recorder
 * -------------------------------------------------------------------------- */

export interface GenerationTelemetry {
  model: string;
  promptVersion?: string;
  input: unknown;
  output?: unknown;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  error?: string;
}

export interface ToolTelemetry {
  toolName: string;
  input: unknown;
  output?: unknown;
  success: boolean;
  durationMs: number;
  error?: string;
}

export class ChatObservabilitySession {
  public readonly traceId: string;
  private readonly startedAt: number;
  private readonly trace: any | null = null;
  public readonly generations: GenerationTelemetry[] = [];
  public readonly toolCalls: ToolTelemetry[] = [];

  constructor(params: {
    conversationId: string;
    userId?: string;
    userMessage: string;
    quickStartData?: unknown;
  }) {
    this.startedAt = Date.now();
    this.traceId = `trace_${params.conversationId}_${this.startedAt.toString(36)}`;

    const lf = getLangfuseClient();
    if (lf) {
      try {
        this.trace = lf.trace({
          id: this.traceId,
          name: "cookcart-chef-chat",
          sessionId: params.conversationId,
          userId: params.userId || "anonymous",
          input: redactSensitiveData({
            message: params.userMessage,
            quickStartData: params.quickStartData,
          }),
          tags: ["chef-chat", SYSTEM_PROMPT_VERSION],
          metadata: {
            promptVersion: SYSTEM_PROMPT_VERSION,
          },
        });
      } catch (e) {
        console.warn("Langfuse trace init warning:", e);
      }
    }
  }

  recordGeneration(gen: GenerationTelemetry) {
    const redactedGen: GenerationTelemetry = {
      ...gen,
      promptVersion: gen.promptVersion || SYSTEM_PROMPT_VERSION,
      input: redactSensitiveData(gen.input),
      output: redactSensitiveData(gen.output),
      error: gen.error ? redactSensitiveText(gen.error) : undefined,
    };
    this.generations.push(redactedGen);

    if (this.trace) {
      try {
        const { costUsd, costHkd } = estimateAICost(
          gen.model,
          gen.promptTokens,
          gen.completionTokens
        );
        this.trace.generation({
          name: `llm-${gen.model}`,
          model: gen.model,
          input: redactedGen.input,
          output: redactedGen.output,
          usage: {
            input: gen.promptTokens,
            output: gen.completionTokens,
            total: gen.promptTokens + gen.completionTokens,
            unit: "TOKENS",
          },
          level: gen.error ? "ERROR" : "DEFAULT",
          statusMessage: redactedGen.error,
          metadata: {
            promptVersion: redactedGen.promptVersion,
            latencyMs: gen.latencyMs,
            estimatedCostUsd: costUsd,
            estimatedCostHkd: costHkd,
          },
        });
      } catch (e) {
        console.warn("Langfuse generation log warning:", e);
      }
    }
  }

  recordToolCall(tool: ToolTelemetry) {
    const redactedTool: ToolTelemetry = {
      ...tool,
      input: redactSensitiveData(tool.input),
      output: redactSensitiveData(tool.output),
      error: tool.error ? redactSensitiveText(tool.error) : undefined,
    };
    this.toolCalls.push(redactedTool);

    if (this.trace) {
      try {
        this.trace.span({
          name: `tool-${tool.toolName}`,
          input: redactedTool.input,
          output: redactedTool.output,
          level: tool.success ? "DEFAULT" : "ERROR",
          statusMessage: redactedTool.error,
          metadata: {
            observationType: "tool",
            toolName: tool.toolName,
            success: tool.success,
            durationMs: tool.durationMs,
          },
        });
      } catch (e) {
        console.warn("Langfuse tool span warning:", e);
      }
    }
  }

  recordSecurityEvent(categories: string[], rawInput: string) {
    if (this.trace) {
      try {
        this.trace.event({
          name: "prompt-injection-blocked",
          level: "WARNING",
          input: redactSensitiveText(rawInput),
          metadata: {
            triggeredCategories: categories,
          },
        });
      } catch {
        // Ignore telemetry error
      }
    }
  }

  async finalize(params: {
    outputMessage: string;
    modelUsed: string;
    suggestionCount?: number;
    error?: string;
  }): Promise<{ totalLatencyMs: number; traceId: string }> {
    const totalLatencyMs = Date.now() - this.startedAt;

    if (this.trace) {
      try {
        this.trace.update({
          output: redactSensitiveData({
            message: params.outputMessage,
            modelUsed: params.modelUsed,
            suggestionCount: params.suggestionCount || 0,
          }),
          metadata: {
            promptVersion: SYSTEM_PROMPT_VERSION,
            totalLatencyMs,
            toolCallsCount: this.toolCalls.length,
            ...(params.error ? { error: redactSensitiveText(params.error) } : {}),
          },
        });
        const lf = getLangfuseClient();
        await lf?.flushAsync();
      } catch (e) {
        console.warn("Langfuse finalize warning:", e);
      }
    }

    return { totalLatencyMs, traceId: this.traceId };
  }
}

/**
 * Record explicit user feedback (e.g., thumbs up = 1, thumbs down = 0)
 * as a Langfuse score attached to the trace or session.
 */
export async function recordUserFeedbackScore(params: {
  traceId?: string;
  conversationId?: string;
  dishTitle?: string;
  rating: "up" | "down";
  comment?: string;
  userId?: string;
}): Promise<{ recorded: boolean; traceId: string }> {
  const effectiveTraceId =
    params.traceId || `trace_${params.conversationId || "session"}_feedback`;
  const numericValue = params.rating === "up" ? 1 : 0;

  const lf = getLangfuseClient();
  if (lf) {
    try {
      lf.score({
        traceId: effectiveTraceId,
        name: "user_rating",
        value: numericValue,
        comment: redactSensitiveText(
          [params.dishTitle ? `Dish: ${params.dishTitle}` : "", params.comment || ""]
            .filter(Boolean)
            .join(" - ")
        ),
      });
      await lf.flushAsync();
      return { recorded: true, traceId: effectiveTraceId };
    } catch (e) {
      console.warn("Langfuse score warning:", e);
    }
  }

  return { recorded: false, traceId: effectiveTraceId };
}
