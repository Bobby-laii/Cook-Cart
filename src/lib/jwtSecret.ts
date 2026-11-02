/**
 * Centralised JWT secret accessor.
 *
 * Edge-runtime safe on purpose: this module must NOT import bcryptjs or Prisma,
 * because it is consumed by `src/middleware.ts`.
 *
 * SECURITY NOTE
 * -------------
 * There is deliberately NO hardcoded fallback secret. A fallback committed to the
 * repository means that if the environment variable is ever missing (misconfigured
 * deploy, forgotten secret manager entry), the app silently keeps running with a
 * secret that is public knowledge — and anyone can forge a session token with
 * `role: "ADMIN"`. Failing loudly is the safe behaviour.
 */

const MIN_SECRET_LENGTH = 32;

export function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error(
            "JWT_SECRET is not set. Add it to .env (generate one with: openssl rand -base64 48) before starting CookCart."
        );
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
