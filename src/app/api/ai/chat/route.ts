import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { executeAIChat, executeAIChatStream, type AIChatMessage, type AIResponsePayload } from "@/lib/ai/aiService";
import { sanitizeConversationHistory } from "@/lib/ai/promptSecurity";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const chatMessageSchema = z.object({
  // Client messages may only be "user" or "assistant"; "system" is accepted at schema level
  // only to avoid breaking legacy history arrays, and is immediately stripped by sanitizeConversationHistory.
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(12000),
  timestamp: z.string().optional(),
  structuredSuggestions: z.any().optional(),
});

const chatRequestSchema = z.object({
  conversationId: z.string().max(120).optional(),
  messages: z.array(chatMessageSchema).min(1).max(100),
  stream: z.boolean().optional(),
  quickStartData: z
    .object({
      cuisine: z.string().max(100).optional(),
      ingredients: z.array(z.string().max(100)).max(30).optional(),
      servings: z.number().int().min(1).max(50).optional(),
      cookingTimeLimit: z.string().max(50).optional(),
      skillLevel: z.string().max(50).optional(),
      equipment: z.array(z.string().max(50)).max(20).optional(),
      dietary: z.string().max(200).optional(),
      allergies: z.string().max(200).optional(),
    })
    .optional(),
});

async function persistConversationToDb(params: {
  userId: string;
  convoId: string;
  messages: AIChatMessage[];
  quickStartData?: z.infer<typeof chatRequestSchema>["quickStartData"];
  aiResponse: AIResponsePayload;
}) {
  const { userId, convoId, messages, quickStartData, aiResponse } = params;
  try {
    const fullMessages = [
      ...messages,
      {
        role: "assistant" as const,
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
        structuredSuggestions: aiResponse.structuredSuggestions,
      },
    ];

    const existingConvo = await prisma.chatConversation.findUnique({
      where: { id: convoId },
      select: { id: true, userId: true, cuisine: true, ingredients: true },
    });

    const firstUserMsg =
      messages.find((m) => m.role === "user")?.content || "Cooking consultation";
    const title = quickStartData?.cuisine
      ? `${quickStartData.cuisine} - ${quickStartData.ingredients?.slice(0, 2).join(", ") || "Meal"}`
      : firstUserMsg.slice(0, 30);

    if (existingConvo && existingConvo.userId === userId) {
      await prisma.chatConversation.update({
        where: { id: convoId },
        data: {
          messages: JSON.stringify(fullMessages),
          cuisine: quickStartData?.cuisine || existingConvo.cuisine,
          ingredients: quickStartData?.ingredients
            ? JSON.stringify(quickStartData.ingredients)
            : existingConvo.ingredients,
        },
      });
    } else if (!existingConvo) {
      await prisma.chatConversation.create({
        data: {
          id: convoId,
          userId,
          title,
          cuisine: quickStartData?.cuisine || "any",
          ingredients: JSON.stringify(quickStartData?.ingredients || []),
          messages: JSON.stringify(fullMessages),
        },
      });
    }
  } catch (dbError) {
    console.warn("Could not persist conversation to DB:", dbError);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    // The chef needs an account: the daily message limit is counted per user, and
    // the chef's look and personality are saved on the user. Recipes and cooking
    // mode stay open to everyone.
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in to chat with your chef" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid chat request payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Security: strip any client-injected "system" messages
    const cleanMessages = sanitizeConversationHistory(parsed.data.messages);
    if (!cleanMessages.some((m) => m.role === "user")) {
      return NextResponse.json(
        { error: "At least one user message is required" },
        { status: 400 }
      );
    }

    const { conversationId, quickStartData } = parsed.data;
    const wantsStream =
      parsed.data.stream === true ||
      req.headers?.get?.("accept")?.includes("text/event-stream") === true;

    let convoId =
      conversationId || "convo_" + Math.random().toString(36).substring(2, 9);

    // Fetch user's chef profile settings if authenticated
    let chefProfile:
      | { chefName?: string; chefAvatarUrl?: string; chefPersonality?: string }
      | undefined;

    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { chefName: true, chefAvatarUrl: true, chefPersonality: true },
      });
      if (user) {
        chefProfile = {
          chefName: user.chefName || "Your chef",
          chefAvatarUrl: user.chefAvatarUrl || undefined,
          chefPersonality: user.chefPersonality || "friendly",
        };
      }

      // IDOR prevention: if client passed an existing conversationId that belongs
      // to a different user, allocate a fresh ID rather than overwriting theirs.
      const existing = await prisma.chatConversation.findUnique({
        where: { id: convoId },
        select: { userId: true },
      });
      if (existing && existing.userId !== session.userId) {
        convoId = "convo_" + Math.random().toString(36).substring(2, 9);
      }
    }

    // Streaming SSE Mode (`stream: true` or `Accept: text/event-stream`)
    if (wantsStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            const generator = executeAIChatStream({
              userId: session.userId,
              conversationId: convoId,
              messages: cleanMessages,
              quickStartData,
              chefProfile,
              signal: req.signal,
            });

            let finalPayload: AIResponsePayload | undefined;
            for await (const ev of generator) {
              if (req.signal?.aborted) break;
              if (ev.type === "done") {
                finalPayload = ev.payload;
                sendEvent("done", {
                  success: true,
                  conversationId: convoId,
                  ...ev.payload,
                });
              } else {
                sendEvent(ev.type, ev);
              }
            }

            if (finalPayload && !req.signal?.aborted) {
              await persistConversationToDb({
                userId: session.userId,
                convoId,
                messages: cleanMessages,
                quickStartData,
                aiResponse: finalPayload,
              });
            }
          } catch (streamErr: any) {
            if (streamErr?.name !== "AbortError") {
              sendEvent("error", {
                error: "Failed to process AI cooking request: " + (streamErr?.message || "Unknown error"),
              });
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON Mode (default for backward-compatibility and existing unit tests)
    const aiResponse = await executeAIChat({
      userId: session?.userId,
      conversationId: convoId,
      messages: cleanMessages,
      quickStartData,
      chefProfile,
      signal: req.signal,
    });

    if (session?.userId) {
      await persistConversationToDb({
        userId: session.userId,
        convoId,
        messages: cleanMessages,
        quickStartData,
        aiResponse,
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: convoId,
      ...aiResponse,
    });
  } catch (err: any) {
    console.error("AI Chat API Error:", err);
    return NextResponse.json(
      { error: "Failed to process AI cooking request: " + err.message },
      { status: 500 }
    );
  }
}
