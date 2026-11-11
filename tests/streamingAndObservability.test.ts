import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: { findUnique: vi.fn().mockResolvedValue(null) },
    aIUsageLog: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { estimatedCostHkd: 0 } }),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { MenuTagStreamFilter, executeAIChatStream } from "@/lib/ai/aiService";
import {
  redactSensitiveData,
  redactSensitiveText,
  estimateAICost,
  ChatObservabilitySession,
} from "@/lib/ai/observability";

describe("Streaming Responses & AI Observability (Phases 3 & 6)", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("MenuTagStreamFilter hides <COOKCART_MENU> JSON even when split across tiny chunks", () => {
    const filter = new MenuTagStreamFilter();
    const rawStream = [
      "Here are three ",
      "dishes for tonight. <COOK",
      "CART_MENU>[{\"title\":",
      "\"Garlic Rice\"}]</COOK",
      "CART_MENU> Enjoy!",
    ];

    let visible = "";
    for (const chunk of rawStream) {
      visible += filter.push(chunk);
    }
    const { remainingVisibleText, fullMenuBlock } = filter.flush();
    visible += remainingVisibleText;

    expect(visible).toBe("Here are three dishes for tonight.  Enjoy!");
    expect(visible).not.toContain("COOKCART_MENU");
    expect(visible).not.toContain("Garlic Rice");
    expect(fullMenuBlock).toBe('<COOKCART_MENU>[{"title":"Garlic Rice"}]</COOKCART_MENU>');
  });

  it("executeAIChatStream yields progressive delta events, suggestions, and done payload", async () => {
    const events: any[] = [];
    const gen = executeAIChatStream({
      userId: "u1",
      conversationId: "convo_stream_1",
      messages: [{ role: "user", content: "What can I cook with eggs and garlic?" }],
      quickStartData: {
        ingredients: ["Eggs", "Garlic"],
        cuisine: "Cantonese",
        servings: 2,
      },
    });

    for await (const ev of gen) {
      events.push(ev);
    }

    const deltas = events.filter((e) => e.type === "delta").map((e) => e.text);
    expect(deltas.length).toBeGreaterThan(2);
    expect(deltas.join("")).toContain("Eggs, Garlic");

    const suggestionEvent = events.find((e) => e.type === "suggestions");
    expect(suggestionEvent).toBeDefined();
    expect(suggestionEvent.structuredSuggestions).toHaveLength(3);

    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent.payload.traceId).toMatch(/^trace_/);
  });

  it("redacts emails, phone numbers, API keys, JWTs, and passwords before logging", () => {
    const dirtyText =
      "User alice@example.com called +852 9123 4567 with key AIzaSyD9876543210abcdefghijklmnop and token=mySecretPass123";
    const redacted = redactSensitiveText(dirtyText);

    expect(redacted).not.toContain("alice@example.com");
    expect(redacted).not.toContain("9123 4567");
    expect(redacted).not.toContain("AIzaSyD9876543210abcdefghijklmnop");
    expect(redacted).not.toContain("mySecretPass123");
    expect(redacted).toContain("[REDACTED_EMAIL]");
    expect(redacted).toContain("[REDACTED_PHONE]");
    expect(redacted).toContain("[REDACTED_API_KEY]");
    expect(redacted).toContain("[REDACTED_SECRET]");

    const obj = redactSensitiveData({
      user: "bob@cookcart.io",
      password: "super-secret-password",
      nested: {
        apiKey: "AQ.Ab8RN6VertexKey1234567890",
        note: "Preheat oven to 180°C for 25 minutes",
      },
    });

    expect(obj.user).toBe("[REDACTED_EMAIL]");
    expect(obj.password).toBe("[REDACTED]");
    expect(obj.nested.apiKey).toBe("[REDACTED]");
    // Preserves legitimate cooking numbers
    expect(obj.nested.note).toBe("Preheat oven to 180°C for 25 minutes");
  });

  it("tracks generations, tool spans, and calculates model cost accurately", async () => {
    const cost = estimateAICost("gemini-2.5-flash", 1000, 500);
    expect(cost.costUsd).toBeGreaterThan(0);
    expect(cost.costHkd).toBeGreaterThan(0);

    const freeCost = estimateAICost("cookcart-local-engine", 1000, 500);
    expect(freeCost.costUsd).toBe(0);

    const session = new ChatObservabilitySession({
      conversationId: "convo_obs",
      userId: "user_obs",
      userMessage: "Contact me at chef@example.com",
    });

    session.recordGeneration({
      model: "gemini-2.5-flash",
      input: "Contact me at chef@example.com",
      output: "Let's cook pasta.",
      promptTokens: 50,
      completionTokens: 20,
      latencyMs: 145,
    });

    session.recordToolCall({
      toolName: "convert_units",
      input: { amount: 2, unit: "cup" },
      output: { convertedAmount: 480, convertedUnit: "ml" },
      success: true,
      durationMs: 4,
    });

    const summary = await session.finalize({
      outputMessage: "Let's cook pasta.",
      modelUsed: "gemini-2.5-flash",
      suggestionCount: 1,
    });

    expect(summary.traceId).toContain("trace_convo_obs");
    expect(session.generations[0].input).toBe("Contact me at [REDACTED_EMAIL]");
    expect(session.toolCalls[0].toolName).toBe("convert_units");
  });
});
