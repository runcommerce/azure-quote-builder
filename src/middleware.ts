import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth"];
const STATIC = ["/_next", "/favicon.ico", "/azure-logo.png"];

// NextAuth v5 sets this cookie name on HTTPS production
const COOKIE_NAME = "__Secure-authjs.session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass static assets
  if (STATIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Always pass public auth routes — no redirects, let the page handle it
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Protected routes — check for valid session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: COOKIE_NAME,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

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
