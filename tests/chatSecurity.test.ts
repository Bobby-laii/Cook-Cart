import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Security regression suite for:
 *  - POST /api/ai/chat          (auth, conversation IDOR prevention)
 *  - GET  /api/ai/conversations (single thread history scoped to owner)
 */

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  userFindUnique: vi.fn(),
  chatConvoFindUnique: vi.fn(),
  chatConvoFindFirst: vi.fn(),
  chatConvoFindMany: vi.fn(),
  chatConvoUpdate: vi.fn(),
  chatConvoCreate: vi.fn(),
  executeAIChat: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/lib/ai/aiService", () => ({
  executeAIChat: mocks.executeAIChat,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    chatConversation: {
      findUnique: mocks.chatConvoFindUnique,
      findFirst: mocks.chatConvoFindFirst,
      findMany: mocks.chatConvoFindMany,
      update: mocks.chatConvoUpdate,
      create: mocks.chatConvoCreate,
    },
  },
}));

import * as chatRoute from "@/app/api/ai/chat/route";
import * as convosRoute from "@/app/api/ai/conversations/route";

const CUSTOMER = {
  userId: "cust-1",
  email: "cust1@cookcart.test",
  name: "Alice",
  role: "CUSTOMER" as const,
};

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentSession.mockResolvedValue(null);
});

describe("POST /api/ai/chat & GET /api/ai/conversations — Conversation IDOR Protection", () => {
  it("rejects an anonymous chat with 401 and never calls the AI", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const res = await chatRoute.POST(
      postJson("http://localhost/api/ai/chat", {
        messages: [{ role: "user", content: "What can I cook?" }],
      })
    );

    // Without a user the daily message limit cannot be counted, so the AI must not run.
    expect(res.status).toBe(401);
    expect(mocks.executeAIChat).not.toHaveBeenCalled();
  });

  it("allocates a new conversationId if user tries to overwrite another user's conversation", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.userFindUnique.mockResolvedValue({
      chefName: "Chef Mei",
      chefAvatarUrl: null,
      chefPersonality: "friendly",
    });
    // Existing conversation belongs to someone else!
    mocks.chatConvoFindUnique.mockImplementation(async ({ where }: any) => {
      if (where.id === "victim_convo_id") {
        return { id: "victim_convo_id", userId: "other-user-999" };
      }
      return null;
    });
    mocks.executeAIChat.mockResolvedValue({
      message: "Hello!",
      tokensUsed: { prompt: 10, completion: 10, total: 20 },
      modelUsed: "test-model",
    });

    const res = await chatRoute.POST(
      postJson("http://localhost/api/ai/chat", {
        conversationId: "victim_convo_id",
        messages: [{ role: "user", content: "Hijack attempt" }],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.conversationId).not.toBe("victim_convo_id");
    expect(mocks.chatConvoUpdate).not.toHaveBeenCalled();
    expect(mocks.chatConvoCreate).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when requesting another user's conversation via GET /api/ai/conversations?id=...", async () => {
    mocks.getCurrentSession.mockResolvedValue(CUSTOMER);
    mocks.chatConvoFindFirst.mockResolvedValue(null);

    const res = await convosRoute.GET(
      new Request("http://localhost/api/ai/conversations?id=victim_convo_id")
    );
    expect(res.status).toBe(404);
  });
});

