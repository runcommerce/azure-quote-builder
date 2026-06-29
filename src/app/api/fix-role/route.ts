// ONE-TIME BOOTSTRAP ROUTE — sets superadmin role for eamonn@standfast.partners
// DELETE THIS FILE after use
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  // Simple secret to prevent accidental use
  if (key !== "fix-azure-iq-2026") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  try {
    // Show current state
    const before = await sql`SELECT id, email, role FROM users WHERE email = 'eamonn@standfast.partners' LIMIT 1`;
    
    // Fix the role
    await sql`
      UPDATE users 
      SET role = 'superadmin' 
      WHERE email = 'eamonn@standfast.partners'
    `;
    
    // Also ensure all known admins have correct roles
    await sql`UPDATE users SET role = 'admin' WHERE email = 'jenny@azurecomm.ie'`;
    await sql`UPDATE users SET role = 'admin' WHERE email = 'ciaran@azurecomm.ie'`;

    const after = await sql`SELECT id, email, role FROM users ORDER BY created_at`;
    
    return NextResponse.json({ 
      success: true,
      before: before.rows,
      after: after.rows,
      message: "Role updated. Sign out and back in for the new role to take effect in your JWT token."
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
