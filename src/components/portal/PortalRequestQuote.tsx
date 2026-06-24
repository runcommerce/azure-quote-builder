/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Link from "next/link";
import PortalShell, { PortalConfig } from "./PortalShell";

interface LineItem {
  id: string; product: string; size: string; quantity: string;
  finish: string; notes: string;
}

export default function PortalRequestQuote({ portal }: { portal: PortalConfig }) {
  const pc = portal.primary_color || "#1a3a2e";
  const ac = portal.accent_color || "var(--az-lime)";
  const base = `/portal/${portal.slug}`;

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", product: "", size: "", quantity: "", finish: "", notes: "" }
  ]);
  const [delivery, setDelivery] = useState("");
  const [po, setPo] = useState("");
  const [globalNotes, setGlobalNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState("");

  const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), product: "", size: "", quantity: "", finish: "", notes: "" }]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof LineItem, value: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${portal.slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal_user_id: "demo",
          items, notes: globalNotes, delivery_address: delivery, po_number: po,
        }),
      });
      const data = await res.json();
      setRef(data.request?.reference || `REQ-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
    } catch {
      setRef(`REQ-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const };

  if (submitted) return (
    <PortalShell portal={portal}>
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 40px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${pc}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}>✅</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 12 }}>Quote request submitted</h1>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 8 }}>
          Your reference is <strong style={{ color: pc }}>{ref}</strong>. {portal.account_manager_name} will review your request and come back to you shortly.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link href={`${base}/my-quotes`} style={{ padding: "12px 24px", borderRadius: 24, background: pc, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            View my quotes
          </Link>
          <Link href={base} style={{ padding: "12px 24px", borderRadius: 24, border: `1px solid ${pc}`, color: pc, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Back to catalogue
          </Link>
        </div>
      </div>
    </PortalShell>
  );

  return (
    <PortalShell portal={portal} activePage="MY QUOTES & ORDERS">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 6 }}>Your Quote Request</h1>
        <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 32 }}>
          Review your selection and send it to our team. Each size / finish combination is a separate line.
        </p>

        {/* Line items */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ background: "#f9fafb", padding: "12px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 2fr 40px", gap: 12 }}>
            {["Product / Item", "Size", "Qty", "Finish", "Notes", ""].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</div>
            ))}
          </div>

          {items.map((item, i) => (
            <div key={item.id} style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 2fr 40px", gap: 12, alignItems: "center", borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
              <input value={item.product} onChange={e => updateItem(item.id, "product", e.target.value)} placeholder="e.g. Safety Signs A3" style={inp} />
              <input value={item.size} onChange={e => updateItem(item.id, "size", e.target.value)} placeholder="A3, A4…" style={inp} />
              <input value={item.quantity} onChange={e => updateItem(item.id, "quantity", e.target.value)} placeholder="50" style={inp} />
              <input value={item.finish} onChange={e => updateItem(item.id, "finish", e.target.value)} placeholder="Laminate, PVC…" style={inp} />
              <input value={item.notes} onChange={e => updateItem(item.id, "notes", e.target.value)} placeholder="Any other details" style={inp} />
              <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb", background: items.length === 1 ? "#f9fafb" : "#fff", color: items.length === 1 ? "#d1d5db" : "#ef4444", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>
          ))}

          <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <button onClick={addItem}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px dashed ${pc}`, background: "transparent", color: pc, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add another item
            </button>
          </div>
        </div>

        {/* Delivery & PO */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Delivery address</label>
            <input value={delivery} onChange={e => setDelivery(e.target.value)} placeholder="Site address or office" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>PO Number (optional)</label>
            <input value={po} onChange={e => setPo(e.target.value)} placeholder="Your PO ref" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Additional notes</label>
          <textarea value={globalNotes} onChange={e => setGlobalNotes(e.target.value)}
            placeholder="Deadline, special requirements, branding guidelines…"
            rows={3} style={{ ...inp, resize: "vertical" }} />
        </div>

        <button onClick={handleSubmit} disabled={loading || items.every(i => !i.product)}
          style={{ padding: "14px 32px", borderRadius: 28, border: "none", background: items.every(i => !i.product) || loading ? "#9ca3af" : pc, color: "#fff", fontSize: 16, fontWeight: 700, cursor: items.every(i => !i.product) || loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Submitting…" : "Submit quote request →"}
        </button>
      </div>
    </PortalShell>
  );
}
