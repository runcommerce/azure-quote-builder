"use client";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type QueueItemType = "email-draft" | "quote-draft" | "price-suggestion" | "clarification" | "followup" | "reengagement";
type QueueStatus = "pending" | "approved" | "rejected" | "edited";

interface QueueItem {
  id: string;
  type: QueueItemType;
  agent: string;
  title: string;
  customer: string;
  customerEmail: string;
  created: string;
  confidence: number;
  status: QueueStatus;
  reasoning: string[];
  kbCited: string[];
  draft: string;
  spec?: Record<string, string>;
  warnings?: string[];
}

const SAMPLE_QUEUE: QueueItem[] = [
  {
    id: "q1", type: "email-draft", agent: "Quote Acknowledgement", status: "pending",
    title: "Acknowledgement — HH Global RFQ",
    customer: "HH Global", customerEmail: "procurement@hhglobal.com",
    created: "2 min ago", confidence: 94,
    reasoning: ["Email detected as print RFQ (confidence 94%)", "Customer matched: HH Global (portal customer)", "Standard acknowledgement triggered (SLA: 8hrs)", "Tone check passed"],
    kbCited: ["Standard RFQ response time commitment", "HH Global RFQ process"],
    warnings: [],
    draft: `Hi Sarah,

Thank you for your quote request. We've received your enquiry for A4 leaflets and will have a full quote back to you within 8 business hours.

If you need anything urgently in the meantime, please call Lisa Reid on 01 531 2695.

Kind regards,
Lisa Reid
Account Manager · Azure Communications
lreid@azurecomm.ie | 01 531 2695 | 089 611 1860`,
    spec: { customer: "HH Global", email: "procurement@hhglobal.com", product: "A4 Leaflet", quantity: "10,000", received: "09:14 today" }
  },
  {
    id: "q2", type: "quote-draft", agent: "Auto Quote Draft", status: "pending",
    title: "Draft Quote — HH Global A4 Leaflets",
    customer: "HH Global", customerEmail: "procurement@hhglobal.com",
    created: "2 min ago", confidence: 87,
    reasoning: ["All required spec fields extracted (confidence 87%)", "Product matched: A4 Leaflet (standard job type)", "Stock: 170gsm Silk Coated — scoring rule applied (fold required)", "Quantity breaks: 5,000 / 10,000 / 25,000 suggested", "HH Global contract rates applied — not standard markup"],
    kbCited: ["170gsm+ requires scoring before folding", "HH Global RFQ process", "Standard markup model", "Quantity break pricing logic"],
    warnings: ["Fold type not specified in email — assumed Single Fold. Verify before sending."],
    spec: { product: "A4 Leaflet", size: "210 × 297mm", qty: "10,000", stock: "170gsm Silk Coated", sides: "Double sided (4/4)", coating: "Matt Laminate", fold: "Single Fold (assumed ⚠)", delivery: "Dublin D2" },
    draft: `DRAFT QUOTE — HH Global — A4 Leaflets

Ref: AQ-2026-0847

Item: A4 Leaflet, 210 × 297mm finished
Stock: 170gsm Silk Coated (scored before folding — see note)
Print: 4 colour both sides
Laminate: Matt both sides
Fold: Single fold (please confirm fold type)
Delivery: Dublin D2

PRICING OPTIONS:
————————————————
Quantity    Unit cost    Total (ex-VAT)
5,000       €0.062       €310
10,000      €0.048       €480
25,000      €0.032       €800

Notes:
• 170gsm stock scored before folding (no extra charge, standard process)
• Artwork: print-ready PDF, CMYK, 3mm bleed
• Lead time: 5 working days from artwork approval
• All prices subject to VAT at 23%

⚠ NEEDS HUMAN REVIEW: Fold type assumed Single Fold — please confirm with customer before sending.`
  },
  {
    id: "q3", type: "price-suggestion", agent: "AI Pricing Suggestion", status: "pending",
    title: "Price suggestion — Barnardos Spring Brochure",
    customer: "Barnardos", customerEmail: "marketing@barnardos.ie",
    created: "1 hr ago", confidence: 79,
    reasoning: ["Customer identified as charity account (Barnardos)", "Charity rate applied: 30% margin", "A5 saddle-stitched brochure — standard job type", "12pp spec — within saddle stitch range (≤64pp)", "Confidence 79%: quantity not specified, priced at assumed 5,000"],
    kbCited: ["Barnardos — charity pricing", "Saddle stitch vs perfect bound thresholds", "Quantity break pricing logic", "Standard markup model"],
    warnings: ["Quantity not confirmed — price assumes 5,000 copies", "Soft touch cover requested — 25% premium added — confirm with customer", "Two quantity options requested in brief — provided 3 as standard"],
    spec: { product: "A5 Brochure", pages: "12pp", cover: "250gsm Soft Touch Matt", text: "150gsm Silk", binding: "Saddle Stitch", qty: "Unspecified (⚠ assumed 5,000)", delivery: "Dublin 3" },
    draft: `PRICING SUGGESTION — Barnardos Spring Appeal Brochure
[Charity rate: 30% margin applied]

A5 Saddle-stitched Brochure, 12pp
Cover: 250gsm Matt Coated + Soft Touch Laminate
Text: 150gsm Silk Coated
Print: 4/4 throughout

Qty 5,000 — €1,420 ex-VAT (€0.284 per unit)
Qty 10,000 — €2,180 ex-VAT (€0.218 per unit)
Qty 25,000 — €4,100 ex-VAT (€0.164 per unit)

⚠ Quantity unconfirmed — clarify with Claire before sending.
⚠ Soft touch: 25% premium over standard matt — verify client expectation.`
  },
  {
    id: "q4", type: "followup", agent: "Quote Follow-up", status: "pending",
    title: "Day 2 follow-up — Custodian signage quote",
    customer: "Custodian", customerEmail: "print@custodian.ie",
    created: "3 hrs ago", confidence: 91,
    reasoning: ["Quote AQ-2026-0831 sent 2 days ago, no response detected", "Customer: Custodian (portal customer)", "Value: €840 — below high-value threshold (€5,000)", "Day 2 follow-up triggered"],
    kbCited: ["Standard RFQ response time commitment", "HH Global RFQ process"],
    warnings: [],
    spec: { quote_ref: "AQ-2026-0831", value: "€840", sent: "2 days ago", product: "PVC Signage x 12", customer: "Custodian" },
    draft: `Hi,

I wanted to follow up on our quote for PVC signage (ref AQ-2026-0831) sent on Monday.

If you have any questions on the spec or pricing, or need a different quantity, just let me know — happy to adjust.

Best,
Lisa Reid
Azure Communications | 01 531 2695`
  },
];

const TYPE_STYLES: Record<QueueItemType, { bg: string; color: string; icon: string; label: string }> = {
  "email-draft":     { bg: "#dbeafe", color: "#1e40af", icon: "✉",  label: "Email draft"        },
  "quote-draft":     { bg: "#e0f2fe", color: "#0369a1", icon: "📋", label: "Quote draft"         },
  "price-suggestion":{ bg: "#d1fae5", color: "#065f46", icon: "💶", label: "Price suggestion"    },
  "clarification":   { bg: "#fef3c7", color: "#92400e", icon: "❓", label: "Clarification email" },
  "followup":        { bg: "#ede9fe", color: "#5b21b6", icon: "⏰", label: "Follow-up"           },
  "reengagement":    { bg: "#fce7f3", color: "#9d174d", icon: "🔄", label: "Re-engagement"       },
};

const ConfBadge = ({ val }: { val: number }) => (
  <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: val >= 90 ? "#dcfce7" : val >= 75 ? "#fef3c7" : "#fee2e2", color: val >= 90 ? "#166534" : val >= 75 ? "#92400e" : "#991b1b" }}>
    {val}% confidence
  </span>
);

export default function AgentQueueView() {
  const [items, setItems] = useState<QueueItem[]>(SAMPLE_QUEUE);
  const [expanded, setExpanded] = useState<string | null>("q1");
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<QueueStatus | "all">("pending");

  const act = (id: string, status: QueueStatus) => setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  const pending = items.filter(i => i.status === "pending");
  const visible = filter === "all" ? items : items.filter(i => i.status === filter);

  return (
    <div style={{ padding: "16px 24px 32px", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5a7066", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 3 }}>Human in the Loop</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>Agent Queue</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#5a7066" }}>
          Every agent action stops here first. Review, edit if needed, then approve or reject. Nothing reaches a customer without your sign-off.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Pending review",  val: pending.length,                                  color: pending.length > 0 ? "#92400e" : "#166534", bg: pending.length > 0 ? "#fef3c7" : "#dcfce7" },
          { label: "Approved today",  val: items.filter(i => i.status === "approved").length,   color: "#166534", bg: "#dcfce7" },
          { label: "Rejected today",  val: items.filter(i => i.status === "rejected").length,   color: "#991b1b", bg: "#fee2e2" },
          { label: "Edited & sent",   val: items.filter(i => i.status === "edited").length,     color: "#1e40af", bg: "#dbeafe" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, border: "none", padding: "10px 14px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.8, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${filter === f ? "#1a3a2e" : "rgba(26,58,46,0.14)"}`, background: filter === f ? "#1a3a2e" : "#fff", color: filter === f ? "#c8e63c" : "#5a7066", fontSize: 12.5, fontWeight: filter === f ? 700 : 500, cursor: "pointer", fontFamily: "var(--az-font)", textTransform: "capitalize" as const }}>
            {f}
          </button>
        ))}
      </div>

      {/* Queue items */}
      {visible.length === 0 && (
        <div style={{ padding: "48px 20px", textAlign: "center" as const, background: "#fff", borderRadius: 12, border: "1px solid rgba(26,58,46,0.09)" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0e1f18", marginBottom: 4 }}>Queue is clear</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>No items waiting for review.</div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {visible.map(item => {
          const t = TYPE_STYLES[item.type];
          const isOpen = expanded === item.id;
          const isEditing = editingDraft === item.id;
          const draft = drafts[item.id] ?? item.draft;
          const isDone = item.status !== "pending";

          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${item.status === "pending" ? "rgba(26,58,46,0.12)" : item.status === "approved" ? "#86efac" : item.status === "rejected" ? "#fca5a5" : "#93c5fd"}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(14,31,24,0.06)" }}>
              {/* Row header */}
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : item.id)}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0e1f18" }}>{item.title}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: t.bg, color: t.color }}>{t.label}</span>
                    <ConfBadge val={item.confidence} />
                    {isDone && <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: item.status === "approved" ? "#dcfce7" : item.status === "rejected" ? "#fee2e2" : "#dbeafe", color: item.status === "approved" ? "#166534" : item.status === "rejected" ? "#991b1b" : "#1e40af", textTransform: "capitalize" as const }}>{item.status}</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#5a7066" }}>
                    {item.customer} · {item.agent} · {item.created}
                  </div>
                  {item.warnings && item.warnings.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                      ⚠ {item.warnings.length} warning{item.warnings.length > 1 ? "s" : ""} — review before approving
                    </div>
                  )}
                </div>
                <span style={{ color: "#9ca3af", fontSize: 12, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(26,58,46,0.08)", padding: "16px" }}>
                  {/* Two-column layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    {/* Spec */}
                    {item.spec && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Spec extracted</div>
                        <div style={{ background: "var(--az-off-white)", borderRadius: 8, padding: "12px" }}>
                          {Object.entries(item.spec).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,58,46,0.07)", fontSize: 12.5 }}>
                              <span style={{ color: "#5a7066", fontWeight: 500, textTransform: "capitalize" as const }}>{k.replace(/_/g, " ")}</span>
                              <span style={{ color: v.includes("⚠") ? "#92400e" : "#0e1f18", fontWeight: 600 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agent reasoning */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Agent reasoning</div>
                      <div style={{ background: "rgba(26,58,46,0.03)", borderRadius: 8, padding: "12px" }}>
                        {item.reasoning.map((r, i) => (
                          <div key={i} style={{ fontSize: 12.5, color: "#5a7066", padding: "3px 0", display: "flex", gap: 6 }}>
                            <span style={{ color: "#1a3a2e", fontWeight: 700 }}>→</span>{r}
                          </div>
                        ))}
                        {item.kbCited.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(26,58,46,0.08)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", marginBottom: 4 }}>KB entries cited:</div>
                            {item.kbCited.map((kb, i) => (
                              <div key={i} style={{ fontSize: 11.5, color: "#1a3a2e", fontWeight: 600, padding: "2px 0" }}>📚 {kb}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {item.warnings && item.warnings.length > 0 && (
                    <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: "#92400e", fontSize: 13, marginBottom: 4 }}>⚠ Review these before approving</div>
                      {item.warnings.map((w, i) => (
                        <div key={i} style={{ fontSize: 12.5, color: "#92400e", padding: "2px 0" }}>· {w}</div>
                      ))}
                    </div>
                  )}

                  {/* Draft content */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {item.type === "email-draft" || item.type === "followup" || item.type === "clarification" ? "Email draft" : "Quote content"}
                      </div>
                      {!isDone && (
                        <button onClick={() => setEditingDraft(isEditing ? null : item.id)}
                          style={{ fontSize: 12, color: "#1a3a2e", background: "none", border: "1px solid rgba(26,58,46,0.18)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}>
                          {isEditing ? "Done editing" : "✎ Edit"}
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea value={draft} onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))} rows={12}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #1a3a2e", fontSize: 13, fontFamily: "monospace", color: "#0e1f18", background: "#fff", resize: "vertical" as const, boxSizing: "border-box" as const, lineHeight: 1.7 }} />
                    ) : (
                      <pre style={{ background: "rgba(26,58,46,0.03)", borderRadius: 8, padding: "14px", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" as const, color: "#0e1f18", border: "1px solid rgba(26,58,46,0.08)", fontFamily: "monospace", margin: 0, maxHeight: 320, overflowY: "auto" }}>
                        {draft}
                      </pre>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isDone && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => act(item.id, "approved")}
                        style={{ flex: 1, padding: "11px 0", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                        ✓ Approve & send
                      </button>
                      <button onClick={() => { setEditingDraft(item.id); }}
                        style={{ padding: "11px 20px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "#0e1f18", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        ✎ Edit first
                      </button>
                      <button onClick={() => act(item.id, "rejected")}
                        style={{ padding: "11px 20px", borderRadius: 999, border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {isDone && (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: item.status === "approved" ? "#dcfce7" : item.status === "rejected" ? "#fee2e2" : "#dbeafe", fontSize: 13, fontWeight: 600, color: item.status === "approved" ? "#166534" : item.status === "rejected" ? "#991b1b" : "#1e40af", textAlign: "center" as const }}>
                      {item.status === "approved" ? "✓ Approved and sent" : item.status === "rejected" ? "✕ Rejected" : "✎ Edited and sent"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
