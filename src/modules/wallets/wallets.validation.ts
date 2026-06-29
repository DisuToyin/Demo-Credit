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

export const transferFundsSchema = z.object({
  body: z.object({
    recipient_account_number: z
      .string("recipient_account_number is required.")
      .trim()
      .length(10, "recipient_account_number must be 10 digits.")
      .regex(/^\d+$/, "recipient_account_number must contain only digits."),
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
export type TransferFundsSchema = z.infer<typeof transferFundsSchema>;
