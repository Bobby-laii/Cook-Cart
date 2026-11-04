import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        dietaryRestrictions: true,
        allergies: true,
        preferredLanguage: true,
        chefName: true,
        chefAvatarUrl: true,
        chefAvatarConfig: true,
        chefPersonality: true,
        onboardingCompleted: true,
        partnerStore: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (user) {
      return NextResponse.json({ user });
    }

    // Serverless isolate resilience: if the verified JWT session is valid but this
    // isolate's in-memory fallback store hasn't seen the user yet, reconstruct from
    // the signed JWT claims so the user is never logged out mid-session.
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        dietaryRestrictions: session.dietaryRestrictions ?? "",
        allergies: session.allergies ?? "",
        preferredLanguage: session.preferredLanguage ?? "en",
        chefName: session.chefName ?? "Chef Cart",
        chefAvatarUrl: session.chefAvatarUrl ?? "🧑‍🍳",
        chefAvatarConfig: session.chefAvatarConfig ?? null,
        chefPersonality: session.chefPersonality ?? "friendly",
        onboardingCompleted: session.onboardingCompleted ?? true,
        partnerStore: null,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null });
  }
}
