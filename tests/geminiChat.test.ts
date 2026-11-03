import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The chef runs on Gemini's free tier. These tests stub `fetch`, so no request
 * leaves the machine and no real key is needed.
 */

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

import { executeAIChat } from "@/lib/ai/aiService";
import { prisma } from "@/lib/prisma";

const geminiReply = (text: string) =>
    new Response(
        JSON.stringify({
            candidates: [{ content: { parts: [{ text }] } }],
            usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );

describe("chef chat on Gemini", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        process.env.GEMINI_API_KEY = "test-key-not-real";
        delete process.env.GEMINI_MODEL;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.GROQ_API_KEY;
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
        vi.unstubAllGlobals();
    });

    it("asks Gemini first, with the chef's rules and the recent conversation", async () => {
        fetchMock.mockResolvedValue(geminiReply("Not burnt, just toasty. Add a splash of water."));

        const result = await executeAIChat({
            userId: "user-1",
            conversationId: "convo-1",
            messages: [
                { role: "assistant", content: "Hi! What are we cooking?" },
                { role: "user", content: "Fried rice" },
                { role: "assistant", content: "Great choice." },
                { role: "user", content: "Is the bottom burnt?" },
            ],
        });

        expect(result.message).toContain("toasty");
        expect(result.modelUsed).toBe("gemini-2.5-flash");

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toContain("/models/gemini-2.5-flash:generateContent");
        // The key travels in a header, never in the URL.
        expect(url).not.toContain("test-key-not-real");
        expect(init.headers["x-goog-api-key"]).toBe("test-key-not-real");

        const body = JSON.parse(init.body);
        expect(body.systemInstruction.parts[0].text).toContain("not a therapist");
        // A leading chef greeting is dropped: Gemini requires the user to speak first.
        expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
        expect(body.contents.at(-1).parts[0].text).toBe("Is the bottom burnt?");

        expect(prisma.aIUsageLog.create).toHaveBeenCalled();
    });

    it("uses GEMINI_MODEL when set, so a retired model can be swapped without a code change", async () => {
        process.env.GEMINI_MODEL = "gemini-next-flash";
        fetchMock.mockResolvedValue(geminiReply("Hello!"));

        await executeAIChat({
            conversationId: "convo-2",
            messages: [{ role: "user", content: "Hi chef" }],
        });

        expect(fetchMock.mock.calls[0][0]).toContain("/models/gemini-next-flash:generateContent");
    });

    it("stops at the daily limit without calling Gemini", async () => {
        vi.mocked(prisma.aIUsageLog.count).mockResolvedValueOnce(30);

        const result = await executeAIChat({
            userId: "user-1",
            conversationId: "convo-3",
            messages: [{ role: "user", content: "One more question" }],
        });

        expect(result.modelUsed).toBe("limit-enforcer");
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
