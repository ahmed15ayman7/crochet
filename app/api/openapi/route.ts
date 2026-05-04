import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
  const staticPath = path.join(process.cwd(), "public", "openapi.json");
  if (existsSync(staticPath)) {
    try {
      const spec = JSON.parse(readFileSync(staticPath, "utf-8")) as object;
      if (spec && typeof spec === "object" && "paths" in spec) {
        const paths = (spec as { paths?: unknown }).paths;
        if (paths && typeof paths === "object" && Object.keys(paths).length > 0) {
          return NextResponse.json(spec);
        }
      }
    } catch {
      /* fall through to dynamic scan */
    }
  }

  const spec = buildOpenApiSpec();
  return NextResponse.json(spec);
}
