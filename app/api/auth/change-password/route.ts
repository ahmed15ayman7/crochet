import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { changePasswordBodySchema } from "@/lib/validations/password-auth";

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password while logged in
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation or wrong current password
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = changePasswordBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const user = await prisma.user.findUnique({
    where: { id: auth.claims.sub },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const match = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password
  );
  if (!match) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  return NextResponse.json({ message: "Password updated" });
}
