import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-route";
import { readJsonBody, zodErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createProductBodySchema } from "@/lib/validations/product";

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     responses:
 *       200:
 *         description: Product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       description: { type: string }
 *                       price: { type: number }
 *                       imageUrl: { type: string, format: uri }
 *                       category: { type: string }
 *   post:
 *     tags: [Products]
 *     summary: Create a product (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, imageUrl, category]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number, minimum: 0, exclusiveMinimum: true }
 *               imageUrl: { type: string, format: uri }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin role required
 */
export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = createProductBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json({ product }, { status: 201 });
}
