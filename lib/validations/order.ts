import { z } from "zod";

import { OrderStatus } from "@prisma/client";

export const createOrderBodySchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "At least one product id"),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const checkoutBodySchema = z.object({
  orderId: z.string().min(1),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

export const patchOrderBodySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  productIds: z.array(z.string().min(1)).min(1).optional(),
});

export type PatchOrderBody = z.infer<typeof patchOrderBodySchema>;

export const ordersListQuerySchema = z.object({
  scope: z.enum(["all"]).optional(),
});
