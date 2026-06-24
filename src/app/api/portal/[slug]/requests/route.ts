import { NextRequest, NextResponse } from "next/server";
import { getPortal, createPortalRequest, getPortalRequests } from "@/lib/db-portals";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const portal = await getPortal(params.slug);
    if (!portal) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    const body = await req.json();
    const request = await createPortalRequest({ portal_id: portal.id, ...body });
    return NextResponse.json({ request });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const portal = await getPortal(params.slug);
    if (!portal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const requests = await getPortalRequests(portal.id);
    return NextResponse.json({ requests });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
