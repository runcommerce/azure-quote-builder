"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { View } from "./tokens";

interface Customer {
  id: string;
  name: string;
  address: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  customer_type: string;
  portal: string | null;
  created_at: string;
}

const forest = "#1a3a2e"; const lime = "#c8e63c"; const line = "#E5E7EB";
const ink = "#111827"; const muted = "#6B7280";

const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${line}`, fontSize: 14, boxSizing: "border-box" as const, fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 };

interface Props { setView: (v: View) => void; }

export default function CustomersView({ setView }: Props) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<Customer[]>([]);
  const [allCount, setAllCount]     = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected]     = useState<Customer | null>(null);
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState<Partial<Customer>>({});
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ name: "", address: "", contact_name: "", email: "", phone: "", customer_type: "Regular" });
  const [actionMsg, setActionMsg]   = useState("");
  const [seedResult, setSeedResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [seeding, setSeeding]       = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback((q: string) => {
    fetch(`/api/customers?q=${encodeURIComponent(q)}&limit=20`)
      .then(r => r.json())
      .then(data => { setResults(data.customers ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchCustomers("");
  }, [fetchCustomers]);

  // Debounced type-ahead search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchCustomers(query);
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchCustomers]);

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3500); };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/customers/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showMsg(`✗ ${data.error}`); return; }
      setSeedResult({ inserted: data.inserted, skipped: data.skipped });
      fetchCustomers(query);
    } catch { showMsg("✗ Network error"); }
    finally { setSeeding(false); }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(`✗ ${data.error}`); return; }
      showMsg(`✓ ${addForm.name} added`);
      setShowAdd(false);
      setAddForm({ name: "", address: "", contact_name: "", email: "", phone: "", customer_type: "Regular" });
      fetchCustomers(query);
    } catch { showMsg("✗ Network error"); }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(`✗ ${data.error}`); return; }
      setSelected(data.customer);
      setEditing(false);
      showMsg("✓ Customer updated");
      fetchCustomers(query);
    } catch { showMsg("✗ Network error"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(`✗ ${data.error}`); return; }
      showMsg(`✓ ${name} deleted`);
      setSelected(null);
      fetchCustomers(query);
    } catch { showMsg("✗ Network error"); }
  };

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1100 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: ink }}>Customers</h1>
          <p style={{ margin: 0, fontSize: 13, color: muted }}>
            Type a name to search — matches as you type. Database-backed, shared across the team.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!seedResult && (
            <button onClick={handleSeed} disabled={seeding} style={{ padding: "10px 16px", borderRadius: 9, border: `1.5px solid ${forest}`, background: "#fff", color: forest, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.6 : 1 }}>
              {seeding ? "Importing…" : "↓ Import starter list"}
            </button>
          )}
          <button onClick={() => setShowAdd(s => !s)} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: forest, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Add customer
          </button>
        </div>
      </div>

      {seedResult && (
        <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 13, color: "#166534", marginBottom: 14 }}>
          ✓ Imported {seedResult.inserted} new customers{seedResult.skipped > 0 ? ` (${seedResult.skipped} already existed, skipped)` : ""}.
        </div>
      )}

      {actionMsg && (
        <div style={{ padding: "10px 14px", background: actionMsg.includes("✓") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${actionMsg.includes("✓") ? "#86efac" : "#fca5a5"}`, borderRadius: 8, fontSize: 13, color: actionMsg.includes("✓") ? "#166534" : "#dc2626", marginBottom: 14 }}>
          {actionMsg}
        </div>
      )}

      {/* Add customer form */}
      {showAdd && (
        <div style={{ background: "#fff", border: `1.5px solid ${forest}`, borderRadius: 10, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ink, marginBottom: 12 }}>Add new customer</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Customer name *</label>
              <input style={inp} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Azure Communications" />
            </div>
            <div>
              <label style={lbl}>Contact name</label>
              <input style={inp} value={addForm.contact_name} onChange={e => setAddForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="e.g. Lisa" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Address</label>
              <input style={inp} value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" style={inp} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="optional" />
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select style={inp} value={addForm.customer_type} onChange={e => setAddForm(f => ({ ...f, customer_type: e.target.value }))}>
                <option value="Regular">Regular</option>
                <option value="Portal">Portal</option>
                <option value="Government">Government</option>
                <option value="Pharma">Pharma</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAdd} disabled={!addForm.name.trim()} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: forest, color: lime, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !addForm.name.trim() ? 0.6 : 1 }}>Add customer</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", color: muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Type-ahead search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Start typing a customer name to search…"
          style={{ width: "100%", maxWidth: 480, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${line}`, fontSize: 15, boxSizing: "border-box" as const }}
        />
        {showDropdown && query && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: 480, maxHeight: 360, overflowY: "auto" as const, background: "#fff", border: `1px solid ${line}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20 }}>
            {loading ? (
              <div style={{ padding: "14px 16px", fontSize: 13, color: muted }}>Searching…</div>
            ) : results.length === 0 ? (
              <div style={{ padding: "14px 16px", fontSize: 13, color: muted }}>
                No match for &ldquo;{query}&rdquo;.{" "}
                <button onClick={() => { setAddForm(f => ({ ...f, name: query })); setShowAdd(true); setShowDropdown(false); }} style={{ color: forest, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Add &ldquo;{query}&rdquo; as new customer
                </button>
              </div>
            ) : (
              results.map(c => (
                <div key={c.id} onMouseDown={() => { setSelected(c); setQuery(""); setShowDropdown(false); }}
                  style={{ padding: "10px 16px", borderBottom: `1px solid ${line}`, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{c.name}</div>
                  {(c.contact_name || c.address) && (
                    <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                      {c.contact_name ? `Contact: ${c.contact_name}` : ""}{c.contact_name && c.address ? " · " : ""}{c.address ?? ""}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected customer detail */}
      {selected && (
        <div style={{ background: "#fff", border: `1px solid ${line}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: forest, display: "flex", alignItems: "center", justifyContent: "center", color: lime, fontWeight: 800, fontSize: 17 }}>
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <input defaultValue={selected.name} style={{ ...inp, fontSize: 16, fontWeight: 700 }} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                ) : (
                  <div style={{ fontSize: 17, fontWeight: 700, color: ink }}>{selected.name}</div>
                )}
                <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{selected.customer_type}{selected.portal ? ` · ${selected.portal} portal` : ""}</div>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setEditing(false); }} style={{ background: "none", border: "none", fontSize: 20, color: muted, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Contact name</label>
              {editing ? <input defaultValue={selected.contact_name ?? ""} style={inp} onChange={e => setEditForm(f => ({ ...f, contact_name: e.target.value }))} /> : <div style={{ fontSize: 14, color: ink }}>{selected.contact_name || "—"}</div>}
            </div>
            <div>
              <label style={lbl}>Email</label>
              {editing ? <input defaultValue={selected.email ?? ""} style={inp} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /> : <div style={{ fontSize: 14, color: ink }}>{selected.email || "—"}</div>}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Address</label>
              {editing ? <input defaultValue={selected.address ?? ""} style={inp} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /> : <div style={{ fontSize: 14, color: ink }}>{selected.address || "—"}</div>}
            </div>
            <div>
              <label style={lbl}>Phone</label>
              {editing ? <input defaultValue={selected.phone ?? ""} style={inp} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /> : <div style={{ fontSize: 14, color: ink }}>{selected.phone || "—"}</div>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button onClick={handleSaveEdit} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: forest, color: lime, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save changes</button>
                <button onClick={() => { setEditing(false); setEditForm({}); }} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", color: muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setView("upload-quote")} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: forest, color: lime, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>New quote for this customer</button>
                <button onClick={() => { setEditing(true); setEditForm({}); }} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", color: ink, fontSize: 13, cursor: "pointer" }}>✏️ Edit</button>
                <button onClick={() => handleDelete(selected.id, selected.name)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 13, cursor: "pointer" }}>🗑 Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* All customers table (shown when not searching) */}
      {!query && (
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${line}`, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${line}`, fontSize: 13, fontWeight: 700, color: ink, background: "#F9FAFB" }}>
            {loading ? "Loading…" : `${results.length} customer${results.length !== 1 ? "s" : ""}${results.length === 20 ? " (showing first 20 — search to narrow)" : ""}`}
          </div>
          {results.length === 0 && !loading && (
            <div style={{ padding: "32px", textAlign: "center", color: muted, fontSize: 13 }}>
              No customers yet. Click &ldquo;↓ Import starter list&rdquo; above to load the initial set, or add one manually.
            </div>
          )}
          {results.map((c, i) => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{ padding: "11px 16px", borderBottom: i < results.length - 1 ? `1px solid ${line}` : "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: ink }}>{c.name}</span>
                {c.contact_name && <span style={{ fontSize: 12, color: muted, marginLeft: 10 }}>· {c.contact_name}</span>}
              </div>
              <span style={{ fontSize: 11, color: muted, padding: "2px 9px", borderRadius: 20, background: "#F3F4F6" }}>{c.customer_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
