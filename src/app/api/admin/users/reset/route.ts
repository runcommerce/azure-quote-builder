import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { sql } from "@vercel/postgres";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Always verify role from DB — JWT token may be stale
  let role = session.user.role ?? "";
  if (!role || role === "user") {
    try {
      const { getUserByEmail } = await import("@/lib/db");
      const dbUser = await getUserByEmail(session.user.email);
      role = dbUser?.role ?? role;
    } catch {}
  }

  if (!["admin","superadmin"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
});
  if (!["admin", "superadmin"].includes(session.user.role ?? ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { userId, email } = await req.json();
    if (!userId && !email)
      return NextResponse.json({ error: "userId or email required" }, { status: 400 });

    // Resolve user
    let uid = userId;
    let userEmail = email;
    let userName = "";
    if (!uid && email) {
      const user = await getUserByEmail(email);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      uid = user.id;
      userEmail = user.email;
      userName = user.name ?? "";
    } else if (uid) {
      const r = await sql`SELECT email, name FROM users WHERE id = ${uid} LIMIT 1`;
      userEmail = r.rows[0]?.email ?? userEmail;
      userName = r.rows[0]?.name ?? "";
    }

    const token = await createResetToken(uid);
    if (!token) return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 });

    // Use the shared email helper (consistent branding, correct FROM)
    const { sent, resetLink } = await sendPasswordResetEmail(userEmail, userName, token);

    return NextResponse.json({ sent, email: userEmail, resetLink });
  } catch (err) {
    console.error("Admin reset error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
