import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please enter a valid email and a password of at least 6 characters." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { partnerStore: true },
    });

    if (user) {
      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "That email and password don't match." },
          { status: 401 }
        );
      }
    } else {
      // If the user is signing in on a fresh serverless isolate (or signing in for the
      // first time directly from the Sign In form), provision their account seamlessly.
      const defaultName = normalizedEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: defaultName || "Home Cook",
          role: "CUSTOMER",
          dietaryRestrictions: "",
          allergies: "",
          preferredLanguage: "en",
          chefName: "Chef Ah Fei",
          chefAvatarUrl: "🧑‍🍳",
          chefPersonality: "friendly",
          onboardingCompleted: true,
        },
        include: { partnerStore: true },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      storeId: user.partnerStore?.id,
      dietaryRestrictions: user.dietaryRestrictions ?? "",
      allergies: user.allergies ?? "",
      preferredLanguage: user.preferredLanguage ?? "en",
      chefName: user.chefName ?? "Chef Ah Fei",
      chefAvatarUrl: user.chefAvatarUrl ?? "🧑‍🍳",
      chefAvatarConfig: user.chefAvatarConfig ?? null,
      chefPersonality: user.chefPersonality ?? "friendly",
      onboardingCompleted: Boolean(user.onboardingCompleted ?? true),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.partnerStore?.id,
        dietaryRestrictions: user.dietaryRestrictions,
        allergies: user.allergies,
        chefName: user.chefName,
        chefAvatarUrl: user.chefAvatarUrl,
        chefAvatarConfig: user.chefAvatarConfig,
        chefPersonality: user.chefPersonality,
        onboardingCompleted: Boolean(user.onboardingCompleted ?? true),
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
