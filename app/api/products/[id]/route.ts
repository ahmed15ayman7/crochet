import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-route";
import { jsonError, readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { objectIdSchema } from "@/lib/validations/object-id";
import { updateProductBodySchema } from "@/lib/validations/product";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get one product
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (ADMIN)
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (ADMIN)
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const product = await prisma.product.findUnique({
    where: { id: idParsed.data },
  });
  if (!product) return jsonError("Product not found", 404);
  return NextResponse.json({ product });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = updateProductBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (Object.keys(parsed.data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const existing = await prisma.product.findUnique({
    where: { id: idParsed.data },
  });
  if (!existing) return jsonError("Product not found", 404);

  const product = await prisma.product.update({
    where: { id: idParsed.data },
    data: parsed.data,
  });

  return NextResponse.json({ product });
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const idParsed = objectIdSchema.safeParse(id);
  if (!idParsed.success) return zodErrorResponse(idParsed.error);

  const existing = await prisma.product.findUnique({
    where: { id: idParsed.data },
  });
  if (!existing) return jsonError("Product not found", 404);

  await prisma.product.delete({ where: { id: idParsed.data } });
  return NextResponse.json({ message: "Product deleted" });
}
