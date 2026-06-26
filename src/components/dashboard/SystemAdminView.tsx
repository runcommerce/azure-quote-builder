"use client";
import { useState, useEffect } from "react";

// ── Shared primitives ──────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 12, border: "1px solid rgba(26,58,46,0.09)", boxShadow: "0 1px 8px rgba(14,31,24,0.06)" };
const inp = (w?: string): React.CSSProperties => ({ width: w || "100%", padding: "8px 11px", borderRadius: 7, border: "1.5px solid rgba(26,58,46,0.14)", fontSize: 13.5, fontFamily: "var(--az-font)", color: "#0e1f18", background: "#fff", boxSizing: "border-box" as const });
const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: "#5a7066", display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const priBtn: React.CSSProperties = { padding: "8px 18px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--az-font)" };
const secBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.18)", background: "#fff", color: "#1a3a2e", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" };

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? "#1a3a2e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.18s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: value ? "#c8e63c" : "#fff", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function SectionHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.01em" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 12.5, color: "#5a7066", marginTop: 1 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",    icon: "⊞",  label: "System Overview"    },
  { id: "users",       icon: "👥", label: "Users & Roles"       },
  { id: "branding",    icon: "🎨", label: "Branding"            },
  { id: "integrations",icon: "🔌", label: "Integrations & MCP"  },
  { id: "quoting",     icon: "📋", label: "Quoting Config"      },
  { id: "email",       icon: "📬", label: "Email & Mailbox"     },
  { id: "agents",      icon: "🤖", label: "Agent Config"        },
  { id: "audit",       icon: "📜", label: "Audit Log"           },
  { id: "danger",      icon: "⚠",  label: "Danger Zone"         },
];

// ── Sample data ────────────────────────────────────────────────────────────
const SAMPLE_USERS = [
  { id: "1", name: "Eamonn Grant",   email: "eamonn@standfast.partners", role: "superadmin", active: true,  lastLogin: "Today 09:14",  provider: "Standfast" },
  { id: "2", name: "Jenny Johnston", email: "jenny@azurecomm.ie",         role: "admin",      active: true,  lastLogin: "Today 08:50",  provider: "Azure" },
  { id: "3", name: "Lisa Reid",      email: "lreid@azurecomm.ie",         role: "sales_rep",  active: true,  lastLogin: "Today 09:02",  provider: "Azure" },
  { id: "4", name: "Aaron Herbert",  email: "aaron@azurecomm.ie",         role: "estimator",  active: false, lastLogin: "3 weeks ago",  provider: "Azure" },
  { id: "5", name: "Ciaran D'Arcy",  email: "ciaran@azurecomm.ie",        role: "admin",      active: true,  lastLogin: "Yesterday",    provider: "Azure" },
  { id: "6", name: "Brian Kitson",   email: "brian@azurecomm.ie",         role: "user",       active: true,  lastLogin: "Unknown",      provider: "Azure" },
  { id: "7", name: "David O'Neill",  email: "david@azurecomm.ie",         role: "user",       active: true,  lastLogin: "Unknown",      provider: "Azure" },
];

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  superadmin: { bg: "#1a3a2e",          color: "#c8e63c", label: "Super Admin" },
  admin:      { bg: "rgba(26,58,46,0.1)", color: "#1a3a2e", label: "Admin"       },
  sales_rep:  { bg: "#dbeafe",          color: "#1e40af", label: "Sales Rep"   },
  estimator:  { bg: "#ede9fe",          color: "#5b21b6", label: "Estimator"   },
  viewer:     { bg: "#f3f4f6",          color: "#374151", label: "Viewer"      },
};

const AUDIT_LOG = [
  { time: "Today 09:22", user: "Eamonn Grant",  action: "Enabled Quote Acknowledgement agent",         category: "agent"   },
  { time: "Today 09:18", user: "Eamonn Grant",  action: "Updated Knowledge Base: 170gsm scoring rule", category: "kb"      },
  { time: "Today 08:55", user: "Lisa Reid",      action: "Approved quote draft — HH Global",            category: "quote"   },
  { time: "Today 08:51", user: "Jenny Johnston", action: "Signed in",                                    category: "auth"    },
  { time: "Today 08:50", user: "Lisa Reid",      action: "Signed in",                                    category: "auth"    },
  { time: "Yesterday",   user: "Eamonn Grant",  action: "Created portal: Winthrop Technologies",        category: "portal"  },
  { time: "Yesterday",   user: "Eamonn Grant",  action: "Updated Anthropic API key",                    category: "system"  },
  { time: "Yesterday",   user: "Ciaran D'Arcy",  action: "Added delivery rule: Pallet (€75)",            category: "config"  },
  { time: "3 days ago",  user: "Jenny Johnston", action: "Set default markup to 38%",                    category: "config"  },
  { time: "3 days ago",  user: "Eamonn Grant",  action: "Database initialised (portal tables created)", category: "system"  },
];

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  agent:  { bg: "#dcfce7", color: "#166534" },
  kb:     { bg: "#dbeafe", color: "#1e40af" },
  quote:  { bg: "#e0f2fe", color: "#0369a1" },
  auth:   { bg: "#f3f4f6", color: "#374151" },
  portal: { bg: "#ede9fe", color: "#5b21b6" },
  system: { bg: "#fef3c7", color: "#92400e" },
  config: { bg: "#fce7f3", color: "#9d174d" },
};

// ── Main component ─────────────────────────────────────────────────────────
export default function SystemAdminView() {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [usersLoading, setUsersLoading] = useState(true);
  // Reset password state
  const [resetTarget, setResetTarget]   = useState<{ id: string; name: string; email: string } | null>(null);
  const [resetResult, setResetResult]   = useState<{ link: string; sent: boolean; email: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [copiedLink, setCopiedLink]     = useState(false);

  // Load real users from DB
  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => {
        if (data.users && data.users.length > 0) {
          // Merge DB users with SAMPLE_USERS metadata (lastLogin, provider)
          const merged = data.users.map((u: { id: string; name: string; email: string; role: string }) => {
            const sample = SAMPLE_USERS.find(s => s.email === u.email);
            return {
              ...u,
              active: true,
              lastLogin: sample?.lastLogin ?? "—",
              provider: sample?.provider ?? "Azure",
            };
          });
          setUsers(merged);
        }
      })
      .catch(() => { /* fall back to SAMPLE_USERS */ })
      .finally(() => setUsersLoading(false));
  }, []);

  const handleReset = async (user: { id: string; name: string; email: string }) => {
    setResetTarget(user);
    setResetResult(null);
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/users/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.resetLink) {
        setResetResult({ link: data.resetLink, sent: !!data.sent, email: data.email ?? user.email });
      }
    } catch {
      setResetResult({ link: "", sent: false, email: user.email });
    } finally {
      setResetLoading(false);
    }
  };
  const [saved, setSaved] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("sales_rep");
  const [confirmDanger, setConfirmDanger] = useState("");

  // Branding state
  const [branding, setBranding] = useState({
    appName: "Azure IQ", tagline: "Quote faster. Stay consistent.",
    primaryColor: "#1a3a2e", accentColor: "#c8e63c",
    logoUrl: "/azure-logo.png", faviconUrl: "",
    supportEmail: "lreid@azurecomm.ie", supportPhone: "01 531 2695",
  });

  // Integration status
  const INTEGRATIONS = [
    { id: "anthropic",   name: "Anthropic Claude API", desc: "AI extraction and agent reasoning", status: "unknown",      key: "ANTHROPIC_API_KEY",   link: "https://console.anthropic.com" },
    { id: "postgres",    name: "Vercel Postgres",       desc: "Primary database (portals, users, quotes)", status: "connected", key: "POSTGRES_URL",        link: "https://vercel.com/storage" },
    { id: "resend",      name: "Resend (Email)",        desc: "Transactional email — password reset, follow-ups", status: "missing", key: "RESEND_API_KEY",   link: "https://resend.com" },
    { id: "imap",        name: "IMAP Mailbox",          desc: "quotes@azurecomm.ie incoming email polling", status: "missing",   key: "IMAP_HOST",           link: "" },
    { id: "printlogic",  name: "PrintLogic API",        desc: "Job creation and pricing (David O'Neill)", status: "missing",   key: "PRINTLOGIC_API_KEY",  link: "" },
    { id: "mtivity",     name: "Mtivity",               desc: "HH Global / Custodian portal orders (Ciaran)", status: "missing", key: "MTIVITY_API_KEY",  link: "" },
    { id: "nextauth",    name: "NextAuth",              desc: "Session management and JWT signing", status: "connected",     key: "NEXTAUTH_SECRET",     link: "" },
  ];

  const STATUS_STYLE = {
    connected: { bg: "#dcfce7", color: "#166534", dot: "#22c55e", label: "Connected"  },
    missing:   { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Not set"    },
    unknown:   { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "Unverified" },
    error:     { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Error"      },
  };

  const save = (label: string) => { setSaved(label); setTimeout(() => setSaved(null), 2500); };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(26,58,46,0.07)", alignItems: "start" }}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0e1f18" }}>{label}</div>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: "16px 24px 40px", maxWidth: 1040, fontFamily: "var(--az-font)" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ padding: "3px 10px", borderRadius: 999, background: "#1a3a2e", color: "#c8e63c", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase" as const }}>
              Super Admin
            </div>
          </div>
          <h1 style={{ margin: "0 0 3px", fontSize: 22, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>System Administration</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#5a7066" }}>Full platform configuration — users, integrations, branding, audit log and system health.</p>
        </div>
        {saved && (
          <div style={{ padding: "8px 16px", borderRadius: 8, background: "#dcfce7", border: "1px solid #86efac", color: "#166534", fontSize: 13, fontWeight: 600 }}>
            ✓ {saved} saved
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#fff", borderRadius: 10, border: "1px solid rgba(26,58,46,0.09)", overflow: "hidden", flexWrap: "wrap" as const }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#1a3a2e" : "#5a7066", borderBottom: tab === t.id ? "2px solid #1a3a2e" : "2px solid transparent", fontFamily: "var(--az-font)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as const }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          OVERVIEW
      ════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Health grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Platform version",   val: "v2.1.0",           icon: "🚀", sub: "Deployed today" },
              { label: "Active users",        val: String(users.filter(u => u.active).length), icon: "👥", sub: "of " + users.length + " total" },
              { label: "Integrations active", val: String(INTEGRATIONS.filter(i => i.status === "connected").length), icon: "🔌", sub: "of " + INTEGRATIONS.length + " configured" },
              { label: "Database",            val: "Healthy",          icon: "🗄", sub: "Vercel Postgres / Neon" },
            ].map(k => (
              <div key={k.label} style={{ ...card, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>{k.val}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Integration status quick view */}
          <div style={card}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,58,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18" }}>Integration status</div>
              <button onClick={() => setTab("integrations")} style={{ fontSize: 12, color: "#1a3a2e", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Manage →</button>
            </div>
            {INTEGRATIONS.map(i => {
              const s = STATUS_STYLE[i.status as keyof typeof STATUS_STYLE];
              return (
                <div key={i.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,58,46,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0e1f18" }}>{i.name}</span>
                    <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{i.desc}</span>
                  </div>
                  <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                  {i.status === "missing" && (
                    <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{i.key}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent audit */}
          <div style={card}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,58,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18" }}>Recent activity</div>
              <button onClick={() => setTab("audit")} style={{ fontSize: 12, color: "#1a3a2e", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Full log →</button>
            </div>
            {AUDIT_LOG.slice(0, 5).map((e, i) => {
              const cs = CAT_STYLE[e.category] || CAT_STYLE.config;
              return (
                <div key={i} style={{ padding: "9px 16px", borderBottom: i < 4 ? "1px solid rgba(26,58,46,0.06)" : "none", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: cs.bg, color: cs.color, whiteSpace: "nowrap" as const }}>{e.category}</span>
                  <span style={{ fontSize: 13, color: "#0e1f18", flex: 1 }}>{e.action}</span>
                  <span style={{ fontSize: 11.5, color: "#9ca3af", whiteSpace: "nowrap" as const }}>{e.user} · {e.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          USERS & ROLES
      ════════════════════════════════════════════════════════════ */}
      {tab === "users" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="👥" title="Users & Roles" desc="Manage who has access to Azure IQ and what they can do." />

          {/* Role reference */}
          <div style={{ ...card, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>Role permissions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { role: "superadmin", perms: ["Everything", "System admin", "All config", "All data", "Danger zone"] },
                { role: "admin",      perms: ["All quotes", "All portals", "Users (limited)", "Agents", "Knowledge base"] },
                { role: "sales_rep",  perms: ["Own quotes", "Email parser", "Upload RFQ", "Customers", "View portals"] },
                { role: "estimator",  perms: ["Own quotes", "Pricing data", "Knowledge base", "PrintLogic", "—"] },
                { role: "viewer",     perms: ["View quotes", "View portals", "Read only", "—", "—"] },
              ].map(r => {
                const rs = ROLE_STYLES[r.role];
                return (
                  <div key={r.role} style={{ borderRadius: 8, border: "1px solid rgba(26,58,46,0.09)", overflow: "hidden" }}>
                    <div style={{ padding: "8px 10px", background: rs.bg }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: rs.color, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{rs.label}</span>
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      {r.perms.map((p, i) => <div key={i} style={{ fontSize: 11.5, color: p === "—" ? "#d1d5db" : "#374151", padding: "2px 0" }}>{p !== "—" ? "✓ " : ""}{p}</div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Users table */}
          <div style={card}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(26,58,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18" }}>{usersLoading ? "Loading…" : `${users.length} users`}</div>
              <button onClick={() => setShowInvite(true)} style={priBtn}>+ Invite user</button>
            </div>

            {showInvite && (
              <div style={{ padding: "14px 16px", background: "rgba(26,58,46,0.03)", borderBottom: "1px solid rgba(26,58,46,0.08)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18", marginBottom: 10 }}>Invite a new user</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 180px auto auto", gap: 10, alignItems: "flex-end" }}>
                  <div>
                    <label style={lbl}>Email address</label>
                    <input style={inp()} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@azurecomm.ie" />
                  </div>
                  <div>
                    <label style={lbl}>Role</label>
                    <select style={inp()} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                      <option value="sales_rep">Sales Rep</option>
                      <option value="estimator">Estimator</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <button onClick={() => { if (inviteEmail) { save("Invite sent"); setInviteEmail(""); setShowInvite(false); }}} style={priBtn}>Send invite</button>
                  <button onClick={() => setShowInvite(false)} style={secBtn}>Cancel</button>
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>An email will be sent with a signup link. They will use invite code: <code style={{ background: "rgba(26,58,46,0.08)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>AZURE2026</code></div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(26,58,46,0.03)", borderBottom: "1px solid rgba(26,58,46,0.08)" }}>
                  {["User","Email","Role","Status","Last login",""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left" as const, fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const rs = ROLE_STYLES[u.role];
                  return (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid rgba(26,58,46,0.06)" : "none" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.active ? "linear-gradient(135deg, #1a3a2e, #2a5a46)" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: u.active ? "#c8e63c" : "#9ca3af", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {u.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0e1f18" }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#5a7066" }}>{u.email}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <select value={u.role} onChange={e => setUsers(prev => prev.map(uu => uu.id === u.id ? { ...uu, role: e.target.value } : uu))}
                          style={{ ...inp("140px"), background: rs.bg, color: rs.color, fontWeight: 700, border: "none" }}>
                          {Object.entries(ROLE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Toggle value={u.active} onChange={v => setUsers(prev => prev.map(uu => uu.id === u.id ? { ...uu, active: v } : uu))} />
                          <span style={{ fontSize: 12, color: u.active ? "#166534" : "#9ca3af" }}>{u.active ? "Active" : "Disabled"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#9ca3af" }}>{u.lastLogin}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleReset({ id: u.id, name: u.name, email: u.email })}
                            style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 11.5, cursor: "pointer" }}>
                            🔑 Reset pwd
                          </button>
                          {u.role !== "superadmin" && (
                            <button onClick={() => setUsers(prev => prev.filter(uu => uu.id !== u.id))}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 11.5, cursor: "pointer" }}>
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Reset password result panel ── */}
          {resetTarget && (
            <div style={{ margin: "16px 0 0", padding: "16px 20px", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0e1f18" }}>
                  🔑 Password reset — {resetTarget.name}
                </div>
                <button onClick={() => { setResetTarget(null); setResetResult(null); setCopiedLink(false); }}
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>×</button>
              </div>

              {resetLoading && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>Generating reset link…</div>
              )}

              {!resetLoading && resetResult && resetResult.link && (
                <div>
                  {resetResult.sent ? (
                    <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#166534", marginBottom: 12 }}>
                      ✓ Reset email sent to <strong>{resetResult.email}</strong>
                    </div>
                  ) : (
                    <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 13, color: "#92400e", marginBottom: 12 }}>
                      ⚠ Email not sent (Resend not configured). Copy the link below and share it manually.
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Reset link (expires in 1 hour)</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input readOnly value={resetResult.link}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", background: "#f9fafb", fontFamily: "monospace" }} />
                    <button onClick={() => { navigator.clipboard.writeText(resetResult.link); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2500); }}
                      style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                      {copiedLink ? "✓ Copied" : "Copy link"}
                    </button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => handleReset(resetTarget)}
                      style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Generate new link
                    </button>
                  </div>
                </div>
              )}

              {!resetLoading && resetResult && !resetResult.link && (
                <div style={{ fontSize: 13, color: "#dc2626" }}>Failed to generate reset link. Check server logs.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          BRANDING
      ════════════════════════════════════════════════════════════ */}
      {tab === "branding" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="🎨" title="Branding" desc="Platform name, colours, logo and contact details — applied across all admin views and portal headers." />
          <div style={card}>
            <div style={{ padding: "4px 16px 16px" }}>
              <Row label="App / platform name">
                <input style={inp("300px")} value={branding.appName} onChange={e => setBranding(b => ({ ...b, appName: e.target.value }))} />
              </Row>
              <Row label="Tagline">
                <input style={inp()} value={branding.tagline} onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))} />
              </Row>
              <Row label="Support email">
                <input style={inp("280px")} value={branding.supportEmail} onChange={e => setBranding(b => ({ ...b, supportEmail: e.target.value }))} />
              </Row>
              <Row label="Support phone">
                <input style={inp("200px")} value={branding.supportPhone} onChange={e => setBranding(b => ({ ...b, supportPhone: e.target.value }))} />
              </Row>
              <Row label="Primary colour">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))}
                    style={{ width: 40, height: 34, borderRadius: 6, border: "1px solid rgba(26,58,46,0.14)", cursor: "pointer", padding: 2 }} />
                  <input style={inp("120px")} value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Sidebar, buttons, dark surfaces</span>
                </div>
              </Row>
              <Row label="Accent colour">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={branding.accentColor} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))}
                    style={{ width: 40, height: 34, borderRadius: 6, border: "1px solid rgba(26,58,46,0.14)", cursor: "pointer", padding: 2 }} />
                  <input style={inp("120px")} value={branding.accentColor} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Active nav, lime highlights, CTAs</span>
                </div>
              </Row>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(26,58,46,0.09)" }}>
            <div style={{ background: branding.primaryColor, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <img src="/azure-logo.png" alt="" style={{ height: 24, opacity: 0.9 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: branding.accentColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>{branding.appName}</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 1 }}>{branding.tagline}</div>
              </div>
              <div style={{ padding: "7px 16px", borderRadius: 999, background: branding.accentColor, color: branding.primaryColor, fontSize: 12.5, fontWeight: 800 }}>+ New quote →</div>
            </div>
            <div style={{ background: "#fff", padding: "10px 20px", fontSize: 12.5, color: "#5a7066" }}>
              Support: {branding.supportEmail} · {branding.supportPhone}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => save("Branding")} style={priBtn}>Save branding →</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          INTEGRATIONS
      ════════════════════════════════════════════════════════════ */}
      {tab === "integrations" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="🔌" title="Integrations & MCP" desc="API keys, external services, and Model Context Protocol connectors." />

          {INTEGRATIONS.map(intg => {
            const s = STATUS_STYLE[intg.status as keyof typeof STATUS_STYLE];
            return (
              <div key={intg.id} style={{ ...card, padding: "16px 18px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0e1f18" }}>{intg.name}</span>
                      <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#5a7066", marginBottom: 10 }}>{intg.desc}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                      <div>
                        <label style={lbl}>{intg.key}</label>
                        <input style={inp()} type="password" placeholder={intg.status === "connected" ? "••••••••••••••••••••••" : "Not configured — add in Vercel environment variables"} readOnly={intg.status === "connected"} />
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {intg.link && (
                          <a href={intg.link} target="_blank" rel="noreferrer" style={{ ...secBtn, textDecoration: "none", display: "inline-block", paddingTop: 8 }}>
                            Open ↗
                          </a>
                        )}
                        {intg.status === "missing" && (
                          <div style={{ padding: "8px 12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
                            Set in Vercel → Settings → Environment Variables
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* MCP section */}
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18", marginBottom: 6 }}>Model Context Protocol (MCP)</div>
            <div style={{ fontSize: 13, color: "#5a7066", marginBottom: 14, lineHeight: 1.6 }}>
              MCP connectors allow the AI agents to interact with external systems — reading emails, querying PrintLogic, writing to CRM — as authorised tools with scoped permissions.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { name: "Email (IMAP read)",     status: "missing", scope: "Read unread emails from quotes@azurecomm.ie" },
                { name: "Email (SMTP send)",      status: "missing", scope: "Send approved draft emails via Resend API" },
                { name: "PrintLogic (read)",      status: "missing", scope: "Look up stock, job types, costed quote history" },
                { name: "PrintLogic (write)",     status: "missing", scope: "Create costed quotes when approved by human" },
                { name: "Mtivity (read)",         status: "missing", scope: "Pull incoming RFQs from HH Global / Custodian" },
                { name: "Knowledge Base (read)",  status: "connected", scope: "Agents read all confirmed KB entries per query" },
              ].map(mcp => {
                const ms = STATUS_STYLE[mcp.status as keyof typeof STATUS_STYLE];
                return (
                  <div key={mcp.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(26,58,46,0.02)", borderRadius: 8, border: "1px solid rgba(26,58,46,0.08)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: ms.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0e1f18" }}>{mcp.name}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{mcp.scope}</span>
                    </div>
                    <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: ms.bg, color: ms.color }}>{ms.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          QUOTING CONFIG
      ════════════════════════════════════════════════════════════ */}
      {tab === "quoting" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="📋" title="Quoting Configuration" desc="All settings that affect how quotes are built, priced and presented. These are the core operational settings for Aaron and Jenny." />
          <div style={{ padding: "12px 16px", background: "#fef3c7", borderRadius: 10, border: "1px solid #fcd34d", fontSize: 13, color: "#92400e" }}>
            ℹ These settings are also accessible from <strong>Admin Settings</strong> in the main sidebar (Job Types, Materials, Delivery Rules, Quote Fields tabs). This view consolidates all of them here for super-admin review.
          </div>

          {[
            { label: "Default markup %", key: "markup", val: "38", unit: "%", desc: "Applied to all jobs unless overridden per customer or job type" },
            { label: "High-value quote threshold", key: "hvt", val: "5000", unit: "€", desc: "Quotes above this always require human pricing approval before dispatch" },
            { label: "Quote valid for (days)", key: "validity", val: "30", unit: "days", desc: "How long a quote is considered valid before expiry" },
            { label: "Charity rate markup %", key: "charity", val: "30", unit: "%", desc: "Applied to registered charity accounts (Barnardos etc.)" },
            { label: "Portal customer rate", key: "portal", val: "Contract", unit: "", desc: "Portal customers (HH Global, Custodian, Konica) use agreed contract rates — not standard markup" },
          ].map(s => (
            <div key={s.key} style={{ ...card, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0e1f18", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: "#5a7066" }}>{s.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {s.unit && s.unit !== "" && s.val !== "Contract" ? (
                  <>
                    <input defaultValue={s.val} style={{ ...inp("80px"), textAlign: "right" as const }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#5a7066" }}>{s.unit}</span>
                  </>
                ) : (
                  <div style={{ padding: "6px 14px", background: "rgba(26,58,46,0.08)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#1a3a2e" }}>{s.val} {s.unit}</div>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => save("Quoting config")} style={{ ...priBtn, width: "fit-content" }}>Save quoting config →</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          EMAIL & MAILBOX
      ════════════════════════════════════════════════════════════ */}
      {tab === "email" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="📬" title="Email & Mailbox" desc="IMAP connection, SMTP sending, auto-parse settings and email templates." />

          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18", marginBottom: 14 }}>IMAP — incoming mail (quotes@azurecomm.ie)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "IMAP Host", key: "host", placeholder: "imap.azurecomm.ie" },
                { label: "Port", key: "port", placeholder: "993" },
                { label: "Email address", key: "user", placeholder: "quotes@azurecomm.ie" },
                { label: "Password", key: "pass", placeholder: "••••••••", type: "password" },
                { label: "Folder to watch", key: "folder", placeholder: "INBOX" },
                { label: "Check every", key: "interval", placeholder: "5 minutes" },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input style={inp()} type={f.type || "text"} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => save("IMAP settings")} style={priBtn}>Save & test connection</button>
              <button style={secBtn}>Test only</button>
            </div>
          </div>

          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18", marginBottom: 14 }}>Auto-acknowledgement template</div>
            <textarea rows={8} defaultValue={"Hi {{customer_name}},\n\nThank you for your quote request. We've received your enquiry and will have a full quote back to you within 8 business hours.\n\nIf you need anything urgently, please call Lisa Reid on 01 531 2695.\n\nKind regards,\nLisa Reid\nAzure Communications"}
              style={{ ...inp(), resize: "vertical" as const, fontFamily: "monospace", fontSize: 13, lineHeight: 1.7 }} />
            <div style={{ marginTop: 10 }}>
              <button onClick={() => save("Email template")} style={priBtn}>Save template</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          AGENT CONFIG
      ════════════════════════════════════════════════════════════ */}
      {tab === "agents" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="🤖" title="Agent Configuration" desc="System-level agent settings. Per-agent toggles are in Agent Hub." />
          <div style={{ padding: "12px 16px", background: "#fef3c7", borderRadius: 10, border: "1px solid #fcd34d", fontSize: 13, color: "#92400e" }}>
            ℹ Individual agent toggles, modes and confidence thresholds are set in the <strong>Agent Hub</strong> view. This tab covers system-wide agent settings.
          </div>
          {[
            { label: "AI model", val: "claude-sonnet-4-6", desc: "Model used for all extraction and agent reasoning" },
            { label: "Max tokens per request", val: "2000", desc: "Token limit per API call — affects depth of analysis" },
            { label: "Monthly spend cap", val: "$65 (~€60)", desc: "Set at console.anthropic.com → Settings → Limits" },
            { label: "Agent run log retention", val: "30 days", desc: "How long agent reasoning trails are kept in the queue" },
            { label: "Escalation email", val: "jenny@azurecomm.ie", desc: "Where to send agent escalation alerts (high-value quotes, angry customers etc.)" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "13px 16px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0e1f18", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: "#5a7066" }}>{s.desc}</div>
              </div>
              <div style={{ padding: "6px 14px", background: "rgba(26,58,46,0.07)", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#1a3a2e", fontFamily: "monospace", whiteSpace: "nowrap" as const }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          AUDIT LOG
      ════════════════════════════════════════════════════════════ */}
      {tab === "audit" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="📜" title="Audit Log" desc="Every configuration change, user action and agent decision — timestamped and attributed." />
          <div style={card}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,58,46,0.08)", display: "flex", gap: 10 }}>
              <select style={{ ...inp("140px") }}>
                <option>All categories</option>
                <option>Agent</option><option>Quote</option><option>Config</option><option>Auth</option><option>Portal</option><option>System</option>
              </select>
              <select style={{ ...inp("140px") }}>
                <option>All users</option>
                {users.map(u => <option key={u.id}>{u.name}</option>)}
              </select>
              <select style={{ ...inp("140px") }}>
                <option>Last 30 days</option><option>Last 7 days</option><option>Today</option>
              </select>
              <button style={{ ...secBtn, marginLeft: "auto" }}>Export CSV</button>
            </div>
            {AUDIT_LOG.map((e, i) => {
              const cs = CAT_STYLE[e.category] || CAT_STYLE.config;
              return (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < AUDIT_LOG.length - 1 ? "1px solid rgba(26,58,46,0.06)" : "none", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" as const, minWidth: 110 }}>{e.time}</span>
                  <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: cs.bg, color: cs.color, whiteSpace: "nowrap" as const }}>{e.category}</span>
                  <span style={{ fontSize: 13.5, color: "#0e1f18", flex: 1 }}>{e.action}</span>
                  <span style={{ fontSize: 12.5, color: "#5a7066", whiteSpace: "nowrap" as const }}>{e.user}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          DANGER ZONE
      ════════════════════════════════════════════════════════════ */}
      {tab === "danger" && (
        <div style={{ display: "grid", gap: 14 }}>
          <SectionHeader icon="⚠" title="Danger Zone" desc="Irreversible actions. Type the confirmation phrase before each action unlocks." />

          {[
            { label: "Reset all agent settings",   desc: "Disables all agents, clears modes and confidence thresholds. Knowledge Base and Guardrails are not affected.", confirm: "reset agents",    action: "Reset agents",      severity: "high"     },
            { label: "Clear Knowledge Base",        desc: "Deletes all Knowledge Base entries. Agents will lose all trained rules and pricing knowledge. Irreversible.", confirm: "clear knowledge", action: "Clear KB",          severity: "critical" },
            { label: "Flush Agent Queue",           desc: "Permanently deletes all pending, approved and rejected queue items. Cannot be undone.",                       confirm: "flush queue",     action: "Flush queue",       severity: "high"     },
            { label: "Reset invite code",           desc: "Generates a new invite code. Anyone with the old code will no longer be able to sign up.",                   confirm: "reset invite",    action: "Reset invite code", severity: "medium"   },
            { label: "Delete all portal data",      desc: "Permanently deletes all client portals, portal users and portal requests from the database.",                 confirm: "delete portals",  action: "Delete portals",    severity: "critical" },
          ].map(d => {
            const colors = d.severity === "critical" ? { bg: "#fee2e2", border: "#fca5a5", btn: "#dc2626", text: "#991b1b" } : d.severity === "high" ? { bg: "#fef3c7", border: "#fcd34d", btn: "#d97706", text: "#92400e" } : { bg: "#f3f4f6", border: "#e5e7eb", btn: "#374151", text: "#374151" };
            return (
              <div key={d.label} style={{ background: colors.bg, borderRadius: 12, border: `1.5px solid ${colors.border}`, padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: colors.text, marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 13, color: colors.text, opacity: 0.85, marginBottom: 12, lineHeight: 1.5 }}>{d.desc}</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={confirmDanger} onChange={e => setConfirmDanger(e.target.value)}
                    placeholder={`Type "${d.confirm}" to unlock`}
                    style={{ ...inp("240px"), background: "#fff" }} />
                  <button
                    disabled={confirmDanger !== d.confirm}
                    onClick={() => { setConfirmDanger(""); save(d.action + " completed"); }}
                    style={{ padding: "8px 18px", borderRadius: 999, border: "none", background: confirmDanger === d.confirm ? colors.btn : "#e5e7eb", color: confirmDanger === d.confirm ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 700, cursor: confirmDanger === d.confirm ? "pointer" : "not-allowed", fontFamily: "var(--az-font)" }}>
                    {d.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
