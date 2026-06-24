"use client";
import { C, View } from "./tokens";

const PRODUCT_TYPES = [
  { id: "leaflet",   label: "Leaflet / Flyer",   desc: "Single sheet, single or double sided", icon: "📰" },
  { id: "brochure",  label: "Brochure",           desc: "Multi-page, stitched or perfect bound", icon: "📕" },
  { id: "mailing",   label: "Direct Mail Pack",   desc: "Letter, envelope, enclosing, postage",  icon: "✉️" },
  { id: "postcard",  label: "Postcard / Card",    desc: "Heavy stock, single or double sided",   icon: "🪧" },
  { id: "booklet",   label: "Booklet",            desc: "Saddle-stitched, A4 or A5",            icon: "📔" },
  { id: "signage",   label: "Signage / POS",      desc: "Boards, banners, POS displays",        icon: "🪟" },
];

interface Props {
  setView: (v: View) => void;
  recentQuotes: Quote[];
}

interface Quote {
  id: string;
  ref: string;
  customer: string;
  product: string;
  status: "draft" | "sent" | "won" | "lost";
  created: string;
  value?: string;
}

const STATUS_STYLES = {
  draft:  { bg: "#F3F4F6", color: "#6B7280", label: "Draft"  },
  sent:   { bg: C.azureLight, color: C.azure, label: "Sent"  },
  won:    { bg: C.greenLight, color: C.green, label: "Won"   },
  lost:   { bg: C.redLight,   color: C.red,   label: "Lost"  },
};

export default function HomeView({ setView, recentQuotes }: Props) {
  const kpis = [
    { label: "Quotes in System",  value: recentQuotes.length.toString(),                     icon: "📋", color: C.azure      },
    { label: "Pipeline Value",    value: "€0.00",                                             icon: "💶", color: C.green      },
    { label: "Sent This Month",   value: recentQuotes.filter(q => q.status === "sent").length.toString(), icon: "📤", color: C.amber },
    { label: "Avg. Turnaround",   value: "—",                                                 icon: "⏱",  color: C.greyDark   },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {/* Hero */}
      <div style={{ background: C.navy, borderRadius: 16, padding: "32px 36px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 300, background: "radial-gradient(circle at right, rgba(200,230,60,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lime, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Phase 1 · Guided Quoting
        </div>
        <h1 style={{ margin: "0 0 8px", color: C.white, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
          Quote faster.<br />Protect margin. Stay consistent.
        </h1>
        <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
          Upload a portal spec PDF for instant AI extraction, or build a quote manually. Azure IQ handles the production logic and outputs a PrintLogic-ready brief.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setView("upload-quote")}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: C.lime, color: C.navyDark, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            📄 Upload RFQ Spec
          </button>
          <button onClick={() => setView("new-quote")}
            style={{ padding: "12px 24px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "transparent", color: C.white, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            ✚ New Quote
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: C.white, borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.grey}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.dark }}>{k.value}</div>
            </div>
            <span style={{ fontSize: 22, opacity: 0.7 }}>{k.icon}</span>
          </div>
        ))}
      </div>

      {/* Product categories */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.dark }}>Start by product</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>Pick a category — the quote wizard adapts to match.</p>
          </div>
          <button onClick={() => setView("new-quote")}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            View all →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {PRODUCT_TYPES.map(p => (
            <button key={p.id} onClick={() => setView("new-quote")}
              style={{ background: C.white, border: `1px solid ${C.grey}`, borderRadius: 12, padding: "18px 20px", textAlign: "left", cursor: "pointer", fontFamily: "Roboto, sans-serif", transition: "border-color 0.12s", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent quotes */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.dark }}>Recent quotes</h2>
          <button onClick={() => setView("quotes")}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            View all →
          </button>
        </div>
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, overflow: "hidden" }}>
          {recentQuotes.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.dark, marginBottom: 6 }}>No quotes yet</div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Upload an RFQ spec or create a quote manually to get started.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setView("upload-quote")}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  📄 Upload spec
                </button>
                <button onClick={() => setView("new-quote")}
                  style={{ padding: "10px 20px", borderRadius: 8, border: `1.5px solid ${C.navy}`, background: C.white, color: C.navy, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  ✚ New quote
                </button>
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.offWhite, borderBottom: `1px solid ${C.grey}` }}>
                  {["Reference", "Customer", "Product", "Status", "Created", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentQuotes.slice(0, 8).map((q, i) => {
                  const s = STATUS_STYLES[q.status];
                  return (
                    <tr key={q.id} style={{ borderBottom: i < recentQuotes.length - 1 ? `1px solid ${C.grey}` : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.azure }}>{q.ref}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: C.dark }}>{q.customer}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: C.greyDark }}>{q.product}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{q.created}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.grey}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif", color: C.greyDark }}>
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
