import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ conversations: [] });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If a specific conversation ID is requested, return its full message history
    // strictly scoped to the authenticated owner.
    if (id) {
      const conversation = await prisma.chatConversation.findFirst({
        where: {
          id,
          userId: session.userId,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      let parsedMessages: unknown[] = [];
      try {
        parsedMessages = JSON.parse(conversation.messages);
      } catch {
        parsedMessages = [];
      }

      return NextResponse.json({
        conversation: {
          id: conversation.id,
          title: conversation.title,
          cuisine: conversation.cuisine,
          messages: parsedMessages,
          updatedAt: conversation.updatedAt,
        },
      });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        cuisine: true,
        ingredients: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 25,
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing conversation id" },
        { status: 400 }
      );
    }

    await prisma.chatConversation.deleteMany({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
