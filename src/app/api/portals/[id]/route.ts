import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@vercel/postgres";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const body = await req.json();
    const { slug, name, company_name, welcome_msg, account_manager_name,
            account_manager_email, account_manager_phone, primary_color,
            accent_color, invite_code, active, categories, custom_cta } = body;
    await sql`UPDATE client_portals SET
      slug=${slug}, name=${name}, company_name=${company_name},
      welcome_msg=${welcome_msg}, account_manager_name=${account_manager_name},
      account_manager_email=${account_manager_email}, account_manager_phone=${account_manager_phone},
      primary_color=${primary_color}, accent_color=${accent_color},
      invite_code=${invite_code}, active=${active},
      categories=${JSON.stringify(categories || [])},
      updated_at=NOW()
      WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    await sql`DELETE FROM client_portals WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
