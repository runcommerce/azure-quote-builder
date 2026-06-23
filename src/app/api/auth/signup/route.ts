import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, initDB } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
          // Initialise the database tables if they don't exist yet
      await initDB();

      const { name, email, password } = await req.json();

      // --- basic field validation ---
      if (!name || !email || !password)
              return NextResponse.json({ error: "All fields required" }, { status: 400 });
          if (password.length < 8)
                  return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                  return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

      // --- duplicate-email check ---
      const existing = await getUserByEmail(email);
          if (existing)
                  return NextResponse.json(
                    { error: "An account with this email already exists. Try signing in instead." },
                    { status: 409 }
                          );

      // --- create the user ---
      const user = await createUser(name, email, password);

      // Welcome e-mail is best-effort — never block signup if it fails
      await sendWelcomeEmail(email, name).catch(() => {});

      return NextResponse.json({
              success: true,
              user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err: unknown) {
          // Log full details server-side for debugging
      console.error("Signup error:", err);

      // Surface a meaningful message to the client based on the error type
      const message = getClientMessage(err);
          return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * Maps a caught error to a user-friendly message while keeping sensitive
 * internals server-side only.
 */
function getClientMessage(err: unknown): string {
    if (!(err instanceof Error)) return "An unexpected error occurred. Please try again.";

  const msg = err.message ?? "";

  // Vercel Postgres / pg connection problems
  if (
        msg.includes("connect ECONNREFUSED") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("Connection terminated") ||
        msg.includes("SSL") ||
        msg.includes("password authentication failed") ||
        msg.includes("no pg_hba.conf entry")
      ) {
        return "Unable to connect to the database. Please try again in a moment or contact support.";
  }

  // Missing environment variable (common during misconfigured deploys)
  if (
        msg.includes("POSTGRES_URL") ||
        msg.includes("environment variable") ||
        msg.includes("is not defined")
      ) {
        return "The server is not configured correctly. Please contact your administrator.";
  }

  // Unique-constraint race condition (email inserted between our check and INSERT)
  if (msg.includes("unique constraint") || msg.includes("duplicate key")) {
        return "An account with this email already exists. Try signing in instead.";
  }

  // JSON parse failures
  if (msg.includes("JSON") || msg.includes("Unexpected token")) {
        return "Invalid request. Please refresh the page and try again.";
  }

  // Fallback — keep internal details off the wire
  return "Something went wrong on our end. Please try again or contact support.";
}
