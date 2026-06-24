import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPortals, createPortal, initPortalDB } from "@/lib/db-portals";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    await initPortalDB();
    const portals = await getAllPortals();
    return NextResponse.json({ portals });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    await initPortalDB();
    const body = await req.json();
    const portal = await createPortal(body);
    return NextResponse.json({ portal });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
