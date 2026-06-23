// Auth middleware temporarily disabled — re-enable once Vercel Postgres + NEXTAUTH_SECRET are configured
// To re-enable: uncomment the auth middleware below and remove the passthrough export

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|azure-logo.png).*)"],
};

/* PRODUCTION AUTH — uncomment when DB is ready:
import { auth } from "@/lib/auth";
export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";
  const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password"]
    .some(r => nextUrl.pathname.startsWith(r));
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isApiAdmin = nextUrl.pathname.startsWith("/api/admin");
  if (isApiAuth) return NextResponse.next();
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
  if ((isAdminRoute || isApiAdmin) && !isAdmin)
    return NextResponse.redirect(new URL("/", nextUrl));
  return NextResponse.next();
});
*/
