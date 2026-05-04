import { z } from "zod";

import { objectIdSchema } from "@/lib/validations/object-id";

export const learningQuerySchema = z.object({
  courseId: objectIdSchema.optional(),
});

export type LearningQuery = z.infer<typeof learningQuerySchema>;

export const learningPatchQuerySchema = z.object({
  courseId: objectIdSchema,
});
