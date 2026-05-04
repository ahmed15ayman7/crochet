import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { resolveProductsForOrder } from "@/lib/order-totals";
import { prisma } from "@/lib/prisma";
import { patchOrderBodySchema } from "@/lib/validations/order";
import { objectIdSchema } from "@/lib/validations/object-id";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get one order (owner or ADMIN)
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags: [Orders]
 *     summary: Owner may cancel (PENDING→CANCELLED). ADMIN may update status or line items.
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order (owner if PENDING, or ADMIN)
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const order = await prisma.order.findUnique({
    where: { id: idParsed.data },
  });
  if (!order) return jsonError("Order not found", 404);
  if (order.userId !== auth.claims.sub && auth.claims.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const order = await prisma.order.findUnique({
    where: { id: idParsed.data },
  });
  if (!order) return jsonError("Order not found", 404);

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = patchOrderBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (Object.keys(parsed.data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const isAdmin = auth.claims.role === "ADMIN";
  const isOwner = order.userId === auth.claims.sub;

  if (isAdmin) {
    const data: {
      status?: (typeof parsed.data)["status"];
      productIds?: string[];
      totalAmount?: number;
    } = {};
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.productIds !== undefined) {
      const resolved = await resolveProductsForOrder(parsed.data.productIds);
      if (!resolved.ok) return jsonError("Invalid product ids", 400);
      data.productIds = resolved.uniqueIds;
      data.totalAmount = resolved.totalAmount;
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
    });
    return NextResponse.json({ order: updated });
  }

  if (!isOwner) return jsonError("Forbidden", 403);

  if (
    parsed.data.productIds !== undefined ||
    (parsed.data.status !== undefined &&
      parsed.data.status !== "CANCELLED")
  ) {
    return jsonError("Forbidden", 403);
  }

  if (order.status !== "PENDING") {
    return jsonError("Only pending orders can be cancelled", 400);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ order: updated });
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const order = await prisma.order.findUnique({
    where: { id: idParsed.data },
  });
  if (!order) return jsonError("Order not found", 404);

  if (auth.claims.role === "ADMIN") {
    await prisma.order.delete({ where: { id: order.id } });
    return NextResponse.json({ message: "Order deleted" });
  }

  if (order.userId !== auth.claims.sub) return jsonError("Forbidden", 403);
  if (order.status !== "PENDING") {
    return jsonError("Only pending orders can be deleted by customer", 400);
  }

  await prisma.order.delete({ where: { id: order.id } });
  return NextResponse.json({ message: "Order deleted" });
}
