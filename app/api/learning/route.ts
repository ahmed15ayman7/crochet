import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-route";
import {
  jsonError,
  readJsonBody,
  zodErrorResponse,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  createCourseBodySchema,
  updateCourseBodySchema,
} from "@/lib/validations/course";
import {
  learningPatchQuerySchema,
  learningQuerySchema,
} from "@/lib/validations/learning";

/**
 * @openapi
 * /api/learning:
 *   get:
 *     tags: [Learning]
 *     summary: Fetch course video and detailed description (public)
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the course (optional; omit to list all)
 *     responses:
 *       200:
 *         description: Course content or list
 *       400:
 *         description: Invalid query
 *       404:
 *         description: Course not found
 *   post:
 *     tags: [Learning]
 *     summary: Create course content (ADMIN) — same payload as POST /api/courses
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags: [Learning]
 *     summary: Update course content (ADMIN). Query courseId required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ObjectId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = {
    courseId: searchParams.get("courseId") || undefined,
  };
  const parsed = learningQuerySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { courseId } = parsed.data;

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        videoUrl: true,
        detailedDescription: true,
        title: true,
        additionalNotes: true,
      },
    });
    if (!course) return jsonError("Course not found", 404);
    return NextResponse.json(course);
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      detailedDescription: true,
    },
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

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = learningPatchQuerySchema.safeParse({
    courseId: searchParams.get("courseId") || undefined,
  });
  if (!q.success) return zodErrorResponse(q.error);

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = updateCourseBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (Object.keys(parsed.data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const existing = await prisma.course.findUnique({
    where: { id: q.data.courseId },
  });
  if (!existing) return jsonError("Course not found", 404);

  const course = await prisma.course.update({
    where: { id: q.data.courseId },
    data: parsed.data,
  });

  return NextResponse.json({ course });
}
