import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createResetToken, getUserByEmail } from "@/lib/db";
import { sql } from "@vercel/postgres";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return null;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { userId, email } = await req.json();
    if (!userId && !email) return NextResponse.json({ error: "userId or email required" }, { status: 400 });

    let uid = userId;
    let userEmail = email;
    if (!uid && email) {
      const user = await getUserByEmail(email);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      uid = user.id;
      userEmail = user.email;
    } else if (uid && !email) {
      const result = await sql`SELECT email FROM users WHERE id = ${uid} LIMIT 1`;
      userEmail = result.rows[0]?.email;
    }

    const token = await createResetToken(uid);
    if (!token) return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 });

    const baseUrl = process.env.NEXTAUTH_URL || "https://azure-quote-builder.vercel.app";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY && userEmail) {
      const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto"><div style="background:#1a3a2e;padding:24px 32px;border-radius:12px 12px 0 0"><div style="color:#fff;font-size:18px;font-weight:700">azure <span style="color:#c8e63c;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:400">communications · IQ</span></div></div><div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><h2 style="margin:0 0 16px;font-size:20px;color:#111827">Password reset</h2><p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">A password reset has been requested for your Azure IQ account.</p><a href="${resetLink}" style="display:inline-block;background:#1a3a2e;color:#c8e63c;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Reset my password →</a><p style="color:#9ca3af;font-size:12px;margin:24px 0 0">This link expires in 1 hour.</p></div></div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: "Azure IQ <noreply@azurecomm.ie>", to: userEmail, subject: "Reset your Azure IQ password", html }),
      });
      return NextResponse.json({ sent: true, email: userEmail, resetLink });
    }

    return NextResponse.json({ sent: false, resetLink, email: userEmail });
  } catch (err) {
    console.error("Admin reset error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
