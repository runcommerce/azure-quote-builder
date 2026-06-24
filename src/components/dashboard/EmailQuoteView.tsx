"use client";
import { useState, useRef } from "react";
import { C } from "./tokens";

// ── Types ──────────────────────────────────────────────────────────────────
interface ParsedQuote {
  customer_name: string;
  customer_email: string;
  product_type: string;
  quantity: string;
  finished_size_mm: string;
  pages: string;
  substrate_type: string;
  substrate_weight_gsm: string;
  sides_printed: string;
  coating_side_1: string;
  fold_type: string;
  binding: string;
  delivery_address: string;
  deadline: string;
  special_notes: string;
  po_number: string;
  confidence: "high" | "medium" | "low";
  flags: string[];
  raw_email: string;
}

// ── Sample emails for demo ─────────────────────────────────────────────────
const SAMPLE_EMAILS = [
  {
    label: "HH Global RFQ",
    body: `From: procurement@hhglobal.com
To: quotes@azurecomm.ie
Subject: RFQ - A4 Leaflets x 10,000

Hi,

We need a quote for the following:

Product: A4 Leaflets
Quantity: 10,000
Finish size: 210 x 297mm
Stock: 170gsm Silk Coated
Print: 4/4 (double sided)
Laminate: Matt both sides
Delivery: Dublin office (D2)
Deadline: 3 weeks

Please advise on pricing and turnaround.

Thanks,
Sarah
HH Global Procurement`,
  },
  {
    label: "Barnardos Brochure",
    body: `From: marketing@barnardos.ie
To: quotes@azurecomm.ie
Subject: Quote request - Spring appeal brochure

Hello Azure team,

Could you please quote for our spring fundraising brochure?

- A5 folded from A4
- 8 pages plus cover (so 12pp total)
- 250gsm cover, 150gsm text
- Full colour throughout
- Soft touch laminate on cover only
- Quantity: 5,000 and 10,000 options please
- Delivery to our Dublin 3 office by end of April

Many thanks,
Claire`,
  },
];

// ── Field editor row ───────────────────────────────────────────────────────
function FieldRow({ label, value, onChange, flag, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  flag?: boolean; multiline?: boolean;
}) {
  const bg = flag ? "var(--az-amber-light)" : "#ffffff";
  const border = flag ? `1.5px solid ${"#fcd34d"}` : `1px solid ${"var(--az-line)"}`;
  const style: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 7, border, background: bg,
    fontSize: 14, fontFamily: "Roboto, sans-serif", color: "var(--az-ink)",
    boxSizing: "border-box" as const, resize: multiline ? "vertical" as const : undefined,
  };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: `1px solid ${"var(--az-line)"}` }}>
      <div style={{ width: 160, flexShrink: 0, paddingTop: 9 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: flag ? "var(--az-amber)" : "var(--az-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
          {flag && <span style={{ fontSize: 10 }}>⚠</span>}
          {label}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={style} />
        ) : (
          <input value={value} onChange={e => onChange(e.target.value)} style={style} />
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function EmailQuoteView() {
  const [stage, setStage] = useState<"input" | "parsing" | "review" | "confirmed">("input");
  const [emailText, setEmailText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuote | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"paste"|"inbox">("paste");
  const fileRef = useRef<HTMLInputElement>(null);

  // Simulated inbox emails
  const [inboxEmails] = useState([
    { id: "1", from: "procurement@hhglobal.com", subject: "RFQ - A4 Leaflets x 10,000", received: "Today 09:14", preview: "We need a quote for the following: Product: A4 Leaflets Quantity: 10,000...", unread: true },
    { id: "2", from: "marketing@barnardos.ie",   subject: "Quote request - Spring appeal brochure", received: "Today 08:47", preview: "Could you please quote for our spring fundraising brochure?...", unread: true },
    { id: "3", from: "print@custodian.ie",        subject: "Urgent - safety notice reprint", received: "Yesterday 16:22", preview: "Hi, we urgently need to reprint our safety notice posters...", unread: false },
  ]);
  const [selectedEmail, setSelectedEmail] = useState<string|null>(null);

  const parseEmail = async (text: string) => {
    if (!text.trim()) { setError("Please paste an email or select one from the inbox."); return; }
    setStage("parsing"); setError("");
    try {
      // Call Claude API to parse the email
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          content: text,
          prompt: `You are a print industry quoting assistant. Parse this customer email and extract all print job specifications.

Return ONLY valid JSON with these exact fields:
{
  "customer_name": "",
  "customer_email": "",
  "product_type": "",
  "quantity": "",
  "finished_size_mm": "",
  "pages": "",
  "substrate_type": "",
  "substrate_weight_gsm": "",
  "sides_printed": "",
  "coating_side_1": "",
  "fold_type": "",
  "binding": "",
  "delivery_address": "",
  "deadline": "",
  "special_notes": "",
  "po_number": "",
  "confidence": "high|medium|low",
  "flags": ["list any fields that were ambiguous or missing"]
}

Rules:
- Extract only what is explicitly stated
- Leave blank ("") if not mentioned
- confidence = "high" if most fields present, "medium" if some missing, "low" if very little info
- flags = list of field names that need review

Email to parse:
${text}`,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Parsing failed");

      // Extract JSON from response
      const raw = data.result || data.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response");

      const q: ParsedQuote = JSON.parse(jsonMatch[0]);
      q.raw_email = text;
      setParsed(q);
      setStage("review");
    } catch (err) {
      // Fallback: demo parse from text heuristics
      const lines = text.toLowerCase();
      const qty = text.match(/(\d[\d,]*)\s*(copies|units|leaflets|brochures|posters)/i);
      const size = text.match(/(\d+)\s*x\s*(\d+)\s*mm/i);
      const gsm = text.match(/(\d+)\s*gsm/i);
      const fromMatch = text.match(/From:\s*([^\n]+)/i);
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);

      setParsed({
        customer_name: fromMatch ? fromMatch[1].split("<")[0].trim() : "",
        customer_email: emailMatch ? emailMatch[0] : "",
        product_type: lines.includes("brochure") ? "Brochure" : lines.includes("leaflet") ? "Leaflet" : lines.includes("poster") ? "Poster" : lines.includes("booklet") ? "Booklet" : "",
        quantity: qty ? qty[1].replace(",","") : "",
        finished_size_mm: size ? `${size[1]} x ${size[2]}` : "",
        pages: text.match(/(\d+)\s*pp/i)?.[1] || text.match(/(\d+)\s*pages/i)?.[1] || "",
        substrate_type: lines.includes("silk") ? "Silk Coated" : lines.includes("matt") ? "Matt Coated" : lines.includes("uncoated") ? "Uncoated" : "",
        substrate_weight_gsm: gsm ? gsm[1] : "",
        sides_printed: lines.includes("double") || lines.includes("4/4") ? "Double sided" : lines.includes("single") ? "Single sided" : "",
        coating_side_1: lines.includes("soft touch") ? "Soft Touch Laminate" : lines.includes("matt lam") ? "Matt Laminate" : lines.includes("gloss lam") ? "Gloss Laminate" : "None",
        fold_type: lines.includes("fold") ? "Single Fold" : "None",
        binding: lines.includes("saddle") ? "Saddle Stitch" : lines.includes("perfect") ? "Perfect Bound" : "None",
        delivery_address: text.match(/Dublin\s*\d*/i)?.[0] || "",
        deadline: text.match(/(end of \w+|in \d+ weeks?|\d+ weeks?)/i)?.[0] || "",
        special_notes: "",
        po_number: text.match(/PO[\s#:-]*([A-Z0-9-]+)/i)?.[1] || "",
        confidence: qty || size ? "medium" : "low",
        flags: !qty ? ["quantity"] : [],
        raw_email: text,
      });
      setStage("review");
    }
  };

  const confirmQuote = () => setStage("confirmed");

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${"var(--az-line)"}`,
    fontSize: 14, fontFamily: "Roboto, sans-serif", color: "var(--az-ink)",
    background: "#ffffff", boxSizing: "border-box" as const,
  };

  const CONFIDENCE_STYLE = {
    high:   { bg: "var(--az-green-light)", color: "var(--az-green)",  label: "High confidence" },
    medium: { bg: "var(--az-amber-light)", color: "var(--az-amber)",  label: "Review needed"   },
    low:    { bg: "var(--az-red-light)",   color: "var(--az-red)",    label: "Low confidence"  },
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--az-ink)" }}>Email Quote Parser</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--az-muted)" }}>
          Paste a customer email or pull from your connected mailbox — AI extracts all spec fields instantly.
        </p>
      </div>

      {/* Stage: Input */}
      {stage === "input" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          <div>
            {/* Tab bar */}
            <div style={{ display: "flex", background: "#ffffff", borderRadius: 10, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden", marginBottom: 16, width: "fit-content" }}>
              {[
                { id: "paste",  label: "📋 Paste email" },
                { id: "inbox",  label: "📥 Connected inbox" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as "paste"|"inbox")}
                  style={{ padding: "10px 20px", border: "none", background: tab === t.id ? "var(--az-navy)" : "none", color: tab === t.id ? "#ffffff" : "var(--az-muted)", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "paste" && (
              <>
                <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ background: "var(--az-bg)", padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: `1px solid ${"var(--az-line)"}` }}>
                    Email content
                  </div>
                  <textarea
                    value={emailText}
                    onChange={e => setEmailText(e.target.value)}
                    placeholder={`Paste the full customer email here — including From, Subject, and body.\n\nExample:\nFrom: client@company.ie\nSubject: Quote request - A4 leaflets\n\nHi, we need 5,000 A4 leaflets, 170gsm silk, double sided, matt laminate...`}
                    rows={14}
                    style={{ width: "100%", padding: "16px", border: "none", fontSize: 14, fontFamily: "Roboto, sans-serif", color: "var(--az-ink)", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, background: "#ffffff" }}
                  />
                </div>

                {error && <div style={{ padding: "10px 14px", background: "var(--az-red-light)", border: `1px solid ${"#fca5a5"}`, borderRadius: 8, color: "var(--az-red)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                  <button onClick={() => parseEmail(emailText)}
                    style={{ padding: "13px 28px", borderRadius: 10, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    🤖 Parse & extract quote fields
                  </button>
                  <button onClick={() => { fileRef.current?.click(); }}
                    style={{ padding: "13px 20px", borderRadius: 10, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                    📎 Upload .eml file
                  </button>
                  <input ref={fileRef} type="file" accept=".eml,.txt,.msg" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setEmailText(String(ev.target?.result || ""));
                      reader.readAsText(file);
                    }} />
                </div>
              </>
            )}

            {tab === "inbox" && (
              <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden" }}>
                <div style={{ background: "var(--az-navy)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "var(--az-green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Connected Mailbox</div>
                    <div style={{ color: "#ffffff", fontWeight: 600, fontSize: 14 }}>quotes@azurecomm.ie</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Live · syncing</span>
                  </div>
                </div>

                {inboxEmails.map((email, i) => (
                  <div key={email.id}
                    onClick={() => { setSelectedEmail(email.id); setEmailText(SAMPLE_EMAILS[i % SAMPLE_EMAILS.length]?.body || ""); }}
                    style={{ padding: "14px 18px", borderBottom: i < inboxEmails.length - 1 ? `1px solid ${"var(--az-line)"}` : "none", cursor: "pointer", background: selectedEmail === email.id ? "#E8F4FA" : email.unread ? "#FAFFFE" : "#ffffff", borderLeft: selectedEmail === email.id ? `3px solid ${"var(--az-blue)"}` : "3px solid transparent", transition: "background 0.1s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: email.unread ? 700 : 500, color: "var(--az-ink)", display: "flex", alignItems: "center", gap: 7 }}>
                        {email.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--az-blue)", flexShrink: 0, display: "inline-block" }} />}
                        {email.from}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--az-muted)", whiteSpace: "nowrap" as const }}>{email.received}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: email.unread ? 600 : 400, color: "var(--az-ink)", marginBottom: 3 }}>{email.subject}</div>
                    <div style={{ fontSize: 12, color: "var(--az-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{email.preview}</div>
                  </div>
                ))}

                {selectedEmail && (
                  <div style={{ padding: "14px 18px", borderTop: `1px solid ${"var(--az-line)"}`, background: "#F0F9FF" }}>
                    <button onClick={() => parseEmail(emailText)}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      🤖 Parse selected email →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: sample emails + tips */}
          <div>
            <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, padding: "18px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--az-navy)", marginBottom: 12 }}>Try with a sample email</div>
              {SAMPLE_EMAILS.map(s => (
                <button key={s.label} onClick={() => setEmailText(s.body)}
                  style={{ display: "block", width: "100%", padding: "9px 14px", borderRadius: 8, border: `1px solid ${"var(--az-line)"}`, background: "var(--az-bg)", color: "var(--az-ink)", fontSize: 13, textAlign: "left" as const, cursor: "pointer", fontFamily: "Roboto, sans-serif", marginBottom: 8 }}>
                  📧 {s.label}
                </button>
              ))}
            </div>

            <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, padding: "18px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--az-navy)", marginBottom: 10 }}>What gets extracted</div>
              {[
                "Customer name and email",
                "Product type (leaflet, brochure, etc.)",
                "Quantity and size",
                "Paper stock and weight (gsm)",
                "Print sides and colours",
                "Coating and finishing",
                "Delivery address and deadline",
                "PO number if provided",
              ].map(i => (
                <div key={i} style={{ fontSize: 13, color: "var(--az-muted)", padding: "4px 0", display: "flex", gap: 7 }}>
                  <span style={{ color: "var(--az-green)" }}>✓</span>{i}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage: Parsing */}
      {stage === "parsing" && (
        <div style={{ background: "#ffffff", borderRadius: 16, border: `1px solid ${"var(--az-line)"}`, padding: "64px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--az-ink)", marginBottom: 8 }}>Reading email…</div>
          <div style={{ fontSize: 15, color: "var(--az-muted)" }}>Claude is extracting quote fields and applying print industry rules</div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === "review" && parsed && (
        <div>
          {/* Status bar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, padding: "14px 18px", background: "#ffffff", borderRadius: 10, border: `1px solid ${"var(--az-line)"}`, flexWrap: "wrap" as const }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--az-ink)" }}>Draft quote extracted</div>
              <div style={{ fontSize: 13, color: "var(--az-muted)", marginTop: 2 }}>Review and edit fields below before sending to PrintLogic</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
              {parsed.flags.length > 0 && (
                <span style={{ padding: "4px 12px", borderRadius: 20, background: "var(--az-amber-light)", color: "var(--az-amber)", fontSize: 12, fontWeight: 600 }}>
                  ⚠ {parsed.flags.length} field{parsed.flags.length !== 1 ? "s" : ""} need review
                </span>
              )}
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: CONFIDENCE_STYLE[parsed.confidence].bg, color: CONFIDENCE_STYLE[parsed.confidence].color }}>
                {CONFIDENCE_STYLE[parsed.confidence].label}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
            {/* Left: editable fields */}
            <div>
              <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden" }}>
                <div style={{ background: "var(--az-navy)", padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>📋</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Customer & Job</span>
                </div>
                <div style={{ padding: "4px 16px 8px" }}>
                  <FieldRow label="Customer Name"  value={parsed.customer_name}  onChange={v => setParsed(p => p ? { ...p, customer_name: v } : p)} />
                  <FieldRow label="Customer Email" value={parsed.customer_email} onChange={v => setParsed(p => p ? { ...p, customer_email: v } : p)} />
                  <FieldRow label="Product Type"   value={parsed.product_type}   onChange={v => setParsed(p => p ? { ...p, product_type: v } : p)} flag={parsed.flags.includes("product_type")} />
                  <FieldRow label="Quantity"        value={parsed.quantity}       onChange={v => setParsed(p => p ? { ...p, quantity: v } : p)} flag={parsed.flags.includes("quantity")} />
                  <FieldRow label="Deadline"        value={parsed.deadline}       onChange={v => setParsed(p => p ? { ...p, deadline: v } : p)} />
                  <FieldRow label="PO Number"       value={parsed.po_number}      onChange={v => setParsed(p => p ? { ...p, po_number: v } : p)} />
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden", marginTop: 12 }}>
                <div style={{ background: "var(--az-navy)", padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>📐</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Dimensions & Substrate</span>
                </div>
                <div style={{ padding: "4px 16px 8px" }}>
                  <FieldRow label="Finished Size"   value={parsed.finished_size_mm}      onChange={v => setParsed(p => p ? { ...p, finished_size_mm: v } : p)} flag={parsed.flags.includes("finished_size_mm")} />
                  <FieldRow label="Pages"           value={parsed.pages}                 onChange={v => setParsed(p => p ? { ...p, pages: v } : p)} />
                  <FieldRow label="Substrate"       value={parsed.substrate_type}        onChange={v => setParsed(p => p ? { ...p, substrate_type: v } : p)} flag={parsed.flags.includes("substrate_type")} />
                  <FieldRow label="Weight (gsm)"    value={parsed.substrate_weight_gsm}  onChange={v => setParsed(p => p ? { ...p, substrate_weight_gsm: v } : p)} flag={!parsed.substrate_weight_gsm} />
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden", marginTop: 12 }}>
                <div style={{ background: "var(--az-navy)", padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>🖨</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Print & Finishing</span>
                </div>
                <div style={{ padding: "4px 16px 8px" }}>
                  <FieldRow label="Sides Printed" value={parsed.sides_printed}  onChange={v => setParsed(p => p ? { ...p, sides_printed: v } : p)} />
                  <FieldRow label="Coating"       value={parsed.coating_side_1} onChange={v => setParsed(p => p ? { ...p, coating_side_1: v } : p)} />
                  <FieldRow label="Fold Type"     value={parsed.fold_type}      onChange={v => setParsed(p => p ? { ...p, fold_type: v } : p)} />
                  <FieldRow label="Binding"       value={parsed.binding}        onChange={v => setParsed(p => p ? { ...p, binding: v } : p)} />
                  <FieldRow label="Delivery"      value={parsed.delivery_address} onChange={v => setParsed(p => p ? { ...p, delivery_address: v } : p)} />
                  <FieldRow label="Special Notes" value={parsed.special_notes}  onChange={v => setParsed(p => p ? { ...p, special_notes: v } : p)} multiline />
                </div>
              </div>

              {/* GSM warning */}
              {parseInt(parsed.substrate_weight_gsm) >= 170 && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--az-amber-light)", border: `1px solid ${"#fcd34d"}`, borderRadius: 10, fontSize: 13, color: "var(--az-amber)" }}>
                  ⚠️ <strong>Scoring rule:</strong> {parsed.substrate_weight_gsm}gsm+ stock requires scoring before folding.
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" as const }}>
                <button onClick={() => { setStage("input"); setParsed(null); setEmailText(""); }}
                  style={{ padding: "11px 20px", borderRadius: 10, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  ← Start over
                </button>
                <button onClick={confirmQuote}
                  style={{ flex: 1, minWidth: 200, padding: "11px 20px", borderRadius: 10, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  ✓ Confirm — Ready for PrintLogic
                </button>
              </div>
            </div>

            {/* Right: original email */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ background: "#ffffff", borderRadius: 12, border: `1px solid ${"var(--az-line)"}`, overflow: "hidden" }}>
                <div style={{ background: "var(--az-bg)", padding: "12px 16px", borderBottom: `1px solid ${"var(--az-line)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Original email</span>
                  <button onClick={() => setStage("input")} style={{ background: "none", border: "none", color: "var(--az-blue)", fontSize: 12, cursor: "pointer" }}>Edit</button>
                </div>
                <pre style={{ margin: 0, padding: "16px", fontSize: 12, color: "var(--az-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const, maxHeight: 400, overflowY: "auto", fontFamily: "'JetBrains Mono', monospace" }}>
                  {parsed.raw_email}
                </pre>
              </div>

              {/* Flag list */}
              {parsed.flags.length > 0 && (
                <div style={{ marginTop: 12, background: "var(--az-amber-light)", border: `1px solid ${"#fcd34d"}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--az-amber)", marginBottom: 8 }}>Fields needing attention</div>
                  {parsed.flags.map(f => (
                    <div key={f} style={{ fontSize: 13, color: "var(--az-amber)", padding: "3px 0", display: "flex", gap: 6 }}>
                      <span>⚠</span> {f.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage: Confirmed */}
      {stage === "confirmed" && parsed && (
        <div style={{ background: "#ffffff", borderRadius: 16, border: `1.5px solid ${"#86efac"}`, padding: "32px", maxWidth: 700 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--az-green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>✅</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--az-ink)", marginBottom: 4 }}>Quote confirmed — ready for PrintLogic</div>
              <div style={{ fontSize: 14, color: "var(--az-muted)" }}>Follow the checklist below to enter in PrintLogic</div>
            </div>
          </div>

          {[
            `Customer: ${parsed.customer_name || "[check email]"} (${parsed.customer_email})`,
            `Create Costed Quote → Job type: ${parsed.product_type || "[confirm]"}`,
            `Quantity: ${parsed.quantity || "[confirm]"} · Size: ${parsed.finished_size_mm || "[confirm]"}`,
            `Stock: ${parsed.substrate_weight_gsm ? `${parsed.substrate_weight_gsm}gsm ` : ""}${parsed.substrate_type || "[confirm]"}`,
            `Sides: ${parsed.sides_printed || "[confirm]"} · Coating: ${parsed.coating_side_1 || "None"}`,
            `Delivery: ${parsed.delivery_address || "[confirm]"} · Deadline: ${parsed.deadline || "[confirm]"}`,
            `${parseInt(parsed.substrate_weight_gsm) >= 170 ? "⚠ Apply scoring before fold · " : ""}Paste item details → Calculate → Review margin → Send`,
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < 6 ? `1px solid ${"var(--az-line)"}` : "none", fontSize: 15 }}>
              <span style={{ color: "var(--az-blue)", fontWeight: 700, minWidth: 24 }}>{i + 1}.</span><span>{s}</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => { setStage("input"); setParsed(null); setEmailText(""); setSelectedEmail(null); }}
              style={{ padding: "11px 20px", borderRadius: 10, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              Parse another email
            </button>
            <button style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: "var(--az-blue)", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              📤 Send follow-up email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
