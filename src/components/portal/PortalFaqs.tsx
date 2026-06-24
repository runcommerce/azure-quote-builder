/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import PortalShell, { PortalConfig } from "./PortalShell";

const FAQS = [
  { q: "How do I request a quote?", a: "Click 'Request a Quote' in the top navigation or use the button on the homepage. Fill in the product details, size, quantity and any finishing requirements. Your account manager will respond within 8 business hours." },
  { q: "What file formats do you accept for artwork?", a: "We accept print-ready PDFs (with 3mm bleed), high-resolution TIFFs, and AI/EPS files. All files should be supplied in CMYK colour mode at 300dpi minimum." },
  { q: "How long does delivery take?", a: "Standard lead time is 5–7 working days from artwork approval. Express options are available — contact your account manager to discuss turnaround requirements." },
  { q: "Can I get a proof before printing?", a: "Yes. We offer PDF soft proofs (free) and hard copy proofs (cost varies by job size). Please specify your proofing requirement in the quote request notes." },
  { q: "What payment terms apply to my account?", a: "Payment terms are set per account. Contact your account manager or our accounts team at accounts@azurecomm.ie for details specific to your account." },
  { q: "Can I reorder a previous job?", a: "Yes — mention the previous job reference in your new quote request and we'll pull the specification from our records. Repeat jobs are often faster to quote and produce." },
  { q: "What is the minimum order quantity?", a: "Minimums vary by product. Leaflets start from 250 copies, brochures from 100, business cards from 250. Your account manager can advise on the most cost-effective quantities for your job." },
];

export default function PortalFaqs({ portal }: { portal: PortalConfig }) {
  const pc = portal.primary_color || "#1a3a2e";
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PortalShell portal={portal} activePage="FAQS">
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 40px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 4, letterSpacing: "-0.02em" }}>FAQs</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>Frequently asked questions about ordering through your {portal.company_name} portal.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${open === i ? pc : "#e5e7eb"}`, overflow: "hidden", transition: "border-color 0.15s" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", padding: "16px 20px", border: "none", background: "none", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: "#111", lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: pc, flexShrink: 0, transition: "transform 0.15s", transform: open === i ? "rotate(45deg)" : "none", fontWeight: 300 }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#4b5563", lineHeight: 1.65 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, background: pc, borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Still have a question?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Contact {portal.account_manager_name} directly</div>
          </div>
          <a href={"mailto:" + portal.account_manager_email}
            style={{ padding: "9px 20px", borderRadius: 999, background: portal.accent_color, color: pc, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Get in touch
          </a>
        </div>
      </div>
    </PortalShell>
  );
}
