import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (pathname === "/api/auth/change-password" && method === "POST") {
    return requireBearerJwt(request);
  }

  if (pathname === "/api/learning") {
    if (method === "GET") return NextResponse.next();
    if (method === "POST" || method === "PATCH") {
      return requireBearerJwtAdmin(request);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/products")) {
    if (method === "GET") return NextResponse.next();
    return requireBearerJwtAdmin(request);
  }

  if (pathname.startsWith("/api/orders")) {
    return requireBearerJwt(request);
  }

  if (pathname.startsWith("/api/checkout")) {
    return requireBearerJwt(request);
  }

  if (pathname.startsWith("/api/courses")) {
    if (method === "GET") return NextResponse.next();
    return requireBearerJwtAdmin(request);
  }

  if (pathname.startsWith("/api/users")) {
    return requireBearerJwt(request);
  }

  return NextResponse.next();
}

async function requireBearerJwt(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7).trim();
  const claims = await verifyAccessToken(token);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

async function requireBearerJwtAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7).trim();
  const claims = await verifyAccessToken(token);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (claims.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/change-password",
    "/api/learning",
    "/api/products",
    "/api/products/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/checkout",
    "/api/courses",
    "/api/courses/:path*",
    "/api/users",
    "/api/users/:path*",
  ],
};
