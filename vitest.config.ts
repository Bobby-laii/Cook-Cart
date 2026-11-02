import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    // Mirror the `@/*` -> `./src/*` alias from tsconfig.json. Next.js resolves this
    // through its own bundler, so without this Vitest cannot load any module that
    // imports via `@/`, and those suites fail at collection time.
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        // Loading .env is required now that JWT_SECRET has no hardcoded fallback:
        // getJwtSecret() throws rather than silently signing with a public constant.
        setupFiles: ["./tests/setupEnv.ts"],
        // Prisma's client and the AI service hold module-level state; give each file
        // its own process so one suite's env mutations cannot leak into another.
        isolate: true,
    },
});
