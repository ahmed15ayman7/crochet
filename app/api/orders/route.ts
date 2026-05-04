import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { resolveProductsForOrder } from "@/lib/order-totals";
import { prisma } from "@/lib/prisma";
import {
  createOrderBodySchema,
  ordersListQuerySchema,
} from "@/lib/validations/order";

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders for current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       userId: { type: string }
 *                       productIds:
 *                         type: array
 *                         items: { type: string }
 *                       totalAmount: { type: number }
 *                       status: { type: string, enum: [PENDING, SUCCESS, CANCELLED] }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [all]
 *         description: ADMIN only — list all orders
 *   post:
 *     tags: [Orders]
 *     summary: Create an order linked to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productIds]
 *             properties:
 *               productIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Order created (PENDING)
 *       400:
 *         description: Validation error or unknown product ids
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = ordersListQuerySchema.safeParse({
    scope: searchParams.get("scope") || undefined,
  });
  if (!q.success) return zodErrorResponse(q.error);

  if (q.data.scope === "all") {
    if (auth.claims.role !== "ADMIN") {
      return jsonError("Forbidden: admin only", 403);
    }
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  }

  const orders = await prisma.order.findMany({
    where: { userId: auth.claims.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = createOrderBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const resolved = await resolveProductsForOrder(parsed.data.productIds);
  if (!resolved.ok) {
    return jsonError("One or more product ids are invalid", 400);
  }

  const order = await prisma.order.create({
    data: {
      userId: auth.claims.sub,
      productIds: resolved.uniqueIds,
      totalAmount: resolved.totalAmount,
      status: "PENDING",
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}
