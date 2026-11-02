import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, hasRole } from "../src/lib/auth";

describe("Stage 1: Authentication & RBAC Core Logic", () => {
  it("should securely hash and verify passwords", async () => {
    const password = "TestPassword123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify JWT session tokens", async () => {
    const sessionPayload = {
      userId: "user_test_123",
      email: "test@cookcart.hk",
      name: "Test User",
      role: "CUSTOMER" as const,
    };

    const token = await createSessionToken(sessionPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.null;
    expect(verified?.userId).toBe(sessionPayload.userId);
    expect(verified?.email).toBe(sessionPayload.email);
    expect(verified?.role).toBe("CUSTOMER");
  });

  it("should enforce Role-Based Access Control rules correctly", () => {
    const customerSession = { userId: "1", email: "c@cookcart.hk", name: "C", role: "CUSTOMER" as const };
    const partnerSession = { userId: "2", email: "s@cookcart.hk", name: "S", role: "STORE_PARTNER" as const };
    const adminSession = { userId: "3", email: "a@cookcart.hk", name: "A", role: "ADMIN" as const };

    expect(hasRole(customerSession, ["CUSTOMER"])).toBe(true);
    expect(hasRole(customerSession, ["ADMIN"])).toBe(false);
    expect(hasRole(customerSession, ["STORE_PARTNER"])).toBe(false);

    expect(hasRole(partnerSession, ["STORE_PARTNER", "ADMIN"])).toBe(true);
    expect(hasRole(partnerSession, ["ADMIN"])).toBe(false);

    expect(hasRole(adminSession, ["ADMIN"])).toBe(true);
    expect(hasRole(adminSession, ["STORE_PARTNER", "ADMIN"])).toBe(true);
  });
});
