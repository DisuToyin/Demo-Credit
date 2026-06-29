import { z } from "zod";

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int("page must be an integer.")
      .positive("page must be greater than 0.")
      .default(1),
    limit: z.coerce
      .number()
      .int("limit must be an integer.")
      .min(1, "limit must be at least 1.")
      .max(100, "limit must not exceed 100.")
      .default(20),
  }),
});

export type ListTransactionsSchema = z.infer<typeof listTransactionsSchema>;
