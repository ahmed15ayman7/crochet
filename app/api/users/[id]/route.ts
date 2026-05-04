import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/user-public";
import { objectIdSchema } from "@/lib/validations/object-id";
import {
  patchMeBodySchema,
  patchUserByIdBodySchema,
} from "@/lib/validations/user";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @openapi
 * /api/users/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: User MongoDB ObjectId (24 hex chars)
 *   get:
 *     tags: [Users]
 *     summary: Get user by id (self or ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserEnvelope'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to view this user
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: ADMIN can update name, email, role. Users can update only their own name.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserEnvelope'
 *       400:
 *         description: Validation error or no fields to update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden for this user/id combination
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (ADMIN only, not yourself)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not admin
 *       404:
 *         description: User not found
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  if (auth.claims.role !== "ADMIN" && auth.claims.sub !== idParsed.data) {
    return jsonError("Forbidden", 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: idParsed.data },
    select: publicUserSelect,
  });
  if (!user) return jsonError("User not found", 404);
  return NextResponse.json({ user });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const isAdmin = auth.claims.role === "ADMIN";
  const isSelf = auth.claims.sub === idParsed.data;

  if (isAdmin) {
    const parsed = patchUserByIdBodySchema.safeParse(raw.data);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    if (Object.keys(parsed.data).length === 0) {
      return jsonError("No fields to update", 400);
    }

    if (parsed.data.email) {
      const taken = await prisma.user.findFirst({
        where: {
          email: parsed.data.email,
          NOT: { id: idParsed.data },
        },
      });
      if (taken) return jsonError("Email already in use", 409);
    }

    const user = await prisma.user.update({
      where: { id: idParsed.data },
      data: parsed.data,
      select: publicUserSelect,
    });
    return NextResponse.json({ user });
  }

  if (!isSelf) return jsonError("Forbidden", 403);

  const parsed = patchMeBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const user = await prisma.user.update({
    where: { id: idParsed.data },
    data: parsed.data,
    select: publicUserSelect,
  });
  return NextResponse.json({ user });
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (auth.claims.role !== "ADMIN") {
    return jsonError("Forbidden: admin only", 403);
  }

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  if (auth.claims.sub === idParsed.data) {
    return jsonError("Cannot delete your own account", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id: idParsed.data },
  });
  if (!existing) return jsonError("User not found", 404);

  await prisma.user.delete({ where: { id: idParsed.data } });
  return NextResponse.json({ message: "User deleted" });
}
