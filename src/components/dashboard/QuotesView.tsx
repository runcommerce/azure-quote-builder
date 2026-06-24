"use client";
import { C, View } from "./tokens";

const STATUS_STYLES = {
  draft:  { bg: "#F3F4F6", color: "#6B7280", label: "Draft"  },
  sent:   { bg: "var(--az-blue-light)", color: "var(--az-blue)", label: "Sent"  },
  won:    { bg: "var(--az-green-light)", color: "var(--az-green)", label: "Won"   },
  lost:   { bg: "var(--az-red-light)",   color: "var(--az-red)",   label: "Lost"  },
};

interface Props { setView: (v: View) => void; }

export default function QuotesView({ setView }: Props) {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--az-ink)" }}>Quotes</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--az-muted)" }}>All quotes — draft, sent, won and lost</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setView("upload-quote")}
            style={{ padding: "10px 18px", borderRadius: 9, border: `1.5px solid ${"var(--az-navy)"}`, background: "#ffffff", color: "var(--az-navy)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            📄 Upload RFQ
          </button>
          <button onClick={() => setView("new-quote")}
            style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            ✚ New Quote
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["All", "Draft", "Sent", "Won", "Lost"].map(f => (
          <button key={f}
            style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${f === "All" ? "var(--az-navy)" : "var(--az-line)"}`, background: f === "All" ? "var(--az-navy)" : "#ffffff", color: f === "All" ? "#ffffff" : "var(--az-muted)", fontSize: 13, fontWeight: f === "All" ? 700 : 400, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, padding: "48px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--az-ink)", marginBottom: 6 }}>No quotes yet</div>
        <div style={{ fontSize: 14, color: "var(--az-muted)", marginBottom: 20 }}>Upload an RFQ spec or create a quote manually to get started.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => setView("upload-quote")}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            📄 Upload spec
          </button>
          <button onClick={() => setView("new-quote")}
            style={{ padding: "10px 20px", borderRadius: 8, border: `1.5px solid ${"var(--az-navy)"}`, background: "#ffffff", color: "var(--az-navy)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            ✚ New quote
          </button>
        </div>
      </div>
    </div>
  );
}
