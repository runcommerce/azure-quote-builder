import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth"];
const STATIC = ["/_next", "/favicon.ico", "/azure-logo.png"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass static assets and public auth routes
  if (STATIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    // Redirect already-logged-in users away from auth pages
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // All other routes require auth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // Admin routes require admin role
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
