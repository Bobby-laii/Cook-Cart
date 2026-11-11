import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { recordUserFeedbackScore } from "@/lib/ai/observability";
import { z } from "zod";

const feedbackSchema = z.object({
  traceId: z.string().max(160).optional(),
  conversationId: z.string().max(120).optional(),
  dishTitle: z.string().max(160).optional(),
  rating: z.enum(["up", "down"]),
  comment: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await recordUserFeedbackScore({
      ...parsed.data,
      userId: session?.userId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to record feedback: " + (err?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
