import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;

  const isPublic = ["/login", "/signup", "/forgot-password", "/reset-password"]
    .some(p => nextUrl.pathname.startsWith(p));
  const isApiAuth  = nextUrl.pathname.startsWith("/api/auth");
  const isAdmin    = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");

  if (isApiAuth) return NextResponse.next();
  if (isPublic) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
  if (isAdmin && session?.user?.role !== "admin")
    return NextResponse.redirect(new URL("/", nextUrl));
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|azure-logo.png).*)"],
};
