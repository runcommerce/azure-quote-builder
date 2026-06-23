import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Always return success to prevent email enumeration
    const user = await getUserByEmail(email);
    if (user) {
      const token = await createResetToken(user.id);
      await sendPasswordResetEmail(email, user.name, token).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
