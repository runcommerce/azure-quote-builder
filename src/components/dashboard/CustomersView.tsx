"use client";
import { useState } from "react";
import { C, View } from "./tokens";

const SAMPLE_CUSTOMERS = [
  { id: "1", name: "HH Global",  email: "rfq@hhglobal.com",  type: "Portal",   lastQuote: "2 days ago",  quotes: 3,  portal: "Mtivity"  },
  { id: "2", name: "Custodian",  email: "print@custodian.ie", type: "Portal",   lastQuote: "1 week ago",  quotes: 7,  portal: "Mtivity"  },
  { id: "3", name: "Konica",     email: "procurement@konica.ie", type: "Portal", lastQuote: "3 days ago", quotes: 2,  portal: "Mtivity"  },
  { id: "4", name: "Barnardos",  email: "marketing@barnardos.ie", type: "Regular", lastQuote: "2 weeks ago", quotes: 12, portal: null    },
  { id: "5", name: "Dept. of Education", email: "print@education.gov.ie", type: "Government", lastQuote: "1 month ago", quotes: 4, portal: null },
];

interface Props { setView: (v: View) => void; }

export default function CustomersView({ setView }: Props) {
  const [search, setSearch] = useState("");
  const filtered = SAMPLE_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--az-ink)" }}>Customers</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--az-muted)" }}>{SAMPLE_CUSTOMERS.length} customers · click any to create a quote</p>
        </div>
        <button style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--az-forest)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
          + Add customer
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
          style={{ width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8, border: `1px solid ${"var(--az-line)"}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: "var(--az-ink)", boxSizing: "border-box" as const }} />
      </div>

      {/* Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--az-off-white)", borderBottom: `1px solid ${"var(--az-line)"}` }}>
              {["Customer", "Type", "Portal", "Last Quote", "Total Quotes", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${"var(--az-line)"}` : "none" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--az-forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--az-ink)" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--az-muted)" }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.type === "Portal" ? "rgba(200,230,60,0.10)" : c.type === "Government" ? "#F0F4FF" : "var(--az-off-white)", color: c.type === "Portal" ? "var(--az-forest)" : c.type === "Government" ? "#4338CA" : "var(--az-muted)" }}>
                    {c.type}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: c.portal ? "var(--az-forest)" : "var(--az-muted)" }}>{c.portal || "—"}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--az-muted)" }}>{c.lastQuote}</td>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "var(--az-ink)" }}>{c.quotes}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setView("new-quote")}
                      style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "var(--az-forest)", color: "#ffffff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      + Quote
                    </button>
                    <button style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
