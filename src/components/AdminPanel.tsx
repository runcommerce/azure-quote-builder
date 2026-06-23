"use client";
import { useState } from "react";
import { B } from "@/lib/types";
import type { AdminConfig, ApiConfig } from "@/lib/types";

interface Props {
  admin: AdminConfig;
  setAdmin: (a: AdminConfig) => void;
  apiConfig: ApiConfig;
  setApiConfig: (c: ApiConfig) => void;
  onClose: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? B.azure : B.grey, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: B.white, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

const TABS = [
  { id: "api", label: "API" },
  { id: "customers", label: "Portals" },
  { id: "jobtypes", label: "Job Types" },
  { id: "materials", label: "Materials" },
  { id: "delivery", label: "Delivery" },
  { id: "followup", label: "Follow-up" },
  { id: "users", label: "Users" },
];

export default function AdminPanel({ admin, setAdmin, apiConfig, setApiConfig, onClose }: Props) {
  const [tab, setTab] = useState("api");
  const [users, setUsers] = useState<Array<{id:string;name:string;email:string;role:string;created_at:string}>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  const loadUsers = async () => {
    setUsersLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
    setUsersLoading(false);
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm('Remove ' + name + '? This cannot be undone.')) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id}) });
    setUserMsg(name + ' removed.');
    loadUsers();
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const role = currentRole === "admin" ? "user" : "admin";
    await fetch("/api/admin/users", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id, role}) });
    loadUsers();
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 6, boxSizing: "border-box", border: `1px solid ${B.grey}`, fontSize: 13, fontFamily: "Roboto, sans-serif", color: B.dark, background: B.white };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: B.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" };

  const provider = apiConfig.provider;
  const providerCfg = apiConfig[provider] as { endpoint: string; model: string; apiKey: string };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,50,48,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div style={{ background: B.white, borderRadius: 12, width: "100%", maxWidth: 800, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: B.navy, borderRadius: "12px 12px 0 0", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: B.azureMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Azure Communications</div>
            <div style={{ color: B.white, fontSize: 17, fontWeight: 700 }}>Quote Builder — Admin Settings</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: B.white, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Done</button>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${B.grey}`, background: B.offWhite, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? B.azure : B.greyDark, borderBottom: tab === t.id ? `2px solid ${B.azure}` : "2px solid transparent", whiteSpace: "nowrap", fontFamily: "Roboto, sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {tab === "api" && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>AI Provider</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(["anthropic", "openai", "custom"] as const).map(p => (
                    <button key={p} onClick={() => setApiConfig({ ...apiConfig, provider: p })} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${provider === p ? B.azure : B.grey}`, background: provider === p ? B.azureLight : B.white, color: provider === p ? B.azure : B.greyDark, fontWeight: provider === p ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
                      {p === "anthropic" ? "Claude (Anthropic)" : p === "openai" ? "OpenAI" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Endpoint</label>
                <input style={inputStyle} value={providerCfg.endpoint} onChange={e => setApiConfig({ ...apiConfig, [provider]: { ...providerCfg, endpoint: e.target.value } })} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input style={inputStyle} value={providerCfg.model} onChange={e => setApiConfig({ ...apiConfig, [provider]: { ...providerCfg, model: e.target.value } })} />
              </div>
              <div>
                <label style={labelStyle}>API Key {provider === "anthropic" ? "(set via Vercel env var ANTHROPIC_API_KEY — leave blank here)" : ""}</label>
                <input type="password" style={inputStyle} placeholder="sk-..." value={providerCfg.apiKey} onChange={e => setApiConfig({ ...apiConfig, [provider]: { ...providerCfg, apiKey: e.target.value } })} />
              </div>
              <div style={{ padding: 14, background: B.azureLight, borderRadius: 8, fontSize: 13, color: B.azure }}>
                <strong>Security:</strong> API keys are proxied server-side via <code>/api/extract</code>. Set <code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code> in Vercel environment variables — keys entered here are session-only and never stored.
              </div>
            </div>
          )}

          {tab === "customers" && (
            <div>
              <p style={{ fontSize: 13, color: B.muted, marginBottom: 16 }}>Toggle portal customers and set how their RFQs arrive.</p>
              {admin.portalCustomers.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${B.grey}` }}>
                  <Toggle value={c.active} onChange={v => { const u = [...admin.portalCustomers]; u[i] = { ...u[i], active: v }; setAdmin({ ...admin, portalCustomers: u }); }} />
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["pdf", "email", "api"] as const).map(t => (
                      <button key={t} onClick={() => { const u = [...admin.portalCustomers]; u[i] = { ...u[i], inputType: t }; setAdmin({ ...admin, portalCustomers: u }); }} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${c.inputType === t ? B.azure : B.grey}`, background: c.inputType === t ? B.azureLight : B.white, color: c.inputType === t ? B.azure : B.muted, fontSize: 12, fontWeight: c.inputType === t ? 700 : 400, cursor: "pointer", textTransform: "uppercase", fontFamily: "Roboto, sans-serif" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "jobtypes" && (
            <div style={{ overflowX: "auto" }}>
              <p style={{ fontSize: 13, color: B.muted, marginBottom: 12 }}>Default stock, sides and delivery per job type. Aaron to validate stock selections (⚠ = unconfirmed).</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: B.offWhite }}>
                    {["On", "Job Type", "Default Stock", "Sides", "Delivery"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", borderBottom: `1px solid ${B.grey}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admin.jobTypeDefaults.map((j, i) => (
                    <tr key={j.jobType} style={{ borderBottom: `1px solid ${B.grey}` }}>
                      <td style={{ padding: "8px 10px" }}><Toggle value={j.active} onChange={v => { const u = [...admin.jobTypeDefaults]; u[i] = { ...u[i], active: v }; setAdmin({ ...admin, jobTypeDefaults: u }); }} /></td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{j.jobType}</td>
                      <td style={{ padding: "8px 10px" }}><input style={{ ...inputStyle, width: 180, fontSize: 12 }} value={j.stock} onChange={e => { const u = [...admin.jobTypeDefaults]; u[i] = { ...u[i], stock: e.target.value }; setAdmin({ ...admin, jobTypeDefaults: u }); }} /></td>
                      <td style={{ padding: "8px 10px" }}>
                        <select style={{ ...inputStyle, width: 130, fontSize: 12 }} value={j.sides} onChange={e => { const u = [...admin.jobTypeDefaults]; u[i] = { ...u[i], sides: e.target.value }; setAdmin({ ...admin, jobTypeDefaults: u }); }}>
                          <option>Double sided</option><option>Single sided</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 10px" }}><input style={{ ...inputStyle, width: 160, fontSize: 12 }} value={j.delivery} onChange={e => { const u = [...admin.jobTypeDefaults]; u[i] = { ...u[i], delivery: e.target.value }; setAdmin({ ...admin, jobTypeDefaults: u }); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "materials" && (
            <div style={{ overflowX: "auto" }}>
              <p style={{ fontSize: 13, color: B.muted, marginBottom: 12 }}>Maps spec terms to exact PrintLogic stock names. Toggle &apos;confirmed&apos; once Aaron has validated.</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: B.offWhite }}>
                    {["Spec Term", "PrintLogic Stock Name", "Aaron ✓"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", borderBottom: `1px solid ${B.grey}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admin.materialLookup.map((m, i) => (
                    <tr key={m.key} style={{ borderBottom: `1px solid ${B.grey}`, background: m.confirmed ? B.white : "#FFFBF5" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{m.key}</td>
                      <td style={{ padding: "8px 10px" }}><input style={{ ...inputStyle, fontSize: 12 }} value={m.printlogic} onChange={e => { const u = [...admin.materialLookup]; u[i] = { ...u[i], printlogic: e.target.value }; setAdmin({ ...admin, materialLookup: u }); }} /></td>
                      <td style={{ padding: "8px 10px" }}><Toggle value={m.confirmed} onChange={v => { const u = [...admin.materialLookup]; u[i] = { ...u[i], confirmed: v }; setAdmin({ ...admin, materialLookup: u }); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "delivery" && (
            <div>
              <p style={{ fontSize: 13, color: B.muted, marginBottom: 16 }}>Pallet and Truck rules are off pending Aaron&apos;s input. Activate once trigger conditions are confirmed.</p>
              {admin.deliveryRules.map((r, i) => (
                <div key={r.courier} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${B.grey}` }}>
                  <Toggle value={r.active} onChange={v => { const u = [...admin.deliveryRules]; u[i] = { ...u[i], active: v }; setAdmin({ ...admin, deliveryRules: u }); }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{r.courier} — {r.price}</div>
                    <input style={inputStyle} value={r.condition} onChange={e => { const u = [...admin.deliveryRules]; u[i] = { ...u[i], condition: e.target.value }; setAdmin({ ...admin, deliveryRules: u }); }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "followup" && (
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { key: "day2Email", label: "Day 2 — Automated follow-up email", desc: "Personalised follow-up if no response after 2 days" },
                { key: "day5RepAlert", label: "Day 5 — Rep alert", desc: "Notify account rep if still no response after 5 days" },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: B.offWhite, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                    <div style={{ fontSize: 13, color: B.muted }}>{desc}</div>
                  </div>
                  <Toggle value={admin.followUp[key as "day2Email" | "day5RepAlert"]} onChange={v => setAdmin({ ...admin, followUp: { ...admin.followUp, [key]: v } })} />
                </div>
              ))}
              <div style={{ padding: "14px 16px", background: B.offWhite, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>High-value threshold (€)</div>
                <div style={{ fontSize: 13, color: B.muted, marginBottom: 10 }}>Quotes above this are flagged for a personal call</div>
                <input type="number" style={{ ...inputStyle, width: 140 }} value={admin.followUp.highValueThreshold} onChange={e => setAdmin({ ...admin, followUp: { ...admin.followUp, highValueThreshold: Number(e.target.value) } })} />
              </div>
              <div style={{ padding: "14px 16px", background: B.offWhite, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Default markup (%)</div>
                <input type="number" style={{ ...inputStyle, width: 100 }} value={admin.defaultMarkup} onChange={e => setAdmin({ ...admin, defaultMarkup: Number(e.target.value) })} />
              </div>
            </div>
          )}
          {tab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: B.muted, margin: 0 }}>Manage who can access the Quote Builder. Admins can access this panel.</p>
                <button onClick={loadUsers} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${B.grey}`, background: B.white, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  {usersLoading ? "Loading…" : "Refresh"}
                </button>
              </div>
              {userMsg && <div style={{ background: B.greenLight, border: `1px solid #9FE1CB`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.green, marginBottom: 14 }}>{userMsg}</div>}
              {users.length === 0 && !usersLoading && (
                <div style={{ textAlign: "center", padding: "32px", color: B.muted, fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                  Click Refresh to load users
                </div>
              )}
              {users.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: B.offWhite }}>
                      {["Name", "Email", "Role", "Joined", "Actions"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", borderBottom: `1px solid ${B.grey}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${B.grey}` }}>
                        <td style={{ padding: "10px 10px", fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "10px 10px", color: B.muted }}>{u.email}</td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.role === "admin" ? B.azureLight : B.grey, color: u.role === "admin" ? B.azure : B.muted, textTransform: "uppercase" }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", color: B.muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString("en-IE")}</td>
                        <td style={{ padding: "10px 10px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => toggleRole(u.id, u.role)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${B.azure}`, background: B.white, color: B.azure, fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                              Make {u.role === "admin" ? "user" : "admin"}
                            </button>
                            <button onClick={() => deleteUser(u.id, u.name)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${B.red}`, background: B.white, color: B.red, fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: 20, padding: "14px 16px", background: B.azureLight, borderRadius: 8, fontSize: 13, color: B.azure }}>
                <strong>Invite code:</strong> Share <code style={{ background: "rgba(0,126,187,0.1)", padding: "2px 6px", borderRadius: 4 }}>{process.env.NEXT_PUBLIC_INVITE_CODE || "AZURE2026"}</code> with new users so they can self-register at <strong>/signup</strong>. Change it via the <code>NEXT_PUBLIC_INVITE_CODE</code> environment variable.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

