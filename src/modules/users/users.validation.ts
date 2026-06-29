import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    first_name: z
      .string()
      .trim()
      .min(1, "first_name is required.")
      .max(100, "first_name must not exceed 100 characters."),
    last_name: z
      .string()
      .trim()
      .min(1, "last_name is required.")
      .max(100, "last_name must not exceed 100 characters."),
    email: z.email("email must be a valid email address.")
      .max(255, "email must not exceed 255 characters."),
    phone_number: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{6,29}$/, "phone_number must be a valid phone number."),
    bvn: z.string().trim().regex(/^\d{11}$/, "bvn must be 11 digits."),
    password: z
      .string()
      .min(8, "password must be at least 8 characters.")
      .max(72, "password must not exceed 72 characters."),
  }),
});

export type SignupSchema = z.infer<typeof signupSchema>;
