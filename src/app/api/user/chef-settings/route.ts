import { NextResponse } from "next/server";
import { COOKIE_NAME, createSessionToken, getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPersonality, sanitizeChefAvatarConfig } from "@/lib/avatar/chefAvatar";

const MAX_CHEF_NAME = 30;
const MAX_EMOJI_LENGTH = 16;

/**
 * Updates the signed-in user's personal chef.
 * Only fields present in the body are changed, so partial updates (e.g. the onboarding
 * "skip" button sending just { completeOnboarding: true }) don't reset other settings.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { chefName, chefAvatarUrl, chefPersonality, chefAvatarConfig, completeOnboarding } = body as Record<string, unknown>;
    const data: {
      chefName?: string;
      chefAvatarUrl?: string;
      chefPersonality?: string;
      chefAvatarConfig?: string | null;
      onboardingCompleted?: boolean;
    } = {};

    if (chefName !== undefined) {
      if (typeof chefName !== "string") {
        return NextResponse.json({ error: "chefName must be a string" }, { status: 400 });
      }
      data.chefName = chefName.trim().slice(0, MAX_CHEF_NAME) || "Your chef";
    }

    if (chefAvatarUrl !== undefined) {
      if (typeof chefAvatarUrl !== "string") {
        return NextResponse.json({ error: "chefAvatarUrl must be a string" }, { status: 400 });
      }
      data.chefAvatarUrl = chefAvatarUrl.trim().slice(0, MAX_EMOJI_LENGTH) || "🧑‍🍳";
    }

    if (chefPersonality !== undefined) {
      if (!isValidPersonality(chefPersonality)) {
        return NextResponse.json({ error: "Unknown chef personality" }, { status: 400 });
      }
      data.chefPersonality = chefPersonality;
    }

    if (chefAvatarConfig !== undefined) {
      data.chefAvatarConfig = chefAvatarConfig === null ? null : JSON.stringify(sanitizeChefAvatarConfig(chefAvatarConfig));
    }

    if (completeOnboarding === true) {
      data.onboardingCompleted = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        name: true,
        chefName: true,
        chefAvatarUrl: true,
        chefAvatarConfig: true,
        chefPersonality: true,
        onboardingCompleted: true,
      },
    });

    const refreshedToken = await createSessionToken({
      ...session,
      chefName: updatedUser.chefName ?? session.chefName,
      chefAvatarUrl: updatedUser.chefAvatarUrl ?? session.chefAvatarUrl,
      chefAvatarConfig: updatedUser.chefAvatarConfig ?? session.chefAvatarConfig,
      chefPersonality: updatedUser.chefPersonality ?? session.chefPersonality,
      onboardingCompleted: Boolean(updatedUser.onboardingCompleted ?? session.onboardingCompleted ?? true),
    });

    const response = NextResponse.json({ success: true, user: updatedUser });
    response.cookies.set({
      name: COOKIE_NAME,
      value: refreshedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Chef settings update error:", error);
    return NextResponse.json({ error: "Failed to update chef settings" }, { status: 500 });
  }
}
