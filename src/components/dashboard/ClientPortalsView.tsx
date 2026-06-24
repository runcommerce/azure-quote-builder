/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { C } from "./tokens";

interface Portal {
  id: string; slug: string; name: string; company_name: string;
  primary_color: string; accent_color: string; active: boolean;
  account_manager_name: string; account_manager_email: string;
  created_at: string; invite_code: string;
}

interface Request {
  reference: string; portal_name: string; slug: string; user_name: string;
  status: string; submitted_at: string;
}

// ── Create Portal Modal ────────────────────────────────────────────────────
function CreatePortalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    slug: "", name: "", company_name: "",
    account_manager_name: "Lisa Reid",
    account_manager_email: "lreid@azurecomm.ie",
    account_manager_phone: "01 531 2695",
    welcome_msg: "Welcome to your print & signage portal.",
    primary_color: "#183230", accent_color: "#c8e63c",
    invite_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Auto-generate slug from company name
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const autoCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + "2026";

  const handleCreate = async () => {
    if (!form.slug || !form.company_name) { setError("Slug and company name are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/portals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, invite_code: form.invite_code || autoCode(form.company_name) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onCreated();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: C.dark, boxSizing: "border-box" as const };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 640, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ background: C.navy, borderRadius: "16px 16px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 3 }}>Client Portals</div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 18 }}>Create new client portal</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: C.white, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {error && <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Company name *</label>
                <input style={inp} value={form.company_name}
                  onChange={e => { set("company_name")(e); setForm(f => ({ ...f, company_name: e.target.value, slug: f.slug || autoSlug(e.target.value) })); }}
                  placeholder="Winthrop Technologies" />
              </div>
              <div>
                <label style={lbl}>Portal slug (URL) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>/portal/</span>
                  <input style={{ ...inp, paddingLeft: 56 }} value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="winthrop" />
                </div>
                {form.slug && <div style={{ fontSize: 11, color: C.azure, marginTop: 3 }}>→ azure-quote-builder.vercel.app/portal/{form.slug}</div>}
              </div>
            </div>

            <div>
              <label style={lbl}>Portal display name</label>
              <input style={inp} value={form.name}
                onChange={set("name")} placeholder="Winthrop · Print Portal" />
            </div>

            <div>
              <label style={lbl}>Welcome message</label>
              <textarea style={{ ...inp, resize: "vertical" } as React.CSSProperties} rows={2} value={form.welcome_msg} onChange={set("welcome_msg")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Account manager name</label>
                <input style={inp} value={form.account_manager_name} onChange={set("account_manager_name")} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} value={form.account_manager_email} onChange={set("account_manager_email")} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp} value={form.account_manager_phone} onChange={set("account_manager_phone")} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Primary colour</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={form.primary_color}
                    onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    style={{ width: 40, height: 36, borderRadius: 6, border: `1px solid ${C.grey}`, cursor: "pointer", padding: 2 }} />
                  <input style={{ ...inp, flex: 1 }} value={form.primary_color} onChange={set("primary_color")} />
                </div>
              </div>
              <div>
                <label style={lbl}>Accent colour</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={form.accent_color}
                    onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                    style={{ width: 40, height: 36, borderRadius: 6, border: `1px solid ${C.grey}`, cursor: "pointer", padding: 2 }} />
                  <input style={{ ...inp, flex: 1 }} value={form.accent_color} onChange={set("accent_color")} />
                </div>
              </div>
              <div>
                <label style={lbl}>Invite code</label>
                <input style={inp} value={form.invite_code}
                  onChange={set("invite_code")} placeholder={form.company_name ? autoCode(form.company_name) : "AUTO"} />
              </div>
            </div>

            {/* Live preview */}
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.grey}` }}>
              <div style={{ background: form.primary_color, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <img src="/azure-logo.png" alt="" style={{ height: 20, width: "auto", opacity: 0.9 }} />
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.25)" }} />
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{form.company_name || "Client Name"}</span>
              </div>
              <div style={{ background: form.primary_color, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: form.accent_color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{(form.company_name || "CLIENT").toUpperCase()} · ONLINE ORDERING PORTAL</div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginTop: 4, lineHeight: 1.2 }}>{form.welcome_msg.slice(0, 40)}…</div>
                </div>
                <div style={{ padding: "8px 16px", borderRadius: 20, background: form.accent_color, color: form.primary_color, fontSize: 12, fontWeight: 700 }}>Request a quote →</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 9, border: `1px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={loading}
              style={{ flex: 2, padding: "12px 0", borderRadius: 9, border: "none", background: C.navy, color: C.white, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Roboto, sans-serif" }}>
              {loading ? "Creating…" : "Create portal →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
export default function ClientPortalsView() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"portals"|"inbox">("portals");
  const [copied, setCopied] = useState<string|null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/portals").then(r => r.json()).catch(() => ({ portals: [] })),
      fetch("/api/portals/requests").then(r => r.json()).catch(() => ({ requests: [] })),
    ]).then(([p, r]) => {
      setPortals(p.portals || []);
      setRequests(r.requests || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  // Winthrop demo portal (pre-seeded)
  const DEMO_PORTALS: Portal[] = portals.length === 0 ? [{
    id: "demo", slug: "winthrop", name: "Winthrop Technologies",
    company_name: "Winthrop Technologies", primary_color: "#183230",
    accent_color: "#c8e63c", active: true, account_manager_name: "Lisa Reid",
    account_manager_email: "lreid@azurecomm.ie", created_at: new Date().toISOString(),
    invite_code: "WINTHROP2026",
  }] : portals;

  const STATUS_BADGE = (s: string) => ({
    pending:   { bg: "#FEF3C7", color: "#92400E" },
    reviewing: { bg: "#DBEAFE", color: "#1E40AF" },
    quoted:    { bg: "#D1FAE5", color: "#065F46" },
  }[s] || { bg: C.offWhite, color: C.muted });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {showCreate && <CreatePortalModal onClose={() => setShowCreate(false)} onCreated={loadData} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.dark }}>Client Portals</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted }}>
            {DEMO_PORTALS.length} portal{DEMO_PORTALS.length !== 1 ? "s" : ""} · all client requests flow into the central inbox
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: "11px 22px", borderRadius: 9, border: "none", background: C.navy, color: C.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          + Create portal
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.white, borderRadius: 10, border: `1px solid ${C.grey}`, overflow: "hidden", width: "fit-content" }}>
        {[
          { id: "portals", label: `🏢 Portals (${DEMO_PORTALS.length})` },
          { id: "inbox",   label: `📥 Central Inbox (${requests.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as "portals"|"inbox")}
            style={{ padding: "10px 20px", border: "none", background: tab === t.id ? C.navy : "none", color: tab === t.id ? C.white : C.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Portals grid */}
      {tab === "portals" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {DEMO_PORTALS.map(p => (
            <div key={p.id} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.grey}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {/* Portal header */}
              <div style={{ background: p.primary_color, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: p.accent_color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{p.company_name}</div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.active ? "#22c55e" : "#9ca3af" }} title={p.active ? "Active" : "Inactive"} />
              </div>

              <div style={{ padding: "16px 18px" }}>
                {/* URL */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 12, color: C.azure, background: C.azureLight, padding: "5px 10px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    /portal/{p.slug}
                  </div>
                  <button onClick={() => copy(`${window.location.origin}/portal/${p.slug}`, p.id)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.grey}`, background: C.white, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                    {copied === p.id ? "✓ Copied" : "Copy link"}
                  </button>
                  <a href={`/portal/${p.slug}`} target="_blank" rel="noreferrer"
                    style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: C.navy, color: C.white, fontSize: 12, textDecoration: "none" }}>
                    Open ↗
                  </a>
                </div>

                {/* Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 2 }}>Account Manager</div>
                    <div style={{ color: C.dark, fontWeight: 500 }}>{p.account_manager_name}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{p.account_manager_email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 2 }}>Invite Code</div>
                    <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: C.navy, background: C.offWhite, padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>
                      {p.invite_code}
                    </div>
                  </div>
                </div>

                {/* Created */}
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                  Created {new Date(p.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/portal/${p.slug}/admin`} target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: "8px 0", textAlign: "center" as const, borderRadius: 8, border: "none", background: C.navy, color: C.white, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    View requests
                  </a>
                  <button style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.grey}`, background: C.white, fontSize: 13, cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button onClick={() => setShowCreate(true)}
            style={{ borderRadius: 14, border: `2px dashed ${C.grey}`, background: C.white, padding: "32px 20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: C.muted, fontFamily: "Roboto, sans-serif", transition: "border-color 0.15s" }}>
            <span style={{ fontSize: 32 }}>+</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Create new portal</span>
            <span style={{ fontSize: 13 }}>Set up a branded client ordering site</span>
          </button>
        </div>
      )}

      {/* Central inbox */}
      {tab === "inbox" && (
        <div>
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, overflow: "hidden" }}>
            {requests.length === 0 ? (
              <div style={{ padding: "64px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📥</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Inbox is empty</div>
                <div style={{ fontSize: 14, color: C.muted }}>Quote requests submitted through client portals will appear here.</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.offWhite, borderBottom: `1px solid ${C.grey}` }}>
                    {["Reference","Portal","Client User","Status","Submitted",""].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => {
                    const s = STATUS_BADGE(r.status);
                    return (
                      <tr key={r.reference} style={{ borderBottom: i < requests.length - 1 ? `1px solid ${C.grey}` : "none" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: C.azure, fontSize: 14 }}>{r.reference}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{r.portal_name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>/portal/{r.slug}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.greyDark }}>{r.user_name}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{r.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                          {new Date(r.submitted_at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.grey}`, background: C.white, fontSize: 12, cursor: "pointer" }}>Review →</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
