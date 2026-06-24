import { NextRequest, NextResponse } from "next/server";
import { getPortal } from "@/lib/db-portals";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const portal = await getPortal(params.slug);
    if (!portal) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    return NextResponse.json({ portal });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
