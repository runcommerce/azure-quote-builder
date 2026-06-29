import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getAllUsers, createUser, updateUser, deleteUser,
  getUserByEmail, VALID_ROLES, initDB,
} from "@/lib/db";
import { sendTempPasswordEmail } from "@/lib/email";
import crypto from "crypto";

// ── Auth helper ───────────────────────────────────────────────────────────
// NextAuth v5 beta: AUTH_SECRET is the new env var name (NEXTAUTH_SECRET fallback).
// Don't hardcode cookie name — secureCookie flag handles prod vs dev automatically.
async function requireAdmin(req: NextRequest): Promise<
  { error: NextResponse } | { email: string; id?: string }
> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

  // Try secure cookie (production) first, then non-secure (dev)
  let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
  }

  if (!token?.email) {
    console.error("[admin/users] No token — cookie missing or secret mismatch");
    return { error: NextResponse.json({ error: "Unauthorised — please sign in" }, { status: 401 }) };
  }

  // Role from token may be stale — verify against DB
  let role = (token.role as string) ?? "";
  if (!role || role === "user") {
    try {
      const dbUser = await getUserByEmail(token.email as string);
      role = dbUser?.role ?? role;
    } catch { /* ignore */ }
  }

  if (!["admin", "superadmin"].includes(role)) {
    console.error(`[admin/users] Forbidden — email=${token.email} role=${role}`);
    return { error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
  }

  return { email: token.email as string, id: token.sub };
}

// ── GET — list all users ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    await initDB();
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ── POST — create user with temp password ─────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    await initDB();
    const { name, email, role } = await req.json();
    if (!name?.trim() || !email?.trim())
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    if (role && !VALID_ROLES.includes(role))
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });

    const existing = await getUserByEmail(email);
    if (existing)
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

    const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 12) + "Az1!";
    const user = await createUser(name.trim(), email.trim(), tempPassword, role || "user");
    const { sent } = await sendTempPasswordEmail(email.trim(), name.trim(), tempPassword);

    return NextResponse.json({
      success: true, user, emailSent: sent,
      ...(sent ? {} : { tempPassword }),
    });
  } catch (err) {
    console.error("POST /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── PUT — update name/email/role/active ───────────────────────────────────
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const { id, name, email, role, active } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    if (role && !VALID_ROLES.includes(role))
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });

    if (email) {
      const existing = await getUserByEmail(email);
      if (existing && existing.id !== id)
        return NextResponse.json({ error: "Email already in use by another account" }, { status: 409 });
    }

    const updated = await updateUser(id, { name, email, role, active });
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PUT /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── DELETE — permanently remove a user ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (auth.id === id)
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
