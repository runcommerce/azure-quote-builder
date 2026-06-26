"use client";
import { useState, useEffect } from "react";
import type { View } from "./tokens";
import type { QuoteRecord, QuoteStatus } from "@/lib/types";
import { formatEur } from "@/lib/pricing";
import { loadQuotes, saveQuote, deleteQuote } from "@/lib/quotes";

// ── STATUS CONFIG ─────────────────────────────────────────────────────────
const STATUS: Record<QuoteStatus, { label: string; dot: string; bg: string; tx: string }> = {
  incomplete: { label: "Incomplete", dot: "#f59e0b", bg: "#fffbeb", tx: "#92400e" },
  sent:       { label: "Sent",       dot: "#3b82f6", bg: "#eff6ff", tx: "#1e40af" },
  won:        { label: "Won",        dot: "#22c55e", bg: "#f0fdf4", tx: "#166534" },
  lost:       { label: "Lost",       dot: "#ef4444", bg: "#fef2f2", tx: "#991b1b" },
};

const TABS: Array<QuoteStatus | "all"> = ["all", "incomplete", "sent", "won", "lost"];
const TAB_LABELS: Record<string, string> = { all: "All", incomplete: "Incomplete", sent: "Sent", won: "Won", lost: "Lost" };

const forest = "#1a3a2e"; const lime = "#c8e63c"; const line = "#E5E7EB"; const ink = "#111827"; const muted = "#6B7280";
const T = { green: "#2D6A4F", muted, ink, forest, line };

interface Props {
  setView: (v: View) => void;
  onViewQuote: (id: string) => void;
}

export default function QuotesView({ setView, onViewQuote }: Props) {
  const [quotes, setQuotes]     = useState<QuoteRecord[]>([]);
  const [tab, setTab]           = useState<QuoteStatus | "all">("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<QuoteRecord | null>(null);
  const [editing, setEditing]   = useState(false);

  useEffect(() => { setQuotes(loadQuotes()); }, []);

  const refresh = () => setQuotes(loadQuotes());

  const filtered = quotes.filter(q => {
    if (tab !== "all" && q.status !== tab) return false;
    if (search) {
      const s = search.toLowerCase();
      return [q.spec_ref, q.customer_name, q.product_type, q.spec_name].some(v => v?.toLowerCase().includes(s));
    }
    return true;
  });

  const counts = TABS.slice(1).reduce((acc, t) => {
    acc[t as QuoteStatus] = quotes.filter(q => q.status === t).length;
    return acc;
  }, {} as Record<QuoteStatus, number>);

  const updateStatus = (q: QuoteRecord, status: QuoteStatus) => {
    const updated = {
      ...q, status,
      date_issued: status === "sent" && !q.date_issued ? new Date().toISOString() : q.date_issued,
      date_updated: new Date().toISOString(),
    };
    saveQuote(updated);
    if (selected?.id === q.id) setSelected(updated);
    refresh();
  };

  const updateField = (q: QuoteRecord, field: keyof QuoteRecord, value: string) => {
    const updated = { ...q, [field]: value, date_updated: new Date().toISOString() };
    saveQuote(updated);
    setSelected(updated);
    refresh();
  };

  const removeQuote = (id: string) => {
    deleteQuote(id);
    if (selected?.id === id) setSelected(null);
    refresh();
  };

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const ago = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
  };

  const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${line}`, fontSize: 13, boxSizing: "border-box" as const };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 };

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: ink }}>Quotes</h1>
          <p style={{ margin: 0, fontSize: 13, color: muted }}>
            {quotes.length} total · {counts.incomplete ?? 0} incomplete · {counts.sent ?? 0} sent · {counts.won ?? 0} won
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setView("upload-quote")} style={{ padding: "10px 18px", borderRadius: 9, border: `1.5px solid ${forest}`, background: "#fff", color: forest, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            📄 Upload RFQ
          </button>
          <button onClick={() => setView("new-quote")} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: forest, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            ✚ New Quote
          </button>
        </div>
      </div>

      {/* Tabs + search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        {TABS.map(t => {
          const active = tab === t;
          const count = t === "all" ? quotes.length : (counts[t as QuoteStatus] ?? 0);
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
              border: `1px solid ${active ? forest : line}`,
              background: active ? forest : "#fff",
              color: active ? "#fff" : muted,
            }}>
              {TAB_LABELS[t]} {count > 0 && <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>}
            </button>
          );
        })}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotes…"
          style={{ marginLeft: "auto", ...inp, width: 200, background: "#fff" }} />
      </div>

      {/* Empty state */}
      {quotes.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${line}`, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: ink, marginBottom: 6 }}>No quotes yet</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 20 }}>Upload a spec or create a quote to get started. Saved drafts will appear here.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setView("upload-quote")} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: forest, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>📄 Upload spec</button>
            <button onClick={() => setView("new-quote")} style={{ padding: "10px 20px", borderRadius: 8, border: `1.5px solid ${forest}`, background: "#fff", color: forest, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✚ New quote</button>
          </div>
        </div>
      )}

      {/* Two-column: list + detail */}
      {quotes.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16, alignItems: "start" }}>

          {/* Quote list */}
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${line}`, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 80px", gap: 0, padding: "9px 16px", background: "#F9FAFB", borderBottom: `1px solid ${line}`, fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div>Quote / Customer</div><div>Product</div><div>Submitted</div><div>Issued</div><div>Status</div><div />
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: "32px 16px", textAlign: "center", color: muted, fontSize: 13 }}>No quotes in this category</div>
            )}

            {filtered.map(q => {
              const s = STATUS[q.status];
              const isActive = selected?.id === q.id;
              return (
                <div key={q.id} onClick={() => { setSelected(isActive ? null : q); setEditing(false); }}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 80px", gap: 0, padding: "11px 16px", borderBottom: `1px solid ${line}`, cursor: "pointer", background: isActive ? "#F0FDF4" : "#fff", transition: "background 0.1s" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>{q.customer_name || "Unknown customer"}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{q.spec_ref ? `#${q.spec_ref}` : q.id.slice(0,10)} · {ago(q.date_updated)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: ink, alignSelf: "center" }}>{q.product_type || "—"}</div>
                  <div style={{ fontSize: 12, color: muted, alignSelf: "center" }}>{fmt(q.date_submitted)}</div>
                  <div style={{ fontSize: 12, color: muted, alignSelf: "center" }}>{fmt(q.date_issued)}</div>
                  <div style={{ alignSelf: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.tx, fontSize: 11, fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                      {s.label}
                    </span>
                  </div>
                  <div style={{ alignSelf: "center", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={e => { e.stopPropagation(); removeQuote(q.id); }}
                      style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${line}`, background: "#fff", fontSize: 11, color: muted, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${line}`, overflow: "hidden", position: "sticky", top: 20 }}>
              <div style={{ background: forest, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{selected.customer_name || "Unnamed quote"}</div>
                <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>

              <div style={{ padding: "14px 16px" }}>

                {/* Status row */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {(Object.keys(STATUS) as QuoteStatus[]).map(s => {
                    const active = selected.status === s;
                    const cfg = STATUS[s];
                    return (
                      <button key={s} onClick={() => updateStatus(selected, s)} style={{
                        padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
                        border: `1.5px solid ${active ? cfg.dot : line}`,
                        background: active ? cfg.bg : "#fff",
                        color: active ? cfg.tx : muted,
                      }}>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Date fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={lbl}>Quote Submitted</label>
                    <input type="date" value={selected.date_submitted ? selected.date_submitted.slice(0,10) : ""}
                      style={inp}
                      onChange={e => updateField(selected, "date_submitted", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                    <div style={{ fontSize: 10, color: muted, marginTop: 3 }}>When customer sent the RFQ</div>
                  </div>
                  <div>
                    <label style={lbl}>Quote Issued</label>
                    <input type="date" value={selected.date_issued ? selected.date_issued.slice(0,10) : ""}
                      style={inp}
                      onChange={e => updateField(selected, "date_issued", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                    <div style={{ fontSize: 10, color: muted, marginTop: 3 }}>When Azure sent the quote</div>
                  </div>
                </div>

                {/* Key fields summary */}
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  {[
                    ["Spec ref",   selected.spec_ref],
                    ["Customer",   selected.customer_name],
                    ["Product",    selected.product_type],
                    ["Quantity",   selected.quantity ? String(selected.quantity) : null],
                    ["Region",     selected.delivery_region],
                    ["Spec name",  selected.spec_name],
                  ].map(([l, v]) => (
                    <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${line}`, fontSize: 12 }}>
                      <span style={{ color: muted, fontWeight: 500 }}>{l}</span>
                      <span style={{ color: v ? ink : "rgba(0,0,0,0.2)", fontWeight: v ? 600 : 400 }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing summary */}
                {selected.quoted_price !== null && selected.quoted_price !== undefined && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>
                      Quote Price
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: T.muted, textTransform: "none" as const }}>
                        {selected.price_source === "estimate" ? "· estimated (confirm in PrintLogic)" : selected.price_source === "manual" ? "· set manually" : "· from PrintLogic"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                      {[
                        ["Ex VAT", formatEur(selected.price_breakdown?.subtotal_ex_vat ?? null)],
                        ["Markup (25%)", formatEur(selected.price_breakdown ? (selected.price_breakdown.subtotal_ex_vat ?? 0) * 0.25 : null)],
                        ["Quoted price", formatEur(selected.quoted_price)],
                        ["VAT (23%)", formatEur(selected.price_breakdown?.vat_amount ?? null)],
                        ["Total inc. VAT", formatEur(selected.price_breakdown?.total_inc_vat ?? null)],
                      ].map(([l, v]) => (
                        <div key={l as string} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: T.muted }}>{l}</span>
                          <span style={{ fontWeight: 600, color: T.ink }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Notes</label>
                  <textarea value={selected.notes || ""} rows={3}
                    style={{ ...inp, resize: "vertical" as const, lineHeight: 1.5 }}
                    onChange={e => updateField(selected, "notes", e.target.value)}
                    placeholder="Internal notes on this quote…" />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onViewQuote(selected.id)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: muted }}>
                    View spec →
                  </button>
                  <button onClick={() => updateStatus(selected, "sent")}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: forest, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Mark as sent →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
