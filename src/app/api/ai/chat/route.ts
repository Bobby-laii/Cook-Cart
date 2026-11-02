import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { executeAIChat } from "@/lib/ai/aiService";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(12000),
  timestamp: z.string().optional(),
  structuredSuggestions: z.any().optional(),
});

const chatRequestSchema = z.object({
  conversationId: z.string().max(120).optional(),
  messages: z.array(chatMessageSchema).min(1).max(100),
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

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
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

    const { conversationId, messages, quickStartData } = parsed.data;
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
          chefName: user.chefName || "Chef Cart",
          chefAvatarUrl: user.chefAvatarUrl || "🧑‍🍳",
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

    // Call the unified AI service module
    const aiResponse = await executeAIChat({
      userId: session?.userId,
      conversationId: convoId,
      messages,
      quickStartData,
      chefProfile,
    });

    // If user is authenticated, persist conversation to database (verified ownership)
    if (session?.userId) {
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
          messages.find((m) => m.role === "user")?.content ||
          "Cooking consultation";
        const title = quickStartData?.cuisine
          ? `${quickStartData.cuisine} - ${quickStartData.ingredients?.slice(0, 2).join(", ") || "Meal"}`
          : firstUserMsg.slice(0, 30);

        if (existingConvo && existingConvo.userId === session.userId) {
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
              userId: session.userId,
              title,
              cuisine: quickStartData?.cuisine || "Cantonese",
              ingredients: JSON.stringify(quickStartData?.ingredients || []),
              messages: JSON.stringify(fullMessages),
            },
          });
        }
      } catch (dbError) {
        console.warn("Could not persist conversation to DB:", dbError);
      }
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
