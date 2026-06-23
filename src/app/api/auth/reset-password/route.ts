import { NextRequest, NextResponse } from "next/server";
import { consumeResetToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const ok = await consumeResetToken(token, password);
    if (!ok) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
