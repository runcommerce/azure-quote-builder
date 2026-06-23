// Database helpers - works with Vercel Postgres
// Falls back to in-memory store for local dev without DB
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
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

export async function createUser(name: string, email: string, password: string, role = "user") {
  const hash = await bcrypt.hash(password, 12);
  const result = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${hash}, ${role})
    RETURNING id, name, email, role
  `;
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return result.rows[0] || null;
}

export async function createResetToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})
  `;
  return token;
}

export async function getResetToken(token: string) {
  const result = await sql`
    SELECT prt.*, u.email FROM password_reset_tokens prt
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
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${row.user_id}`;
  await sql`UPDATE password_reset_tokens SET used = TRUE WHERE token = ${token}`;
  return true;
}

export async function getAllUsers() {
  const result = await sql`SELECT id, name, email, role, email_verified, created_at FROM users ORDER BY created_at DESC`;
  return result.rows;
}

export async function deleteUser(id: string) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}

export async function updateUserRole(id: string, role: string) {
  await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
}
