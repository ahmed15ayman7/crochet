import { z } from "zod";

import { passwordMeetsPolicy, passwordPolicyMessage } from "@/lib/password";

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z
    .string()
    .refine(passwordMeetsPolicy, { message: passwordPolicyMessage }),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .refine(passwordMeetsPolicy, { message: passwordPolicyMessage }),
});
