import {
  describe,
  expect,
  it,
} from "vitest";

import {
  fundWalletSchema,
  transferFundsSchema,
  withdrawWalletSchema,
} from "@/modules/wallets/wallet.validation";

describe("wallet validation schemas", () => {
  it("accepts valid fund wallet data", () => {
    const result = fundWalletSchema.parse({
      body: {
        amount: 500000,
        description: "Test funding",
      },
    });

    expect(result.body.amount).toBe(500000);
  });

  it("rejects fund wallet amount that is not positive", () => {
    const result = fundWalletSchema.safeParse({
      body: {
        amount: 0,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects withdrawal amount that is not an integer", () => {
    const result = withdrawWalletSchema.safeParse({
      body: {
        amount: 100.5,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects descriptions longer than 255 characters", () => {
    const result = fundWalletSchema.safeParse({
      body: {
        amount: 500000,
        description: "x".repeat(256),
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid transfer data", () => {
    const result = transferFundsSchema.parse({
      body: {
        recipient_account_number: "1234567890",
        amount: 200000,
        description: "Test transfer",
      },
    });

    expect(result.body.recipient_account_number).toBe("1234567890");
  });

  it("rejects transfer account number that is not 10 digits", () => {
    const result = transferFundsSchema.safeParse({
      body: {
        recipient_account_number: "12345",
        amount: 200000,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects transfer account number with non-digits", () => {
    const result = transferFundsSchema.safeParse({
      body: {
        recipient_account_number: "12345abcde",
        amount: 200000,
      },
    });

    expect(result.success).toBe(false);
  });
});
