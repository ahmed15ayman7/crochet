import { NextResponse } from "next/server";
import { flattenError } from "zod";

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export function zodErrorResponse(error: Parameters<typeof flattenError>[0]) {
  return NextResponse.json(
    { error: "Validation failed", details: flattenError(error) },
    { status: 400 }
  );
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function readJsonBody(
  request: Request
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: Response }
> {
  try {
    const data = await request.json();
    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) };
  }
}
