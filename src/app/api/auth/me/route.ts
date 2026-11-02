import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
            nameZh: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null });
  }
}
