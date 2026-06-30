import {
  describe,
  expect,
  it,
} from "vitest";

import { hashPassword, verifyPassword } from "@/utils/password";

const password = "Password123";

describe("password utilities", () => {
  it("hashes a password using the expected scrypt format", async () => {
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
  });

  it("does not return the plaintext password as the hash", async () => {
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).not.toContain(password);
  });

  it("generates a different hash for the same password because each hash has a unique salt", async () => {
    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it("verifies the correct password", async () => {
    const passwordHash = await hashPassword(password);

    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await hashPassword(password);

    await expect(verifyPassword("WrongPassword123", passwordHash)).resolves.toBe(
      false
    );
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword(password, "not-a-valid-hash")).resolves.toBe(false);
    await expect(verifyPassword(password, "bcrypt:salt:key")).resolves.toBe(false);
    await expect(verifyPassword(password, "scrypt::key")).resolves.toBe(false);
    await expect(verifyPassword(password, "scrypt:salt:")).resolves.toBe(false);
  });
});
