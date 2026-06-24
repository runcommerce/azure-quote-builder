"use client";
import { View } from "./tokens";

const PRODUCT_TYPES = [
  { id: "leaflet",   label: "Leaflet / Flyer",  desc: "Single sheet, single or double sided",   icon: "□" },
  { id: "brochure",  label: "Brochure",          desc: "Multi-page, stitched or perfect bound",  icon: "▥" },
  { id: "mailing",   label: "Direct Mail",       desc: "Letter, envelope, enclosing, postage",   icon: "✉" },
  { id: "postcard",  label: "Postcard / Card",   desc: "Heavy stock, single or double sided",    icon: "◻" },
  { id: "booklet",   label: "Booklet",           desc: "Saddle-stitched, A4 or A5",             icon: "▤" },
  { id: "signage",   label: "Signage / POS",     desc: "Boards, banners, POS displays",         icon: "▣" },
];

interface Quote { id: string; ref: string; customer: string; product: string; status: "draft"|"sent"|"won"|"lost"; created: string; }

const STATUS = {
  draft:  { bg: "#f3f4f6",  color: "#6b7280",  label: "Draft"  },
  sent:   { bg: "#e6f5fc",  color: "#1a3a2e",  label: "Sent"   },
  won:    { bg: "#dcfce7",  color: "#16a34a",  label: "Won"    },
  lost:   { bg: "#fee2e2",  color: "#dc2626",  label: "Lost"   },
};

// Dot grid motif
const DotGrid = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {Array.from({ length: 7 }).map((_, r) => (
      <div key={r} style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: 7 }).map((_, c) => (
          <div key={c} style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: "var(--az-lime)", opacity: 0.6 }} />
        ))}
      </div>
    ))}
  </div>
);

const card: React.CSSProperties = {
  background: "#ffffff", borderRadius: 12,
  border: "1px solid rgba(26,58,46,0.09)",
  boxShadow: "0 2px 12px rgba(14,31,24,0.07)",
};

export default function HomeView({ setView, recentQuotes }: { setView: (v: View) => void; recentQuotes: Quote[] }) {
  const kpis = [
    { label: "Quotes Today",    value: "0",    icon: "≡", delta: null },
    { label: "Needs Attention", value: "0",    icon: "⚠", delta: null },
    { label: "Open Follow-ups", value: "0",    icon: "⏱", delta: null },
    { label: "Won This Month",  value: "€0",   icon: "✓", delta: null },
  ];

  return (
    <div style={{ padding: "28px 30px 40px", maxWidth: 1080 }}>

      {/* Hero banner — forest green matching azurecomm.ie */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a2e 0%, #122a21 100%)",
        borderRadius: 16, padding: "32px 36px 32px",
        marginBottom: 24, position: "relative", overflow: "hidden",
        display: "grid", gridTemplateColumns: "1fr auto",
        gap: 32, alignItems: "center",
        boxShadow: "0 8px 40px rgba(14,31,24,0.18)",
      }}>
        {/* Dot grid motif — right side like azurecomm.ie */}
        <div style={{ position: "absolute", right: 160, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>
          <DotGrid />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(200,230,60,0.8)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              AZURE COMMUNICATIONS
            </span>
          </div>
          <h1 style={{ margin: "0 0 10px", color: "#ffffff", fontSize: 30, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.025em" }}>
            Welcome To Azure IQ.<br />
            <span style={{ color: "var(--az-lime)" }}>Quote faster. Stay consistent.</span>
          </h1>
          <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.55)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 480 }}>
            AI-powered quoting for Azure Communications. Upload a portal spec, parse an email, or build a quote manually — all in one place.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setView("email-quote")}
              style={{ padding: "10px 22px", borderRadius: 999, border: "none", background: "var(--az-lime)", color: "#1a3a2e", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--az-font)", letterSpacing: "0.01em" }}>
              ✉ Email quote
            </button>
            <button onClick={() => setView("upload-quote")}
              style={{ padding: "10px 20px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.28)", background: "transparent", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              ↑ Upload RFQ spec
            </button>
            <button onClick={() => setView("new-quote")}
              style={{ padding: "10px 20px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.28)", background: "transparent", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
              + New quote
            </button>
          </div>
        </div>

        {/* Right side stat card */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 140 }}>
          {[
            { label: "Whether you're a startup", val: "" },
            { label: "a small business", val: "" },
            { label: "or a large enterprise", val: "" },
          ].map((_, i) => null)}
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: 11, color: "rgba(200,230,60,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Quotes today</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>0</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: 11, color: "rgba(200,230,60,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Pipeline</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>€0</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...card, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--az-ink)", letterSpacing: "-0.03em" }}>{k.value}</div>
            </div>
            <span style={{ fontSize: 18, opacity: 0.25 }}>{k.icon}</span>
          </div>
        ))}
      </div>

      {/* Product categories */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--az-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>Services We Quote</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--az-ink)", margin: 0, letterSpacing: "-0.02em" }}>Start by product type</h2>
          </div>
          <button onClick={() => setView("new-quote")}
            style={{ padding: "7px 16px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "var(--az-ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
            View all →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {PRODUCT_TYPES.map(p => (
            <button key={p.id} onClick={() => setView("new-quote")}
              style={{ ...card, padding: "16px 18px", textAlign: "left", cursor: "pointer", border: "1px solid rgba(26,58,46,0.09)", display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.14s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--az-lime)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(14,31,24,0.10)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,58,46,0.09)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(14,31,24,0.07)"; }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #1a3a2e, #2a5a46)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--az-lime)", fontSize: 16, flexShrink: 0 }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "var(--az-muted)", lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent quotes */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--az-ink)", margin: 0, letterSpacing: "-0.02em" }}>Recent quotes</h2>
          <button onClick={() => setView("quotes")}
            style={{ padding: "7px 16px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "var(--az-ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
            View all →
          </button>
        </div>
        <div style={{ ...card }}>
          {recentQuotes.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #1a3a2e, #2a5a46)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "var(--az-lime)" }}>≡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--az-ink)", marginBottom: 6 }}>No quotes yet</div>
              <div style={{ fontSize: 14, color: "var(--az-muted)", marginBottom: 22, lineHeight: 1.6 }}>Upload an RFQ spec, parse an email, or create a quote manually to get started.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setView("email-quote")}
                  style={{ padding: "10px 22px", borderRadius: 999, border: "none", background: "#1a3a2e", color: "var(--az-lime)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--az-font)" }}>
                  ✉ Email quote
                </button>
                <button onClick={() => setView("upload-quote")}
                  style={{ padding: "10px 20px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.20)", background: "#fff", color: "var(--az-ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
                  ↑ Upload spec
                </button>
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(26,58,46,0.09)" }}>
                  {["Reference","Customer","Product","Status","Created",""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--az-off-white)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentQuotes.slice(0, 8).map((q, i) => {
                  const s = STATUS[q.status];
                  return (
                    <tr key={q.id} style={{ borderBottom: i < recentQuotes.length - 1 ? "1px solid rgba(26,58,46,0.07)" : "none" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13.5, fontWeight: 700, color: "#1a3a2e" }}>{q.ref}</td>
                      <td style={{ padding: "11px 14px", fontSize: 14, color: "var(--az-ink)" }}>{q.customer}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13.5, color: "var(--az-muted)" }}>{q.product}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12.5, color: "var(--az-muted)" }}>{q.created}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <button style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(26,58,46,0.14)", background: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "var(--az-font)", color: "var(--az-ink)" }}>
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
