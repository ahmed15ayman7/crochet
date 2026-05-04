import { z } from "zod";

export const createCourseBodySchema = z.object({
  title: z.string().min(1),
  videoUrl: z.string().url("videoUrl must be a valid URL"),
  detailedDescription: z.string().min(1),
  additionalNotes: z.string().optional().nullable(),
});

export const updateCourseBodySchema = createCourseBodySchema.partial();

export type CreateCourseBody = z.infer<typeof createCourseBodySchema>;
export type UpdateCourseBody = z.infer<typeof updateCourseBodySchema>;
