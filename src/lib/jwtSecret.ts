/**
 * Centralised JWT secret accessor.
 *
 * Edge-runtime safe on purpose: this module must NOT import bcryptjs or Prisma,
 * because it is consumed by `src/middleware.ts`.
 *
 * IMPORTANT: When `process.env.JWT_SECRET` is not explicitly configured in Vercel,
 * the fallback derivation MUST NOT depend on `process.env.DATABASE_URL` or any
 * variable that differs between the Vercel Edge Runtime (`src/middleware.ts`) and
 * the Node.js Runtime (`/api/auth/*`), otherwise tokens signed in `/api/auth/login`
 * or `/api/auth/register` will fail `jwtVerify` in `src/middleware.ts`.
 */

const MIN_SECRET_LENGTH = 32;

function deriveDeploymentSecret(): string {
    const seed = "cookcart-bontaste-jwt-signing-key-v2-salt-9f8e7d6c5b4a3f2e1d0c";
    const chunks: string[] = [];
    for (let round = 0; round < 8; round++) {
        let h = (0x811c9dc5 ^ (round * 0x9e3779b9)) >>> 0;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i) + round;
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
