import { NextResponse } from "next/server";

import { buildOpenApiSpec } from "@/lib/swagger";

/**
 * @openapi
 * /api/openapi:
 *   get:
 *     tags: [Documentation]
 *     summary: OpenAPI document (JSON)
 *     responses:
 *       200:
 *         description: OpenAPI 3.0 specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  const spec = buildOpenApiSpec();
  return NextResponse.json(spec);
}
