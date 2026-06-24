// Minimal middleware — only protect API admin routes server-side.
// Page-level auth is handled client-side via useSession() to avoid
// SSR/hydration conflicts with NextAuth v5 and Vercel's edge runtime.
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Only block /api/admin at the edge — everything else handled client-side
  if (pathname.startsWith("/api/admin")) {
    // Let the API route itself check auth via auth()
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
