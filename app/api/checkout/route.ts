import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { checkoutBodySchema } from "@/lib/validations/order";

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: Placeholder checkout — marks order as SUCCESS (simulated payment)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment simulated; order updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Order does not belong to user
 *       404:
 *         description: Order not found
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = checkoutBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
  });
  if (!order) return jsonError("Order not found", 404);
  if (order.userId !== auth.claims.sub) {
    return jsonError("Forbidden", 403);
  }
  if (order.status !== "PENDING") {
    return jsonError("Checkout is only allowed for pending orders", 400);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "SUCCESS" },
  });

  return NextResponse.json({
    message: "Payment simulated successfully",
    order: updated,
  });
}
