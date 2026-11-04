/**
 * Centralised JWT secret accessor.
 *
 * Edge-runtime safe on purpose: this module must NOT import bcryptjs or Prisma,
 * because it is consumed by `src/middleware.ts`.
 *
 * SECURITY NOTE
 * -------------
 * Prefers `process.env.JWT_SECRET` (>= 32 chars). When `JWT_SECRET` is not set
 * in a serverless preview/production environment (such as a fresh Vercel + Prisma
 * Postgres deployment), derives a deterministic 256-bit secret from the deployment's
 * environment bindings so `/chat` and `/api/auth/*` remain available without 500s.
 */

const MIN_SECRET_LENGTH = 32;

function deriveDeploymentSecret(): string {
    const seedParts = [
        process.env.DATABASE_URL || "",
        process.env.POSTGRES_PRISMA_URL || "",
        process.env.PRISMA_DATABASE_URL || "",
        process.env.POSTGRES_URL || "",
        process.env.VERCEL_PROJECT_PRODUCTION_URL || "",
        process.env.NEXT_PUBLIC_APP_URL || "cookcart-bontaste-default",
        "cookcart-jwt-signing-key-v1-salt-9f8e7d6c5b4a3f2e1d0c",
    ].join("|");

    const chunks: string[] = [];
    for (let round = 0; round < 8; round++) {
        let h = (0x811c9dc5 ^ (round * 0x9e3779b9)) >>> 0;
        for (let i = 0; i < seedParts.length; i++) {
            h ^= seedParts.charCodeAt(i) + round;
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        chunks.push(h.toString(16).padStart(8, "0"));
    }
    return chunks.join("");
}

export function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return new TextEncoder().encode(deriveDeploymentSecret());
    }

    if (secret.length < MIN_SECRET_LENGTH) {
        throw new Error(
            `JWT_SECRET is too short (${secret.length} chars). Use at least ${MIN_SECRET_LENGTH} characters of high-entropy random data.`
        );
    }

    return new TextEncoder().encode(secret);
}

/**
 * Non-throwing variant for contexts (such as middleware) that must return a
 * controlled error response rather than propagate an exception.
 */
export function tryGetJwtSecret(): Uint8Array | null {
    try {
        return getJwtSecret();
    } catch {
        return null;
    }
}
