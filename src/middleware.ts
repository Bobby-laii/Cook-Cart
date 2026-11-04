import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { tryGetJwtSecret } from "@/lib/jwtSecret";

const COOKIE_NAME = "cookcart_session";

/**
 * Pages that need a signed-in user: chef chat, saved recipes, chef settings and
 * onboarding. Every signed-in role may open them, so there is no role check here.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Missing or invalid JWT_SECRET is a server misconfiguration. Fail closed with
  // an opaque server error instead of letting the request through unauthenticated.
  const jwtSecret = tryGetJwtSecret();
  if (!jwtSecret) {
    console.error(
      "middleware: JWT_SECRET is missing or too short. Refusing to authorize protected routes."
    );
    return new NextResponse("Server misconfiguration: authentication is unavailable.", {
      status: 500,
    });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, jwtSecret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/my-recipes/:path*",
    "/chef-settings/:path*",
    "/onboarding/:path*",
  ],
};
