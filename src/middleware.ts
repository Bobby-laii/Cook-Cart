import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { tryGetJwtSecret } from "@/lib/jwtSecret";

const COOKIE_NAME = "cookcart_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect Admin routes
  const isAdminRoute = pathname.startsWith("/admin");
  // Protect Store Partner routes
  const isStorePartnerRoute = pathname.startsWith("/store-partner");
  // Protect authenticated user routes (chef chat, cart checkout, order history, chef settings)
  const isUserProtectedRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/my-recipes") ||
    pathname.startsWith("/chef-settings") ||
    pathname.startsWith("/onboarding");

  if (!isAdminRoute && !isStorePartnerRoute && !isUserProtectedRoute) {
    return NextResponse.next();
  }

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

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    const role = payload.role as string | undefined;

    // RBAC: Admin routes require ADMIN role
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // RBAC: Store Partner routes require STORE_PARTNER or ADMIN role
    if (isStorePartnerRoute && role !== "STORE_PARTNER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/admin/:path*",
    "/store-partner/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/my-recipes/:path*",
    "/chef-settings/:path*",
    "/onboarding/:path*",
  ],
};
