import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { signAccessToken } from "@/lib/jwt";
import { jsonError, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerBodySchema } from "@/lib/validations/auth";

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (default role USER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Min 8 chars; letters, digits, and a symbol from @&!#$%^*()_+-=[]{}|;:,.<>?/~`
 *     responses:
 *       201:
 *         description: User created; returns profile and JWT access token
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
 *       409:
 *         description: Email already registered
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = registerBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: passwordHash },
    select: { id: true, name: true, email: true, role: true },
  });

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

  return NextResponse.json({ token, user }, { status: 201 });
}
