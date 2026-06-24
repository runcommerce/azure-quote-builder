import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPortalRequests } from "@/lib/db-portals";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const requests = await getPortalRequests();
    return NextResponse.json({ requests });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
