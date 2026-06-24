"use client";
import { useState, useEffect } from "react";
import { C } from "./tokens";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import type { AdminConfig, ApiConfig, JobTypeDefault, MaterialEntry, DeliveryRule, PortalCustomer } from "@/lib/types";

// ── Storage key for persisted admin config ────────────────────────────────
const STORAGE_KEY = "azure_admin_config_v2";

function loadConfig(): AdminConfig {
  if (typeof window === "undefined") return DEFAULT_ADMIN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_ADMIN, ...JSON.parse(raw) } : DEFAULT_ADMIN;
  } catch { return DEFAULT_ADMIN; }
}

// ── Shared input style ─────────────────────────────────────────────────────
const inp = (width?: string): React.CSSProperties => ({
  padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.grey}`,
  fontSize: 13, fontFamily: "Roboto, sans-serif", color: C.dark,
  background: C.white, width: width || "100%", boxSizing: "border-box" as const,
});

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 38, height: 21, borderRadius: 11, background: value ? C.navy : C.grey, cursor: "pointer", position: "relative", transition: "background 0.18s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2.5, left: value ? 19 : 2.5, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, icon, desc, children, onAdd, addLabel }: {
  title: string; icon: string; desc: string; children: React.ReactNode;
  onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: C.navy, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.white, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{title}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{desc}</div>
        </div>
        {onAdd && (
          <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", color: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            + {addLabel || "Add"}
          </button>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

// ── Delete button ──────────────────────────────────────────────────────────
function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Remove" style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.white, color: C.red, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>✕</button>
  );
}

// ── Table header ───────────────────────────────────────────────────────────
function TH({ children }: { children: string }) {
  return <th style={{ padding: "8px 10px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", background: C.offWhite, borderBottom: `1px solid ${C.grey}` }}>{children}</th>;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminSettingsView() {
  const [admin, setAdmin] = useState<AdminConfig>(DEFAULT_ADMIN);
  const [api, setApi] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("api");

  useEffect(() => { setAdmin(loadConfig()); }, []);

  const save = (updated: AdminConfig) => {
    setAdmin(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Updaters ────────────────────────────────────────────────────────────
  const updCustomer = (i: number, f: Partial<PortalCustomer>) => save({ ...admin, portalCustomers: admin.portalCustomers.map((c, j) => j === i ? { ...c, ...f } : c) });
  const addCustomer = () => save({ ...admin, portalCustomers: [...admin.portalCustomers, { id: `custom_${Date.now()}`, name: "New Portal", inputType: "email", active: true }] });
  const delCustomer = (i: number) => save({ ...admin, portalCustomers: admin.portalCustomers.filter((_, j) => j !== i) });

  const updJob = (i: number, f: Partial<JobTypeDefault>) => save({ ...admin, jobTypeDefaults: admin.jobTypeDefaults.map((j, k) => k === i ? { ...j, ...f } : j) });
  const addJob = () => save({ ...admin, jobTypeDefaults: [...admin.jobTypeDefaults, { jobType: "New Job Type", stock: "130gsm silk", sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true }] });
  const delJob = (i: number) => save({ ...admin, jobTypeDefaults: admin.jobTypeDefaults.filter((_, j) => j !== i) });

  const updMat = (i: number, f: Partial<MaterialEntry>) => save({ ...admin, materialLookup: admin.materialLookup.map((m, j) => j === i ? { ...m, ...f } : m) });
  const addMat = () => save({ ...admin, materialLookup: [...admin.materialLookup, { key: "Xgsm type", printlogic: "PRINTLOGIC STOCK NAME", confirmed: false }] });
  const delMat = (i: number) => save({ ...admin, materialLookup: admin.materialLookup.filter((_, j) => j !== i) });

  const updDel = (i: number, f: Partial<DeliveryRule>) => save({ ...admin, deliveryRules: admin.deliveryRules.map((r, j) => j === i ? { ...r, ...f } : r) });
  const addDel = () => save({ ...admin, deliveryRules: [...admin.deliveryRules, { condition: "New delivery rule", courier: "Courier", price: "€0", active: false }] });
  const delDel = (i: number) => save({ ...admin, deliveryRules: admin.deliveryRules.filter((_, j) => j !== i) });

  // ── Dropdown options ─────────────────────────────────────────────────────
  const SIDES = ["Double sided", "Single sided"];
  const INPUT_TYPES = ["pdf", "email", "api"];
  const SUBSTRATE_OPTS = ["130gsm silk","150gsm silk","170gsm silk","200gsm silk","250gsm silk","300gsm silk","350gsm silk","400gsm silk","115gsm matt","170gsm matt","250gsm matt","300gsm matt","80gsm uncoated","100gsm uncoated","300gsm uncoated","350gsm uncoated"];

  const TABS = [
    { id: "api",       icon: "🤖", label: "API & Usage"       },
    { id: "customers", icon: "🏢", label: "Portal Customers"  },
    { id: "jobtypes",  icon: "📋", label: "Job Types"         },
    { id: "materials", icon: "🗂",  label: "Material Lookup"   },
    { id: "delivery",  icon: "🚚", label: "Delivery Rules"    },
    { id: "followup",  icon: "📤", label: "Follow-up"         },
    { id: "quotefields",icon: "⚙", label: "Quote Fields"     },
  ];

  // ── Quote field definitions — editable option lists ────────────────────
  const [qFields, setQFields] = useState({
    productTypes:   ["Leaflet","Brochure","Booklet","Business Cards","Postcard","Mailing","Poster","Stationery","Flyer","Catalogue","Report","Folder","Banner"],
    substrateTypes: ["Silk Coated","Matt Coated","Gloss Coated","Uncoated","Recycled Uncoated","Soft Touch"],
    coatingTypes:   ["None","Gloss Laminate","Matt Laminate","Soft Touch Laminate","Gloss Varnish","Matt Varnish","UV Spot","Aqueous"],
    foldTypes:      ["None","Single Fold","Z-Fold","Roll Fold","Gatefold","Concertina","French Fold"],
    bindingTypes:   ["None","Saddle Stitch","Perfect Bound","Loop Stitch","Spiral Bound","Wiro Bound"],
    proofTypes:     ["None","PDF: Colour","PDF: Soft Proof","Hard Copy"],
    artworkTypes:   ["New","Repeat","Customer Supplied","To Be Supplied"],
    packagingTypes: ["None","Carton","Pallet","Customer specified"],
  });

  type QFieldKey = keyof typeof qFields;

  const FieldListEditor = ({ fieldKey, label }: { fieldKey: QFieldKey; label: string }) => {
    const items = qFields[fieldKey];
    const [newItem, setNewItem] = useState("");
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: C.offWhite, border: `1px solid ${C.grey}`, borderRadius: 20, padding: "3px 4px 3px 10px" }}>
              <span style={{ fontSize: 13, color: C.dark }}>{item}</span>
              <button onClick={() => setQFields(prev => ({ ...prev, [fieldKey]: items.filter((_, j) => j !== i) }))}
                style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: C.greyMid, color: C.white, cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) { setQFields(prev => ({ ...prev, [fieldKey]: [...items, newItem.trim()] })); setNewItem(""); }}}
            placeholder={`Add option…`}
            style={{ ...inp("200px") }} />
          <button onClick={() => { if (newItem.trim()) { setQFields(prev => ({ ...prev, [fieldKey]: [...items, newItem.trim()] })); setNewItem(""); }}}
            style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: C.navy, color: C.white, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            + Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.dark }}>Admin Settings</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted }}>Configure every aspect of the quote builder — edit, add and remove options line by line.</p>
        </div>
        {saved && (
          <div style={{ padding: "8px 16px", borderRadius: 8, background: C.greenLight, border: `1px solid ${C.greenBorder}`, color: C.green, fontSize: 13, fontWeight: 600 }}>
            ✓ Saved
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.white, borderRadius: 10, border: `1px solid ${C.grey}`, overflow: "hidden", flexWrap: "wrap" as const }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "11px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
            color: activeTab === t.id ? C.navy : C.muted,
            borderBottom: activeTab === t.id ? `2px solid ${C.navy}` : "2px solid transparent",
            fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap" as const,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── API & Usage ────────────────────────────────────────────────── */}
      {activeTab === "api" && (
        <div>
          <Section title="AI Provider" icon="🤖" desc="Configure the LLM used for PDF extraction and quote intelligence">
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Provider</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["anthropic","openai","custom"].map(p => (
                    <button key={p} onClick={() => setApi(prev => ({ ...prev, provider: p as "anthropic"|"openai"|"custom" }))}
                      style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${api.provider === p ? C.navy : C.grey}`, background: api.provider === p ? "#E8F0EE" : C.white, color: api.provider === p ? C.navy : C.greyDark, fontWeight: api.provider === p ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
                      {p === "anthropic" ? "Claude (Anthropic)" : p === "openai" ? "OpenAI" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: "14px 16px", background: "#E8F4EE", borderRadius: 8, border: "1px solid #9FE1CB", fontSize: 13, color: "#0F6E56" }}>
                <strong>API Key:</strong> Set <code style={{ background: "rgba(0,0,0,0.07)", padding: "1px 5px", borderRadius: 3 }}>ANTHROPIC_API_KEY</code> in Vercel → Settings → Environment Variables. Keys are never stored in the browser.
              </div>
            </div>
          </Section>

          <Section title="Usage & Spend Limit" icon="💶" desc="Protect against runaway costs — ~€0.006 per PDF extraction with Claude Sonnet">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: C.offWhite, borderRadius: 8, padding: "16px", border: `1px solid ${C.grey}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, marginBottom: 6 }}>Cost per extraction</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>~€0.006</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>~300 PDFs per €2</div>
              </div>
              <div style={{ background: C.offWhite, borderRadius: 8, padding: "16px", border: `1px solid ${C.grey}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, marginBottom: 6 }}>Monthly cap (€60 ≈ €2/day)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>€60</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>~10,000 extractions/month</div>
              </div>
            </div>
            <div style={{ padding: "14px 16px", background: C.amberLight, borderRadius: 8, border: `1px solid ${C.amberBorder}`, fontSize: 13, color: C.amber, lineHeight: 1.6 }}>
              <strong>To set a €2/day limit:</strong> Go to <strong>console.anthropic.com → Settings → Limits</strong> and set a monthly spend limit of <strong>$65 (~€60)</strong>. This is enforced at the Anthropic API level — once hit, requests return a 429 error and the app shows a clear message to users.
              <div style={{ marginTop: 8 }}>
                <a href="https://console.anthropic.com/settings/limits" target="_blank" rel="noreferrer" style={{ color: C.amber, fontWeight: 700 }}>→ Open Anthropic Console Limits ↗</a>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── Portal Customers ──────────────────────────────────────────────── */}
      {activeTab === "customers" && (
        <Section title="Portal Customers" icon="🏢" desc="Add, edit or remove portal customers and set how RFQs arrive"
          onAdd={addCustomer} addLabel="Add portal">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Active","Name","Input Type","",""].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>
              {admin.portalCustomers.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.grey}` }}>
                  <td style={{ padding: "10px 10px" }}><Toggle value={c.active} onChange={v => updCustomer(i, { active: v })} /></td>
                  <td style={{ padding: "10px 10px" }}>
                    <input value={c.name} onChange={e => updCustomer(i, { name: e.target.value })} style={inp("160px")} />
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    <select value={c.inputType} onChange={e => updCustomer(i, { inputType: e.target.value as "pdf"|"email"|"api" })} style={inp("100px")}>
                      {INPUT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 12, color: C.muted, background: C.offWhite, padding: "3px 8px", borderRadius: 6 }}>
                      {c.inputType === "pdf" ? "📄 Portal spec PDF" : c.inputType === "email" ? "✉️ Email RFQ" : "🔌 API integration"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 10px" }}><DelBtn onClick={() => delCustomer(i)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ── Job Types ─────────────────────────────────────────────────────── */}
      {activeTab === "jobtypes" && (
        <Section title="Job Type Defaults" icon="📋" desc="Default stock, sides and delivery per job type — Aaron to validate stock"
          onAdd={addJob} addLabel="Add job type">
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>These defaults are applied when the AI matches a job type. Edit any field inline. Changes save immediately.</p>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead><tr>{["Active","Job Type","Default Stock","Sides","Delivery",""].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
              <tbody>
                {admin.jobTypeDefaults.map((j, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grey}` }}>
                    <td style={{ padding: "8px 10px" }}><Toggle value={j.active} onChange={v => updJob(i, { active: v })} /></td>
                    <td style={{ padding: "8px 10px" }}>
                      <input value={j.jobType} onChange={e => updJob(i, { jobType: e.target.value })} style={inp("130px")} />
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <select value={j.stock} onChange={e => updJob(i, { stock: e.target.value })} style={inp("180px")}>
                        {SUBSTRATE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value={j.stock}>{j.stock}</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <select value={j.sides} onChange={e => updJob(i, { sides: e.target.value })} style={inp("130px")}>
                        {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <input value={j.delivery} onChange={e => updJob(i, { delivery: e.target.value })} style={inp("160px")} />
                    </td>
                    <td style={{ padding: "8px 10px" }}><DelBtn onClick={() => delJob(i)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Material Lookup ───────────────────────────────────────────────── */}
      {activeTab === "materials" && (
        <Section title="Material Lookup" icon="🗂" desc="Maps spec terms (e.g. '170gsm silk') to exact PrintLogic stock names"
          onAdd={addMat} addLabel="Add material">
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
            Toggle <strong>Aaron ✓</strong> once a stock name is confirmed. Unconfirmed rows show a warning in the quote review screen.
          </p>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Spec Term","PrintLogic Stock Name","Aaron ✓",""].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
              <tbody>
                {admin.materialLookup.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grey}`, background: m.confirmed ? C.white : "#FFFCF0" }}>
                    <td style={{ padding: "8px 10px" }}>
                      <input value={m.key} onChange={e => updMat(i, { key: e.target.value })} style={inp("140px")} />
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <input value={m.printlogic} onChange={e => updMat(i, { printlogic: e.target.value })} style={inp()} />
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <Toggle value={m.confirmed} onChange={v => updMat(i, { confirmed: v })} />
                    </td>
                    <td style={{ padding: "8px 10px" }}><DelBtn onClick={() => delMat(i)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Delivery Rules ────────────────────────────────────────────────── */}
      {activeTab === "delivery" && (
        <Section title="Delivery Rules" icon="🚚" desc="Courier selection rules — activate Pallet/Truck once Aaron confirms triggers"
          onAdd={addDel} addLabel="Add rule">
          {admin.deliveryRules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${C.grey}` }}>
              <Toggle value={r.active} onChange={v => updDel(i, { active: v })} />
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 140px 90px", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, marginBottom: 5 }}>Trigger Condition</div>
                  <input value={r.condition} onChange={e => updDel(i, { condition: e.target.value })} style={inp()} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, marginBottom: 5 }}>Courier</div>
                  <input value={r.courier} onChange={e => updDel(i, { courier: e.target.value })} style={inp()} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, marginBottom: 5 }}>Price</div>
                  <input value={r.price} onChange={e => updDel(i, { price: e.target.value })} style={inp()} />
                </div>
              </div>
              <DelBtn onClick={() => delDel(i)} />
            </div>
          ))}
        </Section>
      )}

      {/* ── Follow-up ─────────────────────────────────────────────────────── */}
      {activeTab === "followup" && (
        <Section title="Follow-up Automation" icon="📤" desc="Automated chase emails and rep alerts for dispatched quotes">
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { key: "day2Email",    label: "Day 2 — Automated follow-up email",    desc: "Personalised follow-up if no response after 2 days" },
              { key: "day5RepAlert", label: "Day 5 — Rep alert notification",       desc: "Notify account rep if still no response after 5 days" },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: C.offWhite, borderRadius: 8, border: `1px solid ${C.grey}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{desc}</div>
                </div>
                <Toggle value={admin.followUp[key as "day2Email"|"day5RepAlert"]}
                  onChange={v => save({ ...admin, followUp: { ...admin.followUp, [key]: v } })} />
              </div>
            ))}
            <div style={{ padding: "14px 16px", background: C.offWhite, borderRadius: 8, border: `1px solid ${C.grey}` }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.dark, marginBottom: 3 }}>High-value threshold (€)</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Quotes above this value are flagged for a personal call instead of automated follow-up</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.muted }}>€</span>
                <input type="number" value={admin.followUp.highValueThreshold} onChange={e => save({ ...admin, followUp: { ...admin.followUp, highValueThreshold: Number(e.target.value) } })} style={{ ...inp("100px") }} />
              </div>
            </div>
            <div style={{ padding: "14px 16px", background: C.offWhite, borderRadius: 8, border: `1px solid ${C.grey}` }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.dark, marginBottom: 3 }}>Default markup (%)</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" value={admin.defaultMarkup} onChange={e => save({ ...admin, defaultMarkup: Number(e.target.value) })} style={{ ...inp("100px") }} />
                <span style={{ fontSize: 13, color: C.muted }}>applied to all job types unless overridden</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── Quote Fields ──────────────────────────────────────────────────── */}
      {activeTab === "quotefields" && (
        <div>
          <div style={{ background: C.amberLight, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.amber }}>
            ⚠ Changes here update the dropdown options shown in the quote builder and upload form. Add new options, remove unused ones. Press Enter or click Add to save each item.
          </div>

          <Section title="Product Types" icon="📋" desc="Options shown in the Product Type dropdown">
            <FieldListEditor fieldKey="productTypes" label="Product Types" />
          </Section>

          <Section title="Substrate Types" icon="🗂" desc="Paper/substrate type options">
            <FieldListEditor fieldKey="substrateTypes" label="Substrate Types" />
          </Section>

          <Section title="Coating Options" icon="✨" desc="Coating and laminate options for Side 1 and Side 2">
            <FieldListEditor fieldKey="coatingTypes" label="Coating Types" />
          </Section>

          <Section title="Fold Types" icon="📐" desc="Fold options for folded products">
            <FieldListEditor fieldKey="foldTypes" label="Fold Types" />
          </Section>

          <Section title="Binding Types" icon="📎" desc="Binding options for booklets and multi-page products">
            <FieldListEditor fieldKey="bindingTypes" label="Binding Types" />
          </Section>

          <Section title="Proof Types" icon="🖨" desc="Proof options shown to sales reps">
            <FieldListEditor fieldKey="proofTypes" label="Proof Types" />
          </Section>

          <Section title="Artwork Status" icon="🎨" desc="Artwork status options">
            <FieldListEditor fieldKey="artworkTypes" label="Artwork Status" />
          </Section>

          <Section title="Packaging Types" icon="📦" desc="Packaging options for delivery">
            <FieldListEditor fieldKey="packagingTypes" label="Packaging Types" />
          </Section>
        </div>
      )}

      {/* User management link */}
      <div style={{ marginTop: 8, padding: "14px 16px", background: C.white, borderRadius: 10, border: `1px solid ${C.grey}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>👥 User Management</div>
          <div style={{ fontSize: 13, color: C.muted }}>Add, remove and manage user roles and invite codes</div>
        </div>
        <button onClick={() => window.location.href = "/admin"}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.navy, color: C.white, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
          Open →
        </button>
      </div>
    </div>
  );
}
