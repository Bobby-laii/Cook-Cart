/**
 * Build-time database preparation script for CookCart (Bon Taste).
 *
 * Works seamlessly across both:
 * 1. Local development / CI (SQLite via `file:./dev.db`)
 * 2. Vercel Serverless + Prisma Postgres (`postgres://`, `postgresql://`, or `prisma+postgres://`)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");

const candidateUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

const isPostgres =
  candidateUrl.startsWith("postgres://") ||
  candidateUrl.startsWith("postgresql://") ||
  candidateUrl.startsWith("prisma+postgres://");

if (isPostgres) {
  console.log("[prepare-db] Detected PostgreSQL connection URL in environment.");
  if (!process.env.DATABASE_URL && candidateUrl) {
    process.env.DATABASE_URL = candidateUrl;
    const envProdPath = path.join(rootDir, ".env.production.local");
    try {
      fs.appendFileSync(envProdPath, `\nDATABASE_URL="${candidateUrl}"\n`);
    } catch {
      // Ignore read-only fs errors
    }
  }

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    if (schema.includes('provider = "sqlite"')) {
      const updated = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, updated, "utf8");
      console.log("[prepare-db] Updated prisma/schema.prisma provider to postgresql.");
    }
  }

  try {
    console.log("[prepare-db] Pushing Prisma schema to PostgreSQL...");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: candidateUrl },
    });
  } catch (err) {
    console.warn("[prepare-db] prisma db push skipped or non-fatal warning:", err?.message || err);
  }
} else {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
  console.log("[prepare-db] Using SQLite schema for local/CI build.");
}

