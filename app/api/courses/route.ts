import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-route";
import { readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createCourseBodySchema } from "@/lib/validations/course";

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     summary: List all courses (full records)
 *     responses:
 *       200:
 *         description: Course list
 *   post:
 *     tags: [Courses]
 *     summary: Create a course (ADMIN)
 *     security:
 *       - bearerAuth: []
 */
export async function GET() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = createCourseBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      videoUrl: parsed.data.videoUrl,
      detailedDescription: parsed.data.detailedDescription,
      additionalNotes: parsed.data.additionalNotes ?? null,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
