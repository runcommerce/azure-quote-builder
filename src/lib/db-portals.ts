import { sql } from "@vercel/postgres";

export async function initPortalDB() {
  // Client portal accounts
  await sql`CREATE TABLE IF NOT EXISTS client_portals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    company_name  TEXT NOT NULL,
    logo_url      TEXT,
    primary_color TEXT DEFAULT '#183230',
    accent_color  TEXT DEFAULT '#c8e63c',
    welcome_msg   TEXT DEFAULT 'Welcome to your print & signage portal.',
    account_manager_name  TEXT DEFAULT 'Lisa Reid',
    account_manager_email TEXT DEFAULT 'lreid@azurecomm.ie',
    account_manager_phone TEXT DEFAULT '01 531 2695',
    account_manager_photo TEXT,
    categories    TEXT DEFAULT '[]',
    active        BOOLEAN DEFAULT true,
    invite_code   TEXT UNIQUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`;

  // Portal users (clients logging into their portal)
  await sql`CREATE TABLE IF NOT EXISTS portal_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id   UUID REFERENCES client_portals(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT DEFAULT 'user',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portal_id, email)
  )`;

  // Portal products/catalogue items
  await sql`CREATE TABLE IF NOT EXISTS portal_products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id   UUID REFERENCES client_portals(id) ON DELETE CASCADE,
    sku         TEXT,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,
    image_url   TEXT,
    base_price  NUMERIC(10,2),
    active      BOOLEAN DEFAULT true,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`;

  // Quote requests from portal users (all flow to Azure central)
  await sql`CREATE TABLE IF NOT EXISTS portal_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id     UUID REFERENCES client_portals(id) ON DELETE CASCADE,
    portal_user_id UUID REFERENCES portal_users(id),
    reference     TEXT,
    status        TEXT DEFAULT 'pending',
    items         JSONB DEFAULT '[]',
    notes         TEXT,
    delivery_address TEXT,
    po_number     TEXT,
    submitted_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    azure_assignee TEXT,
    azure_notes   TEXT
  )`;
}

// ── Portal CRUD ────────────────────────────────────────────────────────────
export async function getPortal(slug: string) {
  const r = await sql`SELECT * FROM client_portals WHERE slug = ${slug} AND active = true LIMIT 1`;
  return r.rows[0] || null;
}

export async function getAllPortals() {
  const r = await sql`SELECT * FROM client_portals ORDER BY created_at DESC`;
  return r.rows;
}

export async function createPortal(data: {
  slug: string; name: string; company_name: string;
  account_manager_name: string; account_manager_email: string;
  account_manager_phone: string; welcome_msg: string;
  primary_color: string; accent_color: string; invite_code: string;
}) {
  const r = await sql`
    INSERT INTO client_portals (slug, name, company_name, account_manager_name,
      account_manager_email, account_manager_phone, welcome_msg,
      primary_color, accent_color, invite_code)
    VALUES (${data.slug}, ${data.name}, ${data.company_name},
      ${data.account_manager_name}, ${data.account_manager_email},
      ${data.account_manager_phone}, ${data.welcome_msg},
      ${data.primary_color}, ${data.accent_color}, ${data.invite_code})
    RETURNING *`;
  return r.rows[0];
}

export async function updatePortal(id: string, data: Record<string, unknown>) {
  const fields = Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = Object.values(data);
  await sql.query(`UPDATE client_portals SET ${fields}, updated_at = NOW() WHERE id = $1`, [id, ...values]);
}

export async function getPortalRequests(portalId?: string) {
  if (portalId) {
    const r = await sql`
      SELECT pr.*, pu.name as user_name, pu.email as user_email, cp.name as portal_name, cp.slug
      FROM portal_requests pr
      JOIN portal_users pu ON pr.portal_user_id = pu.id
      JOIN client_portals cp ON pr.portal_id = cp.id
      WHERE pr.portal_id = ${portalId}
      ORDER BY pr.submitted_at DESC`;
    return r.rows;
  }
  const r = await sql`
    SELECT pr.*, pu.name as user_name, pu.email as user_email, cp.name as portal_name, cp.slug
    FROM portal_requests pr
    JOIN portal_users pu ON pr.portal_user_id = pu.id
    JOIN client_portals cp ON pr.portal_id = cp.id
    ORDER BY pr.submitted_at DESC`;
  return r.rows;
}

export async function createPortalRequest(data: {
  portal_id: string; portal_user_id: string;
  items: unknown[]; notes: string; delivery_address: string; po_number: string;
}) {
  const ref = `REQ-${Date.now().toString(36).toUpperCase()}`;
  const r = await sql`
    INSERT INTO portal_requests (portal_id, portal_user_id, reference, items, notes, delivery_address, po_number)
    VALUES (${data.portal_id}, ${data.portal_user_id}, ${ref},
      ${JSON.stringify(data.items)}, ${data.notes}, ${data.delivery_address}, ${data.po_number})
    RETURNING *`;
  return r.rows[0];
}

export async function getPortalProducts(portalId: string) {
  const r = await sql`SELECT * FROM portal_products WHERE portal_id = ${portalId} AND active = true ORDER BY category, sort_order, name`;
  return r.rows;
}
