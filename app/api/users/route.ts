import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/user-public";

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (ADMIN only)
 *     description: Requires ADMIN Bearer JWT. Response body contains a users array (possibly empty).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK — array of public user objects (no passwords)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersEnvelope'
 *             examples:
 *               sample:
 *                 value:
 *                   users:
 *                     - id: "507f1f77bcf86cd799439011"
 *                       name: "Ada"
 *                       email: "ada@example.com"
 *                       role: "ADMIN"
 *                       createdAt: "2026-01-01T12:00:00.000Z"
 *       401:
 *         description: Missing or invalid Bearer token
 *       403:
 *         description: Authenticated but not ADMIN
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (auth.claims.role !== "ADMIN") {
    return jsonError("Forbidden: admin only", 403);
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: publicUserSelect,
  });

  return NextResponse.json({ users });
}
