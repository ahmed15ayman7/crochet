import { SignJWT, jwtVerify } from "jose";

import type { UserRole } from "@prisma/client";

export type JwtUserClaims = {
  sub: string;
  role: UserRole;
  email?: string;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  claims: JwtUserClaims,
  expiresIn?: string
): Promise<string> {
  const ttl = expiresIn ?? process.env.JWT_EXPIRES_IN ?? "7d";
  return new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecretKey());
}

export async function verifyAccessToken(
  token: string
): Promise<JwtUserClaims | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    const role = payload.role;
    if (
      typeof sub !== "string" ||
      (role !== "ADMIN" && role !== "USER")
    ) {
      return null;
    }
    return {
      sub,
      role,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}
