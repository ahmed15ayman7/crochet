import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { readJsonBody, zodErrorResponse } from "@/lib/http";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { resetPasswordBodySchema } from "@/lib/validations/password-auth";

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set a new password using email + reset token from forgot-password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation error
 */
export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = resetPasswordBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { email, token, newPassword } = parsed.data;
  const tokenHash = hashPasswordResetToken(token);

  const user = await prisma.user.findFirst({
    where: {
      email,
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });

  return NextResponse.json({ message: "Password has been reset" });
}
