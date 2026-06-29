// Database helpers — Vercel Postgres
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── SCHEMA ────────────────────────────────────────────────────────────────
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add active column if upgrading from old schema
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE
  `.catch(() => {});
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `.catch(() => {});
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// ── USER CRUD ─────────────────────────────────────────────────────────────

export async function createUser(
  name: string,
  email: string,
  password: string,
  role = "user"
) {
  const hash = await bcrypt.hash(password, 12);
  const result = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email.toLowerCase().trim()}, ${hash}, ${role})
    RETURNING id, name, email, role, active, created_at
  `;
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function getUserById(id: string) {
  const result = await sql`
    SELECT id, name, email, role, active, email_verified, created_at FROM users
    WHERE id = ${id} LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function getAllUsers() {
  const result = await sql`
    SELECT id, name, email, role, active, email_verified, created_at, updated_at
    FROM users ORDER BY created_at ASC
  `;
  return result.rows;
}

export async function updateUser(
  id: string,
  fields: { name?: string; email?: string; role?: string; active?: boolean }
) {
  const { name, email, role, active } = fields;
  // Build update dynamically — only touch provided fields
  if (name !== undefined) {
    await sql`UPDATE users SET name = ${name}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (email !== undefined) {
    await sql`UPDATE users SET email = ${email.toLowerCase().trim()}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (role !== undefined) {
    await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (active !== undefined) {
    await sql`UPDATE users SET active = ${active}, updated_at = NOW() WHERE id = ${id}`;
  }
  return getUserById(id);
}

export async function updateUserPassword(id: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await sql`
    UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${id}
  `;
}

export async function deleteUser(id: string) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// ── ROLE MANAGEMENT ───────────────────────────────────────────────────────

export const VALID_ROLES = ["superadmin", "admin", "sales_rep", "estimator", "viewer", "user"] as const;
export type UserRole = typeof VALID_ROLES[number];

export async function updateUserRole(id: string, role: string) {
  if (!VALID_ROLES.includes(role as UserRole))
    throw new Error(`Invalid role: ${role}`);
  await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id}`;
}

// ── PASSWORD RESET TOKENS ─────────────────────────────────────────────────

export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  // Invalidate any existing unused tokens for this user first
  await sql`
    UPDATE password_reset_tokens SET used = TRUE
    WHERE user_id = ${userId} AND used = FALSE
  `;
  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})
  `;
  return token;
}

export async function getResetToken(token: string) {
  const result = await sql`
    SELECT prt.*, u.email, u.name FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token = ${token}
      AND prt.used = FALSE
      AND prt.expires_at > NOW()
    LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function consumeResetToken(token: string, newPassword: string) {
  const row = await getResetToken(token);
  if (!row) return false;
  const hash = await bcrypt.hash(newPassword, 12);
  await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${row.user_id}`;
  await sql`UPDATE password_reset_tokens SET used = TRUE WHERE token = ${token}`;
  return true;
}
