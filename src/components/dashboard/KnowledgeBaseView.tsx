"use client";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  source: "aaron" | "jenny" | "system" | "learned";
  confidence: "confirmed" | "draft" | "needs-review";
  usedByAgents: string[];
  lastUpdated: string;
}

const INITIAL_ENTRIES: KBEntry[] = [
  { id: "kb1", category: "Print Rules", title: "170gsm+ requires scoring before folding", content: "Any stock weight of 170gsm or above must be scored before folding to prevent cracking. This applies to all folded products: leaflets, brochures, DL mailers. Exception: uncoated stocks at 170gsm may not require scoring — check with Aaron.", source: "aaron", confidence: "confirmed", usedByAgents: ["quote-draft", "quote-pricing"], lastUpdated: "2026-06-01" },
  { id: "kb2", category: "Print Rules", title: "Silk vs Matt coated: default stock selection", content: "For brochures and leaflets, default to Silk Coated unless client specifies otherwise. Matt Coated is positioned as premium — add 8–12% uplift. Soft Touch is ultra-premium — add 20–25% uplift. Uncoated is typically for corporate stationery or sustainably-positioned jobs.", source: "aaron", confidence: "confirmed", usedByAgents: ["quote-draft"], lastUpdated: "2026-06-01" },
  { id: "kb3", category: "Print Rules", title: "Saddle stitch vs perfect bound thresholds", content: "Saddle stitch (stapled spine): up to 64pp. Above 64pp, recommend perfect bound. Minimum saddle stitch: 8pp (including cover). For booklets 32pp+ on heavy text (150gsm+), flag potential spine crack risk to customer.", source: "aaron", confidence: "confirmed", usedByAgents: ["quote-draft"], lastUpdated: "2026-06-01" },
  { id: "kb4", category: "Pricing", title: "Standard markup model", content: "Base cost-plus pricing: materials + press time + finishing + delivery. Standard margin: 35–40% on trade work, 45–55% on direct. Government/charity work: 30–35% (relationship pricing). Portal customers (HH Global, Custodian): agreed rates in contract — do not apply standard markup. Check PrintLogic for contract rates.", source: "jenny", confidence: "confirmed", usedByAgents: ["quote-pricing"], lastUpdated: "2026-06-10" },
  { id: "kb5", category: "Pricing", title: "Quantity break pricing logic", content: "Always quote 3 quantity options unless customer specifies. Standard breaks: 1,000 / 2,500 / 5,000 for leaflets. 500 / 1,000 / 2,500 for brochures. 250 / 500 / 1,000 for premium/heavy jobs. Unit cost drops ~25–35% from first to third break.", source: "system", confidence: "confirmed", usedByAgents: ["quote-draft", "quote-pricing"], lastUpdated: "2026-05-15" },
  { id: "kb6", category: "Customers", title: "HH Global RFQ process", content: "HH Global submit structured RFQs via the Mtivity portal. They have agreed pricing for standard leaflets and brochures. Non-standard specs (special sizes, unusual stocks) require manual pricing approval from Aaron. Typical lead time expectation: 5 working days. Invoice same day as delivery.", source: "jenny", confidence: "confirmed", usedByAgents: ["email-parse", "portal-response"], lastUpdated: "2026-06-01" },
  { id: "kb7", category: "Customers", title: "Barnardos — charity pricing", content: "Barnardos are a charity account. Apply charity rate: 30% margin on all work. FSC certified stock preferred — they specify this in most briefs. Spring/summer/Christmas campaigns are predictable — flag for seasonal outreach in March, June, and October.", source: "jenny", confidence: "confirmed", usedByAgents: ["lapsed-customer", "quote-pricing"], lastUpdated: "2026-04-20" },
  { id: "kb8", category: "Operations", title: "Standard RFQ response time commitment", content: "Azure's committed turnaround is: acknowledge within 8 business hours, full quote within 24 hours for standard jobs, 48 hours for complex jobs. Flag to Lisa if SLA is at risk. If Aaron is unavailable, escalate to Jenny for pricing authority.", source: "jenny", confidence: "confirmed", usedByAgents: ["email-ack", "email-followup"], lastUpdated: "2026-05-01" },
  { id: "kb9", category: "Print Rules", title: "Artwork requirements", content: "All artwork must be print-ready PDF, CMYK colour mode, 300dpi minimum, 3mm bleed on all sides. Files not meeting spec: request correction, do not print. Common issues to flag: RGB colour mode, missing bleed, low resolution images, font embedding. Auto-flight available via Artworker tool.", source: "aaron", confidence: "confirmed", usedByAgents: ["email-ack"], lastUpdated: "2026-03-15" },
  { id: "kb10", category: "Delivery", title: "Delivery pricing matrix", content: "Dublin city/suburbs — small van: €35. Nationwide — overnight parcel (up to 30kg): €10 per parcel. Large format/pallets: €75–120 depending on weight. Same day Dublin: €65. Customer collection from Shankill: free. Mailing jobs: postage calculated separately per Royal Mail/An Post rates.", source: "system", confidence: "needs-review", usedByAgents: ["quote-draft", "quote-pricing"], lastUpdated: "2026-01-10" },
];

const SOURCE_STYLES = {
  aaron:   { bg: "#dbeafe", color: "#1e40af", label: "Aaron",   icon: "👤" },
  jenny:   { bg: "#ede9fe", color: "#5b21b6", label: "Jenny",   icon: "👤" },
  system:  { bg: "#f3f4f6", color: "#374151", label: "System",  icon: "⚙" },
  learned: { bg: "#d1fae5", color: "#065f46", label: "Learned", icon: "🧠" },
};

const CONFIDENCE_STYLES = {
  confirmed:    { bg: "#dcfce7", color: "#166534", label: "✓ Confirmed" },
  draft:        { bg: "#fef3c7", color: "#92400e", label: "⚠ Draft"     },
  "needs-review": { bg: "#fee2e2", color: "#991b1b", label: "⚠ Needs review" },
};

const CATEGORIES = ["All", "Print Rules", "Pricing", "Customers", "Operations", "Delivery"];

export default function KnowledgeBaseView() {
  const [entries, setEntries] = useState<KBEntry[]>(INITIAL_ENTRIES);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<KBEntry>>({ category: "Print Rules", source: "system", confidence: "draft" });

  const filtered = entries.filter(e =>
    (filter === "All" || e.category === filter) &&
    (search === "" || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase()))
  );

  const confirm = (id: string) => setEntries(prev => prev.map(e => e.id === id ? { ...e, confidence: "confirmed" } : e));
  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  const inp: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, border: "1.5px solid rgba(26,58,46,0.14)", fontSize: 13.5, fontFamily: "var(--az-font)", color: "#0e1f18", background: "#fff", boxSizing: "border-box" as const };

  return (
    <div style={{ padding: "16px 24px 32px", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5a7066", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 3 }}>Agent Intelligence</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>Knowledge Base</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#5a7066" }}>
            The AI's ground truth. Every agent decision is checked against these rules — Aaron and Jenny's knowledge, captured and confirmed.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          + Add entry
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total entries", val: entries.length, color: "#1a3a2e" },
          { label: "Confirmed", val: entries.filter(e => e.confidence === "confirmed").length, color: "#166534" },
          { label: "Needs review", val: entries.filter(e => e.confidence === "needs-review").length, color: "#991b1b" },
          { label: "Aaron-sourced", val: entries.filter(e => e.source === "aaron").length, color: "#1e40af" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(26,58,46,0.09)", padding: "10px 14px", boxShadow: "0 1px 6px rgba(14,31,24,0.05)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base…"
          style={{ ...inp, maxWidth: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: "5px 12px", borderRadius: 999, border: `1.5px solid ${filter === cat ? "#1a3a2e" : "rgba(26,58,46,0.14)"}`, background: filter === cat ? "#1a3a2e" : "#fff", color: filter === cat ? "#c8e63c" : "#5a7066", fontSize: 12, fontWeight: filter === cat ? 700 : 500, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add entry form */}
      {showAdd && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #1a3a2e", padding: "16px", marginBottom: 16, boxShadow: "0 4px 20px rgba(14,31,24,0.12)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0e1f18", marginBottom: 12 }}>New knowledge entry</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, marginBottom: 4 }}>Category</div>
              <select style={inp} value={newEntry.category} onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, marginBottom: 4 }}>Source</div>
              <select style={inp} value={newEntry.source} onChange={e => setNewEntry(p => ({ ...p, source: e.target.value as KBEntry["source"] }))}>
                <option value="aaron">Aaron</option><option value="jenny">Jenny</option><option value="system">System</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, marginBottom: 4 }}>Status</div>
              <select style={inp} value={newEntry.confidence} onChange={e => setNewEntry(p => ({ ...p, confidence: e.target.value as KBEntry["confidence"] }))}>
                <option value="confirmed">Confirmed</option><option value="draft">Draft</option><option value="needs-review">Needs Review</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, marginBottom: 4 }}>Title / Rule</div>
            <input style={inp} placeholder="e.g. 250gsm business cards require flood varnish minimum" value={newEntry.title || ""} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, marginBottom: 4 }}>Full explanation (what the AI needs to know)</div>
            <textarea style={{ ...inp, resize: "vertical" as const }} rows={4} placeholder="Explain the rule, any exceptions, and how it should be applied in quotes or responses…" value={newEntry.content || ""} onChange={e => setNewEntry(p => ({ ...p, content: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              if (!newEntry.title || !newEntry.content) return;
              setEntries(prev => [...prev, { ...newEntry as KBEntry, id: "kb" + Date.now(), usedByAgents: [], lastUpdated: new Date().toISOString().slice(0, 10) }]);
              setNewEntry({ category: "Print Rules", source: "system", confidence: "draft" });
              setShowAdd(false);
            }} style={{ padding: "8px 18px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Save entry
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "8px 14px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.18)", background: "#fff", color: "#5a7066", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(entry => {
          const src = SOURCE_STYLES[entry.source];
          const conf = CONFIDENCE_STYLES[entry.confidence];
          const isEditing = editingId === entry.id;
          return (
            <div key={entry.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${entry.confidence === "needs-review" ? "#fca5a5" : "rgba(26,58,46,0.09)"}`, overflow: "hidden", boxShadow: "0 1px 6px rgba(14,31,24,0.05)" }}>
              <div style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0e1f18" }}>{entry.title}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: src.bg, color: src.color }}>{src.icon} {src.label}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: conf.bg, color: conf.color }}>{conf.label}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, background: "#f3f4f6", color: "#374151" }}>{entry.category}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#5a7066", lineHeight: 1.6 }}>{entry.content}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>Used by {entry.usedByAgents.length} agent{entry.usedByAgents.length !== 1 ? "s" : ""} · Updated {entry.lastUpdated}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    {entry.confidence !== "confirmed" && (
                      <button onClick={() => confirm(entry.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#dcfce7", color: "#166534", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>✓ Confirm</button>
                    )}
                    <button onClick={() => setEditingId(isEditing ? null : entry.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(26,58,46,0.14)", background: "#fff", color: "#5a7066", fontSize: 11.5, cursor: "pointer" }}>✎ Edit</button>
                    <button onClick={() => deleteEntry(entry.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 11.5, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                {isEditing && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(26,58,46,0.08)" }}>
                    <textarea defaultValue={entry.content} rows={4} style={{ ...inp, resize: "vertical" as const, marginBottom: 8 }}
                      onBlur={e => setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, content: e.target.value } : en))} />
                    <button onClick={() => setEditingId(null)} style={{ padding: "6px 14px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Done</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" as const, color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid rgba(26,58,46,0.09)" }}>
            No entries match your search.
          </div>
        )}
      </div>
    </div>
  );
}
