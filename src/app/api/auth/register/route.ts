import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  dietaryRestrictions: z.string().optional().default(""),
  allergies: z.string().optional().default(""),
  preferredLanguage: z.string().optional().default("en"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed: " + result.error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { email, password, name, dietaryRestrictions, allergies, preferredLanguage } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let user;
    if (existing) {
      // If the user already registered with this password, sign them in smoothly
      const isSamePassword = await verifyPassword(password, existing.passwordHash);
      if (!isSamePassword) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in instead." },
          { status: 409 }
        );
      }
      user = existing;
    } else {
      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          role: "CUSTOMER",
          dietaryRestrictions,
          allergies,
          preferredLanguage,
          onboardingCompleted: false,
        },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: (user.role as any) || "CUSTOMER",
      dietaryRestrictions: user.dietaryRestrictions ?? "",
      allergies: user.allergies ?? "",
      preferredLanguage: user.preferredLanguage ?? "en",
      chefName: user.chefName ?? "Chef Cart",
      chefAvatarUrl: user.chefAvatarUrl ?? "🧑‍🍳",
      chefAvatarConfig: user.chefAvatarConfig ?? null,
      chefPersonality: user.chefPersonality ?? "friendly",
      onboardingCompleted: Boolean(user.onboardingCompleted ?? false),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dietaryRestrictions: user.dietaryRestrictions,
        allergies: user.allergies,
        chefName: user.chefName,
        chefAvatarUrl: user.chefAvatarUrl,
        chefAvatarConfig: user.chefAvatarConfig,
        chefPersonality: user.chefPersonality,
        onboardingCompleted: Boolean(user.onboardingCompleted ?? false),
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
