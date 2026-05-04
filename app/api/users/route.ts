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
 *     security:
 *       - bearerAuth: []
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
