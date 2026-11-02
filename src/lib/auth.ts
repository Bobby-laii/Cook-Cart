import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/types";
import { prisma } from "./prisma";
import { getJwtSecret } from "./jwtSecret";

export const COOKIE_NAME = "cookcart_session";

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT token containing user session claims
 */
export async function createSessionToken(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

/**
 * Verify a JWT session token and return user session claims
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

/**
 * Get current session from incoming cookies (usable in Server Components & Server Actions)
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Get current user entity from database
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      partnerStore: true,
    },
  });
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(session: UserSession | null, allowedRoles: UserRole[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
