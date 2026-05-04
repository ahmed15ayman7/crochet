import { NextResponse } from "next/server";

import { readJsonBody, zodErrorResponse } from "@/lib/http";
import {
  generatePasswordResetPlainToken,
  hashPasswordResetToken,
  shouldReturnResetTokenInResponse,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { forgotPasswordBodySchema } from "@/lib/validations/password-auth";

const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token (email flow in production)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Always same shape to avoid email enumeration
 */
export async function POST(request: Request) {
  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = forgotPasswordBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  const generic = {
    message:
      "If an account exists for this email, password reset instructions apply.",
  };

  if (!user) {
    return NextResponse.json(generic);
  }

  const plainToken = generatePasswordResetPlainToken();
  const tokenHash = hashPasswordResetToken(plainToken);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires,
    },
  });

  if (shouldReturnResetTokenInResponse()) {
    return NextResponse.json({
      ...generic,
      resetToken: plainToken,
      expiresAt: expires.toISOString(),
    });
  }

  return NextResponse.json(generic);
}
