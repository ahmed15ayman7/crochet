import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { objectIdSchema } from "@/lib/validations/object-id";
import { updateCourseBodySchema } from "@/lib/validations/course";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get one course by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   patch:
 *     tags: [Courses]
 *     summary: Update a course (ADMIN)
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course (ADMIN)
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const course = await prisma.course.findUnique({
    where: { id: idParsed.data },
  });
  if (!course) return jsonError("Course not found", 404);
  return NextResponse.json({ course });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = updateCourseBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (Object.keys(parsed.data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const existing = await prisma.course.findUnique({
    where: { id: idParsed.data },
  });
  if (!existing) return jsonError("Course not found", 404);

  const course = await prisma.course.update({
    where: { id: idParsed.data },
    data: parsed.data,
  });

  return NextResponse.json({ course });
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const existing = await prisma.course.findUnique({
    where: { id: idParsed.data },
  });
  if (!existing) return jsonError("Course not found", 404);

  await prisma.course.delete({ where: { id: idParsed.data } });
  return NextResponse.json({ message: "Course deleted" });
}
