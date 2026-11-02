/**
 * Test environment bootstrap.
 *
 * `JWT_SECRET` deliberately has no fallback in the application code — a missing
 * secret is a hard startup error rather than a silent downgrade to a public
 * constant. Tests therefore supply their own throwaway value with the same
 * minimum-length requirements the runtime enforces.
 */
if (!process.env.JWT_SECRET) {
    // 64 chars of obviously-fake test entropy. Never valid outside a test run.
    process.env.JWT_SECRET =
        "test-only-jwt-secret-do-not-use-outside-tests-0123456789abcdef";
}

// Tests must never reach a paid AI provider. Absent keys make the services take
// their local/offline paths deterministically.
delete process.env.GEMINI_API_KEY;
delete process.env.OPENAI_API_KEY;
