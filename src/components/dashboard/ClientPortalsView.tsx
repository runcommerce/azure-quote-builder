/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";

// ── Shared styles ──────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid rgba(26,58,46,0.09)", boxShadow: "0 1px 8px rgba(14,31,24,0.06)" };
const inp = (w?: string): React.CSSProperties => ({ width: w || "100%", padding: "8px 11px", borderRadius: 7, border: "1.5px solid rgba(26,58,46,0.14)", fontSize: 13.5, fontFamily: "var(--az-font)", color: "var(--az-ink)", background: "#fff", boxSizing: "border-box" as const });
const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: "var(--az-muted)", display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const btn = (primary: boolean): React.CSSProperties => ({ padding: primary ? "9px 20px" : "8px 16px", borderRadius: 999, border: primary ? "none" : "1.5px solid rgba(26,58,46,0.18)", background: primary ? "#1a3a2e" : "#fff", color: primary ? "#c8e63c" : "var(--az-ink)", fontSize: 13, fontWeight: primary ? 700 : 600, cursor: "pointer", fontFamily: "var(--az-font)" });

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? "#1a3a2e" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background 0.18s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: value ? "#c8e63c" : "#fff", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ── Portal Editor Modal ────────────────────────────────────────────────────
function PortalEditor({ portal, onClose, onSave }: { portal: any; onClose: () => void; onSave: (data: any) => void }) {
  const isNew = !portal.id;
  const [form, setForm] = useState({
    slug: portal.slug || "",
    name: portal.name || "",
    company_name: portal.company_name || "",
    welcome_msg: portal.welcome_msg || "Welcome to your print & signage portal.",
    account_manager_name: portal.account_manager_name || "Lisa Reid",
    account_manager_email: portal.account_manager_email || "lreid@azurecomm.ie",
    account_manager_phone: portal.account_manager_phone || "01 531 2695",
    primary_color: portal.primary_color || "#1a3a2e",
    accent_color: portal.accent_color || "#c8e63c",
    invite_code: portal.invite_code || "",
    active: portal.active !== false,
    categories: (portal.categories || ["Accessories","Boards","Misc","PVC","Signs","Window Sticker"]).join(", "),
    faqs_enabled: true,
    custom_cta: portal.custom_cta || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"branding"|"team"|"content"|"products"|"access">("branding");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const autoCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "2026";

  const handleSave = async () => {
    if (!form.slug || !form.company_name) { setError("Slug and company name required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, categories: form.categories.split(",").map((s: string) => s.trim()).filter(Boolean), invite_code: form.invite_code || autoCode(form.company_name) };
      const res = await fetch(isNew ? "/api/portals" : `/api/portals/${portal.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      onSave(await res.json());
      onClose();
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id: "branding", label: "Branding & Colours" },
    { id: "team",     label: "Account Manager"    },
    { id: "content",  label: "Content & Nav"      },
    { id: "products", label: "Categories"         },
    { id: "access",   label: "Access & Status"    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,15,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, boxShadow: "0 24px 80px rgba(10,24,18,0.30)", display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a3a2e, #122a21)", borderRadius: "16px 16px 0 0", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ color: "rgba(200,230,60,0.7)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>
              {isNew ? "Create" : "Edit"} Client Portal
            </div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{form.company_name || "New Portal"}</div>
          </div>
          {/* Live preview badge */}
          {!isNew && (
            <a href={`/portal/${form.slug}`} target="_blank" rel="noreferrer"
              style={{ padding: "6px 14px", borderRadius: 999, background: "rgba(200,230,60,0.15)", border: "1px solid rgba(200,230,60,0.35)", color: "#c8e63c", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              Open portal ↗
            </a>
          )}
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(26,58,46,0.10)", flexShrink: 0, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              style={{ padding: "10px 16px", border: "none", background: "none", fontSize: 12.5, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? "#1a3a2e" : "#9ca3af", borderBottom: activeTab === t.id ? "2px solid #1a3a2e" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: "var(--az-font)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>{error}</div>}

          {/* ── Branding ── */}
          {activeTab === "branding" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Company name *</label>
                  <input style={inp()} value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))}
                    placeholder="Winthrop Technologies" />
                </div>
                <div>
                  <label style={lbl}>Portal URL slug *</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid rgba(26,58,46,0.14)", borderRadius: 7, overflow: "hidden", background: "#fff" }}>
                    <span style={{ padding: "8px 10px", fontSize: 12, color: "var(--az-muted)", background: "var(--az-off-white)", borderRight: "1px solid rgba(26,58,46,0.10)", whiteSpace: "nowrap" as const }}>/portal/</span>
                    <input style={{ ...inp(), border: "none", borderRadius: 0, flex: 1 }} value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                      placeholder="winthrop" />
                  </div>
                  {form.slug && <div style={{ fontSize: 11, color: "var(--az-muted)", marginTop: 3 }}>→ /portal/{form.slug}</div>}
                </div>
              </div>
              <div>
                <label style={lbl}>Portal display name</label>
                <input style={inp()} value={form.name} onChange={set("name")} placeholder="Winthrop · Print Portal" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Primary colour</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                      style={{ width: 38, height: 34, borderRadius: 6, border: "1px solid rgba(26,58,46,0.14)", cursor: "pointer", padding: 2 }} />
                    <input style={inp()} value={form.primary_color} onChange={set("primary_color")} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Accent colour</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                      style={{ width: 38, height: 34, borderRadius: 6, border: "1px solid rgba(26,58,46,0.14)", cursor: "pointer", padding: 2 }} />
                    <input style={inp()} value={form.accent_color} onChange={set("accent_color")} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Logo URL (optional)</label>
                  <input style={inp()} placeholder="https://..." onChange={set("logo_url")} />
                </div>
              </div>
              {/* Live preview */}
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(26,58,46,0.09)" }}>
                <div style={{ background: form.primary_color, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <img src="/azure-logo.png" alt="" style={{ height: 18, opacity: 0.9 }} />
                  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{form.company_name || "Company"}</span>
                  <div style={{ marginLeft: "auto", padding: "5px 14px", borderRadius: 999, background: form.accent_color, color: form.primary_color, fontSize: 11.5, fontWeight: 700 }}>Request a Quote →</div>
                </div>
                <div style={{ background: form.primary_color, padding: "14px 16px" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: form.accent_color, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{(form.company_name || "CLIENT").toUpperCase()} · ONLINE ORDERING PORTAL</div>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{form.welcome_msg.slice(0, 45)}{form.welcome_msg.length > 45 ? "…" : ""}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Account Manager ── */}
          {activeTab === "team" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={lbl}>Account manager name</label><input style={inp()} value={form.account_manager_name} onChange={set("account_manager_name")} /></div>
                <div><label style={lbl}>Email</label><input style={inp()} type="email" value={form.account_manager_email} onChange={set("account_manager_email")} /></div>
                <div><label style={lbl}>Phone</label><input style={inp()} value={form.account_manager_phone} onChange={set("account_manager_phone")} /></div>
                <div><label style={lbl}>Photo URL (optional)</label><input style={inp()} placeholder="https://..." onChange={set("account_manager_photo")} /></div>
              </div>
              {/* Preview */}
              <div style={{ background: form.primary_color, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: form.accent_color, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 2 }}>Account Manager</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{form.account_manager_name}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{form.account_manager_email} · {form.account_manager_phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {activeTab === "content" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={lbl}>Welcome message</label>
                <textarea style={{ ...inp(), resize: "vertical" as const }} rows={3} value={form.welcome_msg} onChange={set("welcome_msg")} />
              </div>
              <div>
                <label style={lbl}>Custom CTA text (optional)</label>
                <input style={inp()} value={form.custom_cta} onChange={set("custom_cta")} placeholder="e.g. Order approved print items" />
              </div>
              <div style={{ padding: "14px 16px", background: "var(--az-off-white)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--az-ink)" }}>FAQs page enabled</div>
                  <div style={{ fontSize: 12, color: "var(--az-muted)", marginTop: 1 }}>Show FAQs in portal navigation</div>
                </div>
                <Toggle value={form.faqs_enabled} onChange={v => setForm(f => ({ ...f, faqs_enabled: v }))} />
              </div>
            </div>
          )}

          {/* ── Categories ── */}
          {activeTab === "products" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={lbl}>Product categories (comma-separated)</label>
                <textarea style={{ ...inp(), resize: "vertical" as const }} rows={3} value={form.categories} onChange={set("categories")}
                  placeholder="Accessories, Boards, Misc, PVC, Signs, Window Sticker" />
                <div style={{ fontSize: 11.5, color: "var(--az-muted)", marginTop: 4 }}>These appear as category tabs and cards on the portal homepage.</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {form.categories.split(",").map((c: string) => c.trim()).filter(Boolean).map((cat: string) => (
                  <span key={cat} style={{ padding: "4px 12px", borderRadius: 999, background: form.primary_color, color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{cat}</span>
                ))}
              </div>
              <div style={{ padding: "12px 14px", background: "var(--az-off-white)", borderRadius: 8, fontSize: 13, color: "var(--az-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--az-ink)" }}>Adding products to the catalogue</strong> is managed separately. Once the portal is created, use the portal's Admin page to add individual products and manage the catalogue.
              </div>
            </div>
          )}

          {/* ── Access ── */}
          {activeTab === "access" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Invite code</label>
                  <input style={inp()} value={form.invite_code} onChange={set("invite_code")}
                    placeholder={form.company_name ? autoCode(form.company_name) : "AUTO"} />
                  <div style={{ fontSize: 11.5, color: "var(--az-muted)", marginTop: 3 }}>Share with client contacts to register on their portal.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "12px 14px", background: "var(--az-off-white)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--az-ink)" }}>Portal active</div>
                      <div style={{ fontSize: 11.5, color: "var(--az-muted)" }}>Clients can access this portal</div>
                    </div>
                    <Toggle value={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
                  </div>
                </div>
              </div>
              {!isNew && (
                <div style={{ padding: "14px 16px", background: "#fff", borderRadius: 8, border: "1px solid rgba(26,58,46,0.09)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--az-ink)", marginBottom: 8 }}>Portal links</div>
                  {[
                    { label: "Homepage",     url: `/portal/${form.slug}` },
                    { label: "Request Quote", url: `/portal/${form.slug}/request-quote` },
                    { label: "Admin",        url: `/portal/${form.slug}/admin` },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(26,58,46,0.06)", fontSize: 13 }}>
                      <span style={{ color: "var(--az-muted)", fontWeight: 500 }}>{l.label}</span>
                      <a href={l.url} target="_blank" rel="noreferrer" style={{ color: "#1a3a2e", fontWeight: 600, textDecoration: "none" }}>{l.url} ↗</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(26,58,46,0.09)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={btn(false)}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btn(true), flex: 1, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isNew ? "Create portal →" : "Save changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
export default function ClientPortalsView() {
  const [portals, setPortals] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"portals"|"inbox">("portals");
  const [editing, setEditing] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/portals").then(r => r.json()).catch(() => ({ portals: [] })),
      fetch("/api/portals/requests").then(r => r.json()).catch(() => ({ requests: [] })),
    ]).then(([p, r]) => { setPortals(p.portals || []); setRequests(r.requests || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  // Demo portals shown when DB has no records — reflects real Azure customers
  const DEMO_PORTALS = [
    {
      id: "demo-hh", slug: "hh-global", name: "HH Global · Print Portal",
      company_name: "HH Global", primary_color: "#1a3a2e", accent_color: "#c8e63c",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "HHGLOBAL2026",
      categories: ["Leaflets","Brochures","Mailing","Business Cards","Posters"],
    },
    {
      id: "demo-cust", slug: "custodian", name: "Custodian · Ordering Portal",
      company_name: "Custodian", primary_color: "#1b3a5c", accent_color: "#f5a623",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "CUSTODIAN2026",
      categories: ["Leaflets","Stationery","Brochures","Mailing","Booklets"],
    },
    {
      id: "demo-konica", slug: "konica-minolta", name: "Konica Minolta · Print Hub",
      company_name: "Konica Minolta", primary_color: "#cc0000", accent_color: "#ffffff",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "KONICA2026",
      categories: ["Business Cards","Stationery","Leaflets","Brochures"],
    },
    {
      id: "demo-doe", slug: "dept-of-education", name: "Dept of Education · Print Portal",
      company_name: "Department of Education", primary_color: "#003078", accent_color: "#f5a623",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "DEPTEDUC2026",
      categories: ["Leaflets","Booklets","Mailing","Posters","Stationery","Business Cards"],
    },
    {
      id: "demo-revenue", slug: "revenue-commissioners", name: "Revenue · Stationery Portal",
      company_name: "Revenue Commissioners", primary_color: "#004225", accent_color: "#e8c040",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "REVENUE2026",
      categories: ["Stationery","Business Cards","Leaflets","Mailing"],
    },
    {
      id: "demo-lana", slug: "lana-pharma", name: "Lana Pharma · Print Portal",
      company_name: "Lana Pharma", primary_color: "#2c5f8a", accent_color: "#5ab4e0",
      active: true, account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
      created_at: new Date().toISOString(), invite_code: "LANAPHARMA2026",
      categories: ["Leaflets","Brochures","Mailing","Stationery","Booklets"],
    },
  ];
  const display = portals.length === 0 && !loading ? DEMO_PORTALS : portals;

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1060 }}>
      {editing !== null && <PortalEditor portal={editing} onClose={() => setEditing(null)} onSave={load} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>Client Portals</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--az-muted)" }}>{display.length} portal{display.length !== 1 ? "s" : ""} · all client requests flow to the central inbox</p>
        </div>
        <button onClick={() => setEditing({})} style={btn(true)}>+ Create portal</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#fff", borderRadius: 8, border: "1px solid rgba(26,58,46,0.09)", overflow: "hidden", width: "fit-content" }}>
        {[{ id: "portals", label: `Portals (${display.length})` }, { id: "inbox", label: `Central Inbox (${requests.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding: "8px 18px", border: "none", background: tab === t.id ? "#1a3a2e" : "none", color: tab === t.id ? "#c8e63c" : "var(--az-muted)", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", fontFamily: "var(--az-font)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Portal cards ── */}
      {tab === "portals" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {display.map((p: any) => (
            <div key={p.id} style={{ ...card, overflow: "hidden" }}>
              {/* Coloured header */}
              <div style={{ background: p.primary_color || "#1a3a2e", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: p.accent_color || "#c8e63c", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{p.company_name}</div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{p.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.active ? "#22c55e" : "#9ca3af" }} />
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>{p.active ? "Active" : "Inactive"}</span>
                </div>
              </div>

              <div style={{ padding: "14px 16px" }}>
                {/* URL + actions */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
                  <code style={{ flex: 1, fontSize: 11.5, color: "#1a3a2e", background: "rgba(26,58,46,0.07)", padding: "4px 9px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>/portal/{p.slug}</code>
                  <button onClick={() => copy(window.location.origin + "/portal/" + p.slug, p.id)}
                    style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(26,58,46,0.12)", background: "#fff", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: "var(--az-font)" }}>
                    {copied === p.id ? "✓" : "Copy"}
                  </button>
                  <a href={"/portal/" + p.slug} target="_blank" rel="noreferrer"
                    style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}>
                    Open ↗
                  </a>
                </div>

                {/* Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Account Mgr</div>
                    <div style={{ fontWeight: 600, color: "var(--az-ink)" }}>{p.account_manager_name}</div>
                    <div style={{ color: "var(--az-muted)", fontSize: 11 }}>{p.account_manager_email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Invite Code</div>
                    <code style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#1a3a2e", background: "rgba(26,58,46,0.07)", padding: "2px 7px", borderRadius: 5 }}>{p.invite_code}</code>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 7 }}>
                  <button onClick={() => setEditing(p)}
                    style={{ flex: 1, ...btn(true), textAlign: "center" as const, fontSize: 12.5 }}>
                    ✎ Edit portal
                  </button>
                  <a href={"/portal/" + p.slug + "/admin"} target="_blank" rel="noreferrer"
                    style={{ ...btn(false), fontSize: 12.5, textDecoration: "none" }}>
                    View requests
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Add new */}
          <button onClick={() => setEditing({})}
            style={{ borderRadius: 10, border: "2px dashed rgba(26,58,46,0.18)", background: "#fff", padding: "24px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--az-muted)", fontFamily: "var(--az-font)" }}>
            <span style={{ fontSize: 28, opacity: 0.4 }}>+</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Create new portal</span>
            <span style={{ fontSize: 12 }}>Set up a branded client ordering site</span>
          </button>
        </div>
      )}

      {/* ── Central inbox ── */}
      {tab === "inbox" && (
        <div style={card}>
          {requests.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📥</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--az-ink)", marginBottom: 4 }}>Inbox empty</div>
              <div style={{ fontSize: 13, color: "var(--az-muted)" }}>Quote requests from client portals will appear here.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--az-off-white)", borderBottom: "1px solid rgba(26,58,46,0.09)" }}>
                  {["Reference","Portal","Client","Status","Submitted",""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any, i: number) => (
                  <tr key={r.reference || i} style={{ borderBottom: i < requests.length - 1 ? "1px solid rgba(26,58,46,0.06)" : "none" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1a3a2e", fontSize: 13 }}>{r.reference}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--az-ink)" }}>{r.portal_name}</div>
                      <div style={{ fontSize: 11, color: "var(--az-muted)" }}>/portal/{r.slug}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--az-muted)" }}>{r.user_name}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--az-muted)" }}>
                      {new Date(r.submitted_at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(26,58,46,0.14)", background: "#fff", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--az-font)", color: "var(--az-ink)" }}>Review →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
