import { verifyAccessToken } from "@/lib/jwt";
import type { JwtUserClaims } from "@/lib/jwt";
import { getBearerToken, jsonError } from "@/lib/http";

export async function requireAuth(
  request: Request
): Promise<
  | { ok: true; claims: JwtUserClaims }
  | { ok: false; response: Response }
> {
  const token = getBearerToken(request);
  if (!token) return { ok: false, response: jsonError("Unauthorized", 401) };
  const claims = await verifyAccessToken(token);
  if (!claims) return { ok: false, response: jsonError("Unauthorized", 401) };
  return { ok: true, claims };
}

export async function requireAdmin(
  request: Request
): Promise<
  | { ok: true; claims: JwtUserClaims }
  | { ok: false; response: Response }
> {
  const r = await requireAuth(request);
  if (!r.ok) return r;
  if (r.claims.role !== "ADMIN") {
    return {
      ok: false,
      response: jsonError("Forbidden: admin role required", 403),
    };
  }
  return r;
}
