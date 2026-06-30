import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getAllCustomers, searchCustomers, createCustomer,
  updateCustomer, deleteCustomer, getUserByEmail, initDB,
} from "@/lib/db";

// Any signed-in user can search/read customers (needed for quote building).
// Only admin/superadmin can create, edit, or delete.
async function requireSignedIn(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (!token) token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
  if (!token?.email) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  return { email: token.email as string };
}

async function requireAdmin(req: NextRequest) {
  const auth = await requireSignedIn(req);
  if ("error" in auth) return auth;
  let role = "";
  try {
    const u = await getUserByEmail(auth.email);
    role = u?.role ?? "";
  } catch { /* ignore */ }
  if (!["admin", "superadmin"].includes(role))
    return { error: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
  return auth;
}

// GET — list or type-ahead search: /api/customers?q=azure&limit=10
export async function GET(req: NextRequest) {
  const auth = await requireSignedIn(req);
  if ("error" in auth) return auth.error;
  try {
    await initDB();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
    const customers = q
      ? await searchCustomers(q, limit)
      : await getAllCustomers();
    return NextResponse.json({ customers });
  } catch (err) {
    console.error("GET /api/customers:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST — create a new customer
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    await initDB();
    const body = await req.json();
    if (!body.name?.trim())
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    const customer = await createCustomer(body);
    return NextResponse.json({ success: true, customer });
  } catch (err) {
    console.error("POST /api/customers:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT — update an existing customer
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    const customer = await updateCustomer(id, fields);
    return NextResponse.json({ success: true, customer });
  } catch (err) {
    console.error("PUT /api/customers:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — remove a customer
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    await deleteCustomer(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/customers:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
