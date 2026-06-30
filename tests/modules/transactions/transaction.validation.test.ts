import {
  describe,
  expect,
  it,
} from "vitest";

import { listTransactionsSchema } from "@/modules/transactions/transaction.validation";

describe("transaction validation schemas", () => {
  it("defaults pagination query values", () => {
    const result = listTransactionsSchema.parse({
      query: {},
    });

    expect(result.query).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it("coerces valid pagination query strings into numbers", () => {
    const result = listTransactionsSchema.parse({
      query: {
        page: "2",
        limit: "50",
      },
    });

    expect(result.query).toEqual({
      page: 2,
      limit: 50,
    });
  });

  it("rejects page below 1", () => {
    const result = listTransactionsSchema.safeParse({
      query: {
        page: "0",
        limit: "20",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = listTransactionsSchema.safeParse({
      query: {
        page: "1",
        limit: "101",
      },
    });

    expect(result.success).toBe(false);
  });
});
