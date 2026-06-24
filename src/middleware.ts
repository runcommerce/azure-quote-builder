import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth"];
const STATIC = ["/_next", "/favicon.ico", "/azure-logo.png"];

// NextAuth v5 uses "authjs.session-token" (or "__Secure-authjs.session-token" on HTTPS)
const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (STATIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: COOKIE_NAME,
  });

  if (PUBLIC.some(p => pathname.startsWith(p))) {
    // Logged-in users don't need auth pages
    if (token) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Protected routes
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // Admin-only routes
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|azure-logo.png).*)"],
};
