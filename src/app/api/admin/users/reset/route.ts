import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { sql } from "@vercel/postgres";

async function requireAdmin(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
  }
  if (!token?.email) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  let role = (token.role as string) ?? "";
  if (!role || role === "user") {
    try { const u = await getUserByEmail(token.email as string); role = u?.role ?? role; } catch {}
  }
  if (!["admin","superadmin"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  try {
    const { userId, email } = await req.json();
    if (!userId && !email)
      return NextResponse.json({ error: "userId or email required" }, { status: 400 });

    let uid = userId;
    let userEmail = email;
    let userName = "";
    if (!uid && email) {
      const user = await getUserByEmail(email);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      uid = user.id; userEmail = user.email; userName = user.name ?? "";
    } else if (uid) {
      const r = await sql`SELECT email, name FROM users WHERE id = ${uid} LIMIT 1`;
      userEmail = r.rows[0]?.email ?? userEmail;
      userName = r.rows[0]?.name ?? "";
    }

    const token = await createResetToken(uid);
    if (!token) return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 });

    const { sent, resetLink } = await sendPasswordResetEmail(userEmail, userName, token);
    return NextResponse.json({ sent, email: userEmail, resetLink });
  } catch (err) {
    console.error("Admin reset error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
