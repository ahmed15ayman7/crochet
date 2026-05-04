import { z } from "zod";

import { passwordMeetsPolicy, passwordPolicyMessage } from "@/lib/password";

export const registerBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .refine(passwordMeetsPolicy, { message: passwordPolicyMessage }),
});

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
