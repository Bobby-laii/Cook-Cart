import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
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
        { error: "Validation failed: " + result.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { email, password, name, dietaryRestrictions, allergies, preferredLanguage } = result.data;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "CUSTOMER", // Registration defaults to Customer role
        dietaryRestrictions,
        allergies,
        preferredLanguage,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "CUSTOMER",
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
