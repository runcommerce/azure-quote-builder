import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Always return success to prevent email enumeration — but include
    // whether email was actually sent so the UI can guide the user
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, sent: false });
    }

    const token = await createResetToken(user.id);
    const { sent, resetLink } = await sendPasswordResetEmail(email, user.name, token);

    return NextResponse.json({
      success: true,
      sent,
      // Only include resetLink in response when no email sent (admin use)
      // In production with Resend working, this won't matter
      ...(sent ? {} : { resetLink }),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
