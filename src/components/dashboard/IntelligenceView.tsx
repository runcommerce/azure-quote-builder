"use client";
import { C } from "./tokens";

export default function IntelligenceView() {
  const stats = [
    { label: "Historical Quotes", value: "0",    icon: "📋", desc: "Won quotes used for pricing intelligence" },
    { label: "Customers",         value: "0",    icon: "👥", desc: "Total customers in system" },
    { label: "Pipeline Value",    value: "€0.00", icon: "💶", desc: "Open quotes total value" },
    { label: "Win Rate",          value: "—",    icon: "🎯", desc: "Quotes won vs sent (last 90 days)" },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.lime, letterSpacing: "0.1em", textTransform: "uppercase", background: C.navy, padding: "3px 10px", borderRadius: 20 }}>Phase 2 · Pricing Intelligence</span>
      </div>
      <h1 style={{ margin: "12px 0 6px", fontSize: 24, fontWeight: 800, color: C.dark }}>Quote Intelligence</h1>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
        Pricing patterns learned from your won historical quotes. Suggestions in the quote builder draw from this library.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.offWhite, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.dark, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Intelligence grows with your quotes</div>
        <div style={{ fontSize: 14, color: C.muted, maxWidth: 420, margin: "0 auto" }}>
          As you build and win quotes, pricing patterns are captured here to help the AI make better suggestions. Start by uploading or creating your first quote.
        </div>
      </div>
    </div>
  );
}
