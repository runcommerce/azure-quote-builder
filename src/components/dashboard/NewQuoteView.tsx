"use client";
import { useState } from "react";
import { C, View } from "./tokens";

const PRODUCTS = [
  { id: "leaflet",  label: "Leaflet / Flyer",  desc: "Single sheet, single or double sided",    icon: "📰" },
  { id: "brochure", label: "Brochure",          desc: "Multi-page, stitched or perfect bound",   icon: "📕" },
  { id: "mailing",  label: "Direct Mail Pack",  desc: "Letter, envelope, enclosing, postage",    icon: "✉️" },
  { id: "postcard", label: "Postcard / Card",   desc: "Heavy stock, single or double sided",     icon: "🪧" },
  { id: "booklet",  label: "Booklet",           desc: "Saddle-stitched, A4 or A5",              icon: "📔" },
  { id: "signage",  label: "Signage / POS",     desc: "Boards, banners, POS displays",          icon: "🪟" },
  { id: "stationery","label": "Stationery",     desc: "Letterhead, compliment slips, business cards", icon: "📝" },
  { id: "catalogue","label": "Catalogue",       desc: "Perfect bound, multiple sections",        icon: "📚" },
];

const STEP_LABELS = ["Product", "Specification", "Review & Price"];

interface Props { setView: (v: View) => void; }

export default function NewQuoteView({ setView }: Props) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer: "", ref: "", quantity: "", finishedSize: "", pages: "",
    substrate: "", weight: "", sides: "", coating: "", delivery: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${"var(--az-line)"}`,
    fontSize: 15, fontFamily: "Roboto, sans-serif", color: "var(--az-ink)", boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: "var(--az-muted)", display: "block", marginBottom: 6,
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
  };

  return (
    <div style={{ padding: "16px 24px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("dashboard")}
          style={{ background: "none", border: "none", color: "var(--az-muted)", cursor: "pointer", fontSize: 14, fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
          ← Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--az-ink)" }}>New Quote</h1>
      </div>

      {/* Step bar */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32, background: "#ffffff", borderRadius: 12, padding: "16px 24px", border: `1px solid ${"var(--az-line)"}` }}>
        {STEP_LABELS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i <= step ? "var(--az-forest)" : "var(--az-line)", color: i <= step ? "#ffffff" : "var(--az-muted)", fontSize: 13, fontWeight: 700 }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: i === step ? 700 : 400, color: i === step ? "var(--az-ink)" : "var(--az-muted)" }}>{s}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? "var(--az-forest)" : "var(--az-line)", margin: "0 16px" }} />}
          </div>
        ))}
      </div>

      {/* Step 0: Product */}
      {step === 0 && (
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--az-ink)" }}>What are we quoting?</h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--az-muted)" }}>Pick a category — we'll only ask what we need.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => setSelected(p.id)}
                style={{ background: selected === p.id ? "var(--az-forest)" : "#ffffff", border: `2px solid ${selected === p.id ? "var(--az-lime)" : "var(--az-line)"}`, borderRadius: 12, padding: "18px 20px", textAlign: "left", cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.12s" }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: selected === p.id ? "var(--az-lime)" : "var(--az-ink)", marginBottom: 3 }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: selected === p.id ? "rgba(255,255,255,0.55)" : "var(--az-muted)" }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => selected && setStep(1)} disabled={!selected}
            style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: selected ? "var(--az-forest)" : "var(--az-line)", color: selected ? "#ffffff" : "var(--az-muted)", fontSize: 15, fontWeight: 700, cursor: selected ? "pointer" : "not-allowed", fontFamily: "Roboto, sans-serif" }}>
            Next: Specification →
          </button>
        </div>
      )}

      {/* Step 1: Specification */}
      {step === 1 && (
        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "var(--az-ink)" }}>Specification — {PRODUCTS.find(p => p.id === selected)?.label}</h2>
          <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, padding: "24px", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><label style={lbl}>Customer</label><input style={inp} value={form.customer} onChange={set("customer")} placeholder="e.g. HH Global" /></div>
              <div><label style={lbl}>Quote Reference</label><input style={inp} value={form.ref} onChange={set("ref")} placeholder="e.g. Q-2026-001" /></div>
              <div><label style={lbl}>Quantity</label><input style={inp} value={form.quantity} onChange={set("quantity")} placeholder="e.g. 5,000" /></div>
              <div><label style={lbl}>Finished Size (mm)</label><input style={inp} value={form.finishedSize} onChange={set("finishedSize")} placeholder="e.g. 210 x 297" /></div>
              {["brochure","booklet","mailing"].includes(selected || "") && (
                <div><label style={lbl}>Page Count</label><input style={inp} value={form.pages} onChange={set("pages")} placeholder="e.g. 8" /></div>
              )}
              <div>
                <label style={lbl}>Substrate</label>
                <select style={inp} value={form.substrate} onChange={set("substrate")}>
                  <option value="">— Select —</option>
                  <option>Silk Coated</option><option>Matt Coated</option><option>Gloss Coated</option><option>Uncoated</option>
                </select>
              </div>
              <div><label style={lbl}>Weight (gsm)</label><input style={inp} value={form.weight} onChange={set("weight")} placeholder="e.g. 170" /></div>
              <div>
                <label style={lbl}>Sides Printed</label>
                <select style={inp} value={form.sides} onChange={set("sides")}>
                  <option value="">— Select —</option><option>Single sided</option><option>Double sided</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Coating</label>
                <select style={inp} value={form.coating} onChange={set("coating")}>
                  <option value="">— Select —</option>
                  <option>None</option><option>Gloss Laminate</option><option>Matt Laminate</option><option>Soft Touch</option><option>Gloss Varnish</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Delivery</label>
                <select style={inp} value={form.delivery} onChange={set("delivery")}>
                  <option value="">— Select —</option>
                  <option>Dublin — Small Van (€35)</option><option>Nationwide — Overnight Parcel (€10)</option><option>Pallet (€75)</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(0)}
              style={{ padding: "13px 24px", borderRadius: 10, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              ← Back
            </button>
            <button onClick={() => setStep(2)}
              style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: "var(--az-forest)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              Review & Price →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "var(--az-ink)" }}>Review & Price</h2>
          <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, padding: "24px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-forest)", marginBottom: 16 }}>Quote Summary</div>
            {[
              ["Product",   PRODUCTS.find(p => p.id === selected)?.label || "—"],
              ["Customer",  form.customer || "—"],
              ["Reference", form.ref || "—"],
              ["Quantity",  form.quantity || "—"],
              ["Size",      form.finishedSize || "—"],
              ["Pages",     form.pages || "—"],
              ["Substrate", form.substrate && form.weight ? `${form.weight}gsm ${form.substrate}` : "—"],
              ["Sides",     form.sides || "—"],
              ["Coating",   form.coating || "—"],
              ["Delivery",  form.delivery || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${"var(--az-line)"}`, fontSize: 14 }}>
                <span style={{ color: "var(--az-muted)", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "var(--az-ink)", fontWeight: 600 }}>{v as string}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: "16px", background: "var(--az-off-white)", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "var(--az-muted)", marginBottom: 4 }}>Estimated price range</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--az-ink)" }}>Connect PrintLogic to calculate</div>
              <div style={{ fontSize: 12, color: "var(--az-muted)", marginTop: 4 }}>Add your <code style={{ background: "var(--az-line)", padding: "1px 5px", borderRadius: 4 }}>ANTHROPIC_API_KEY</code> in Admin Settings to enable AI pricing</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)}
              style={{ padding: "13px 24px", borderRadius: 10, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              ← Back
            </button>
            <button style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: "var(--az-lime)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              ✓ Save Quote
            </button>
            <button style={{ padding: "13px 24px", borderRadius: 10, border: `1.5px solid ${"var(--az-forest)"}`, background: "#ffffff", color: "var(--az-forest)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              📤 Send to Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
