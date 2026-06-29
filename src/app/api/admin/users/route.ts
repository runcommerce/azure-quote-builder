// /api/admin/users — full CRUD for user management
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAllUsers, createUser, updateUser, deleteUser,
  getUserByEmail, VALID_ROLES, initDB,
} from "@/lib/db";
import { sendWelcomeEmail, sendTempPasswordEmail } from "@/lib/email";

async function getSession() {
  return auth();
}

async function requireAdmin(req?: NextRequest) {
  void req;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!["admin","superadmin"].includes(session.user.role ?? ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// GET — list all users
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await initDB();
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST — create a new user (admin-initiated, sends temp password email)
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
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

    // Generate a secure random temporary password
    const tempPassword = crypto.randomUUID().replace(/-/g,"").slice(0,12) +
      "Az1!"; // ensures complexity requirements

    const user = await createUser(name.trim(), email.trim(), tempPassword, role || "user");

    // Email the temp password — they must change it on first login
    const { sent } = await sendTempPasswordEmail(email.trim(), name.trim(), tempPassword);

    return NextResponse.json({
      success: true,
      user,
      emailSent: sent,
      // Return tempPassword only when email failed so admin can share manually
      ...(sent ? {} : { tempPassword }),
    });
  } catch (err) {
    console.error("POST /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT — update a user's name, email, role, or active status
export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  try {
    const { id, name, email, role, active } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const session = await getSession();
    // Prevent demoting yourself
    if (session?.user?.id === id && role && role !== (session?.user?.role ?? ""))
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });

    if (role && !VALID_ROLES.includes(role))
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });

    if (email) {
      const existing = await getUserByEmail(email);
      if (existing && existing.id !== id)
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const updated = await updateUser(id, { name, email, role, active });
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PUT /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — permanently remove a user
export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const session = await getSession();
    if (session?.user?.id === id)
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Need crypto for temp password generation
import crypto from "crypto";
