"use client";
import { View } from "./tokens";

const PRODUCTS = [
  { id: "leaflet",   label: "Leaflet / Flyer",  desc: "Single sheet",            icon: "□" },
  { id: "brochure",  label: "Brochure",          desc: "Multi-page / bound",      icon: "▥" },
  { id: "mailing",   label: "Direct Mail",       desc: "Letter + envelope",       icon: "✉" },
  { id: "postcard",  label: "Postcard",           desc: "Heavy stock",            icon: "◻" },
  { id: "booklet",   label: "Booklet",           desc: "Saddle-stitched",         icon: "▤" },
  { id: "signage",   label: "Signage / POS",     desc: "Boards / banners",        icon: "▣" },
];

type Quote = { id: string; ref: string; customer: string; product: string; status: "draft"|"sent"|"won"|"lost"; created: string };
const STATUS = {
  draft: { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
  sent:  { bg: "#e8f5ee", color: "#1a3a2e", label: "Sent"  },
  won:   { bg: "#dcfce7", color: "#16a34a", label: "Won"   },
  lost:  { bg: "#fee2e2", color: "#dc2626", label: "Lost"  },
};

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 10,
  border: "1px solid rgba(26,58,46,0.09)",
  boxShadow: "0 1px 8px rgba(14,31,24,0.06)",
};

export default function HomeView({ setView, recentQuotes }: { setView: (v: View) => void; recentQuotes: Quote[] }) {
  return (
    <div style={{ padding: "16px 24px 24px", maxWidth: 1080, display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Action bar — slim hero, everything above fold ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a2e 0%, #122a21 100%)",
        borderRadius: 12, padding: "15px 20px",
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: 16, alignItems: "center",
        boxShadow: "0 4px 24px rgba(14,31,24,0.16)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Dot grid — subtle, right side */}
        <div style={{ position: "absolute", right: 200, top: "50%", transform: "translateY(-50%)", opacity: 0.25, display: "flex", flexDirection: "column", gap: 5 }}>
          {Array.from({length: 4}).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: 5 }}>
              {Array.from({length: 6}).map((_, c) => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: "#c8e63c" }} />)}
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(200,230,60,0.65)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Azure Communications · IQ</div>
          <h1 style={{ margin: "0 0 10px", color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            Quote faster. <span style={{ color: "#c8e63c" }}>Stay consistent.</span>
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("email-quote")}
              style={{ padding: "8px 18px", borderRadius: 999, border: "none", background: "#c8e63c", color: "#1a3a2e", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              ✉ Email quote
            </button>
            <button onClick={() => setView("upload-quote")}
              style={{ padding: "8px 16px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              ↑ Upload RFQ
            </button>
            <button onClick={() => setView("new-quote")}
              style={{ padding: "8px 16px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              + New quote
            </button>
          </div>
        </div>

        {/* KPI pair */}
        <div style={{ display: "flex", gap: 10, position: "relative", zIndex: 1 }}>
          {[{ label: "Quotes Today", val: "0" }, { label: "Pipeline", val: "€0" }].map(k => (
            <div key={k.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.11)", minWidth: 100, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(200,230,60,0.65)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Quotes Today",    val: "0",  icon: "≡" },
          { label: "Needs Attention", val: "0",  icon: "⚠" },
          { label: "Open Follow-ups", val: "0",  icon: "⏱" },
          { label: "Won This Month",  val: "€0", icon: "✓" },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--az-ink)", letterSpacing: "-0.03em" }}>{k.val}</div>
            </div>
            <span style={{ fontSize: 16, opacity: 0.18 }}>{k.icon}</span>
          </div>
        ))}
      </div>

      {/* ── Two-column: products + recent quotes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>

        {/* Product types — compact grid */}
        <div>
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Quick Quote</span>
            <button onClick={() => setView("new-quote")} style={{ fontSize: 11, color: "var(--az-muted)", background: "none", border: "none", cursor: "pointer" }}>All →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => setView("new-quote")}
                style={{ ...card, padding: "9px 11px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, transition: "border-color 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#c8e63c"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,58,46,0.09)"}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #1a3a2e, #2a5a46)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c8e63c", fontSize: 12, flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--az-ink)", lineHeight: 1.2 }}>{p.label}</div>
                  <div style={{ fontSize: 10.5, color: "var(--az-muted)" }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent quotes */}
        <div>
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Recent Quotes</span>
            <button onClick={() => setView("quotes")} style={{ fontSize: 11, color: "var(--az-muted)", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          <div style={{ ...card }}>
            {recentQuotes.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #1a3a2e, #2a5a46)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 18, color: "#c8e63c" }}>≡</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", marginBottom: 4 }}>No quotes yet</div>
                <div style={{ fontSize: 12.5, color: "var(--az-muted)", marginBottom: 14, lineHeight: 1.5 }}>Upload an RFQ spec, parse an email, or build a quote.</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={() => setView("email-quote")} style={{ padding: "7px 16px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "#c8e63c", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--az-font)" }}>✉ Email</button>
                  <button onClick={() => setView("upload-quote")} style={{ padding: "7px 14px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "var(--az-ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>↑ Upload</button>
                  <button onClick={() => setView("new-quote")} style={{ padding: "7px 14px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "var(--az-ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>+ New</button>
                </div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(26,58,46,0.08)" }}>
                    {["Ref","Customer","Product","Status","Created",""].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--az-off-white)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q, i) => {
                    const s = STATUS[q.status];
                    return (
                      <tr key={q.id} style={{ borderBottom: i < recentQuotes.length - 1 ? "1px solid rgba(26,58,46,0.06)" : "none" }}>
                        <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700, color: "#1a3a2e" }}>{q.ref}</td>
                        <td style={{ padding: "9px 12px", fontSize: 13, color: "var(--az-ink)" }}>{q.customer}</td>
                        <td style={{ padding: "9px 12px", fontSize: 12.5, color: "var(--az-muted)" }}>{q.product}</td>
                        <td style={{ padding: "9px 12px" }}><span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span></td>
                        <td style={{ padding: "9px 12px", fontSize: 12, color: "var(--az-muted)" }}>{q.created}</td>
                        <td style={{ padding: "9px 12px" }}><button style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(26,58,46,0.14)", background: "#fff", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--az-font)", color: "var(--az-ink)" }}>Open →</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
