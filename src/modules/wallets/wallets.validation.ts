import { z } from "zod";

export const fundWalletSchema = z.object({
  body: z.object({
    amount: z
      .number("amount is required.")
      .int("amount must be an integer in kobo.")
      .positive("amount must be greater than 0."),
    description: z
      .string()
      .trim()
      .max(255, "description must not exceed 255 characters.")
      .optional(),
  }),
});

export const withdrawWalletSchema = z.object({
  body: z.object({
    amount: z
      .number("amount is required.")
      .int("amount must be an integer in kobo.")
      .positive("amount must be greater than 0."),
    description: z
      .string()
      .trim()
      .max(255, "description must not exceed 255 characters.")
      .optional(),
  }),
});

export type FundWalletSchema = z.infer<typeof fundWalletSchema>;
export type WithdrawWalletSchema = z.infer<typeof withdrawWalletSchema>;
