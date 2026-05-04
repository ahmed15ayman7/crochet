import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/user-public";
import { patchMeBodySchema } from "@/lib/validations/user";

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Current user profile
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
 *       404:
 *         description: User id from token not found
 *   patch:
 *     tags: [Users]
 *     summary: Update your display name
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             description: At least one property required (currently only name).
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserEnvelope'
 *       400:
 *         description: Validation error or no fields to update
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.claims.sub },
    select: publicUserSelect,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = patchMeBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: auth.claims.sub },
    data: parsed.data,
    select: publicUserSelect,
  });

  return NextResponse.json({ user });
}
