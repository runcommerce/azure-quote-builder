import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserByEmail } from "@/lib/db";

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
    const { email, role, name } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const baseUrl = process.env.NEXTAUTH_URL || "https://azure-quote-builder.vercel.app";
    const inviteCode = process.env.INVITE_CODE || "AZURE2026";
    const signupLink = `${baseUrl}/signup?email=${encodeURIComponent(email)}&inviteCode=${inviteCode}&role=${role ?? "user"}`;

    if (process.env.RESEND_API_KEY) {
      const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";
      const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto"><div style="background:#1a3a2e;padding:24px 32px;border-radius:12px 12px 0 0"><div style="color:#fff;font-size:18px;font-weight:700">azure <span style="color:#c8e63c;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:400;margin-left:4px">communications · IQ</span></div></div><div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 8px">${greeting}</p><p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px">You've been invited to join <strong>Azure IQ</strong>. Click the button below to create your account.</p><a href="${signupLink}" style="display:inline-block;background:#1a3a2e;color:#c8e63c;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Create my account →</a><p style="color:#9ca3af;font-size:12px;margin:24px 0 0">Link: <span style="font-family:monospace;font-size:11px;word-break:break-all">${signupLink}</span></p></div></div>`;
      const sender = process.env.RESEND_FROM || "onboarding@resend.dev";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: `Azure IQ <${sender}>`, to: email, subject: "You've been invited to Azure IQ", html }),
      });
      if (res.ok) return NextResponse.json({ sent: true, email, signupLink });
      const err = await res.json();
      console.error("Resend invite error:", err);
      // Fall through — return link for manual sharing even if email failed
    }

    return NextResponse.json({ sent: false, email, signupLink });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
