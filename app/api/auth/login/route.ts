import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { signAccessToken } from "@/lib/jwt";
import { jsonError, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginBodySchema } from "@/lib/validations/auth";

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string, enum: [USER, ADMIN] }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return jsonError("Invalid credentials", 401);
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return jsonError("Invalid credentials", 401);
  }

  let token: string;
  try {
    token = await signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
  } catch {
    return jsonError("Authentication service misconfigured", 500);
  }

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
