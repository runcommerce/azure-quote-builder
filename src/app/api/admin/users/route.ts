import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, deleteUser, updateUserRole } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!["admin","superadmin"].includes(session.user.role ?? "")) return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  return null;
}

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id, role } = await req.json();
    if (!id || !["user", "admin"].includes(role))
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    await updateUserRole(id, role);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    const session = await auth();
    if (session?.user?.id === id)
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
