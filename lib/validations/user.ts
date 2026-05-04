import { z } from "zod";

import { UserRole } from "@prisma/client";

export const patchMeBodySchema = z.object({
  name: z.string().min(1).optional(),
});

export const patchUserByIdBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
});
