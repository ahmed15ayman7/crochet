import { z } from "zod";

export const createProductBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().url("imageUrl must be a valid URL"),
  category: z.string().min(1),
});

export const updateProductBodySchema = createProductBodySchema.partial();

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
