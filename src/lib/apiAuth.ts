/**
 * Shared route-level authorization helpers.
 *
 * Rationale: `src/middleware.ts` only matches page routes and a small number of
 * API prefixes. Every API handler must therefore enforce its own authorization.
 * Having one helper (instead of copy-pasted checks, some of which were empty
 * `if` blocks) makes the policy reviewable in a single place.
 */

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, UserSession } from "@/types";

export type RequireRoleResult =
    | { ok: true; session: UserSession }
    | { ok: false; response: NextResponse };

/**
 * Require an authenticated session with one of the given roles.
 * Returns 401 when unauthenticated, 403 when authenticated but unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<RequireRoleResult> {
    const session = await getCurrentSession();

    if (!session) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
        };
    }

    if (!allowedRoles.includes(session.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Forbidden: your role does not permit this action" },
                { status: 403 }
            ),
        };
    }

    return { ok: true, session };
}

/**
 * Require any authenticated user (any role).
 */
export async function requireAuth(): Promise<RequireRoleResult> {
    return requireRole(["CUSTOMER", "STORE_PARTNER", "ADMIN"]);
}

/**
 * Resolve the store a STORE_PARTNER is bound to.
 *
 * The JWT only carries `storeId` if it was present at login time, so this falls
 * back to the database and verifies the binding still exists. Returns null when
 * the partner has no assigned store — callers must treat that as forbidden.
 */
export async function getPartnerStoreId(session: UserSession): Promise<string | null> {
    if (session.storeId) {
        const store = await prisma.store.findFirst({
            where: { id: session.storeId, partnerUserId: session.userId },
            select: { id: true },
        });
        if (store) return store.id;
    }

    const store = await prisma.store.findFirst({
        where: { partnerUserId: session.userId },
        select: { id: true },
    });

    return store?.id ?? null;
}
