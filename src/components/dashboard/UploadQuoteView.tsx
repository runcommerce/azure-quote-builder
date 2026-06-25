"use client";
import { useState, useCallback } from "react";
import { C } from "./tokens";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import {
  buildPrompt, buildMtivityPrompt, callExtractAPI,
  lookupMaterial, getJobDefaults, getDeliveryRule,
  generateItemDetails, detectMtivityFormat, detectNonPrint,
  validateExtractedSpec,
} from "@/lib/extract";
import type { ExtractedSpec } from "@/lib/types";

const PRODUCT_TYPES = ["Leaflet","Brochure","Booklet","Business Cards","Postcard","Mailing","Poster","Stationery","Flyer","Catalogue","Menu","Self Mailer","4 Page Leaflet","Large Format Poster"];
const SUBSTRATE_TYPES = ["Silk Coated","Matt Coated","Gloss Coated","Uncoated","Recycled Uncoated","Soft Touch"];
const FOLD_TYPES = ["None","Single Fold","Z-Fold","Roll Fold","Gatefold","Concertina","French Fold"];
const BINDING_TYPES = ["None","Saddle Stitch","Perfect Bound","Loop Stitch","Spiral Bound","Wiro Bound"];
const COATING_TYPES = ["None","Gloss Laminate","Matt Laminate","Soft Touch Laminate","Gloss Varnish","Matt Varnish","UV Spot","Aqueous"];

const GROUPS = [
  { title: "Job", icon: "📋", fields: [
    { key: "job_reference", label: "Quote Reference", placeholder: "e.g. 741086" },
    { key: "customer_name", label: "Customer",        placeholder: "e.g. Custodian" },
    { key: "created_by",    label: "Requested by",    placeholder: "e.g. Bryan Nicholas CPT" },
    { key: "product_type",  label: "Product Type",    options: PRODUCT_TYPES },
    { key: "quantity",      label: "Quantity",         placeholder: "e.g. 5000" },
  ]},
  { title: "Dimensions", icon: "📐", fields: [
    { key: "flat_size_mm",      label: "Flat Size (mm)",      placeholder: "e.g. 420x297" },
    { key: "finished_size_mm",  label: "Finished Size (mm)",  placeholder: "e.g. 210x297" },
    { key: "pages",             label: "Page Count",          placeholder: "e.g. 8"       },
  ]},
  { title: "Substrate", icon: "🗂", fields: [
    { key: "substrate_type",       label: "Substrate Type", options: SUBSTRATE_TYPES },
    { key: "substrate_weight_gsm", label: "Weight (gsm)",   placeholder: "e.g. 170" },
    { key: "sustainability",       label: "Sustainability",  placeholder: "e.g. FSC Mix" },
  ]},
  { title: "Print", icon: "🖨", fields: [
    { key: "sides_printed",  label: "Sides Printed",   options: ["Single sided","Double sided"] },
    { key: "colours_side_1", label: "Colours — Side 1", options: ["4 colour process","Mono","2 colour"] },
    { key: "colours_side_2", label: "Colours — Side 2", options: ["4 colour process","Mono","N/A"] },
  ]},
  { title: "Coating & Finishing", icon: "✂️", fields: [
    { key: "coating_side_1",  label: "Coating — Side 1", options: COATING_TYPES },
    { key: "coating_side_2",  label: "Coating — Side 2", options: COATING_TYPES },
    { key: "fold_type",       label: "Fold Type",         options: FOLD_TYPES },
    { key: "binding",         label: "Binding",           options: BINDING_TYPES },
    { key: "finishing_other", label: "Other Finishing",   placeholder: "e.g. Scoring, Guillotining" },
  ]},
  { title: "Packaging & Delivery", icon: "🚚", fields: [
    { key: "delivery_locations", label: "Delivery Locations", placeholder: "e.g. 1" },
    { key: "delivery_address",   label: "Delivery Address",   placeholder: "City or county" },
    { key: "bundling",           label: "Bundling",           placeholder: "e.g. Shrink wrap in 25s" },
  ]},
  { title: "Artwork", icon: "🎨", fields: [
    { key: "proof_required",  label: "Proof Required",  options: ["None","PDF: Colour","PDF","Hard Copy"] },
    { key: "artwork_status",  label: "Artwork Status",  options: ["New","Repeat","Customer Supplied"] },
    { key: "special_notes",   label: "Special Notes",   placeholder: "Any other requirements" },
  ]},
];

export default function UploadQuoteView() {
  const [file, setFile]         = useState<File | null>(null);
  const [status, setStatus]     = useState<"idle"|"loading"|"done"|"approved"|"cannot_quote">("idle");
  const [spec, setSpec]         = useState<Partial<ExtractedSpec> | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isMtivity, setIsMtivity] = useState(false);

  const admin     = DEFAULT_ADMIN;
  const apiConfig = DEFAULT_API_CONFIG;

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setSpec(null); setError(null); setStatus("idle"); setIsMtivity(false);
  }, []);

  const parseSpec = async () => {
    if (!file) return;
    setStatus("loading"); setError(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      // ── Step 1: Pre-extract text to detect format ──────────────────
      // We send as PDF to Claude first with a lightweight text-dump prompt
      // to detect Mtivity format before choosing the full extraction prompt.
      // For simplicity, we embed detection keywords in the main prompt selection
      // by asking Claude to identify format in both prompts — the Mtivity prompt
      // is selected server-side via a hint in the request body.

      // Client-side heuristic: if filename contains known Mtivity patterns
      const filenameLower = file.name.toLowerCase();
      const filenameHint  = filenameLower.includes("spec") || filenameLower.includes("mtivity") || filenameLower.includes("caudit");

      // ── Step 2: Use detection hint to pick prompt ──────────────────
      // Full text detection happens inside Claude — we pass both prompts
      // and let the route decide. The prompt itself instructs Claude to
      // look for Mtivity signals and respond accordingly.
      // We send the Mtivity prompt when filename hints are present,
      // falling back if the response indicates generic format.
      const cfg    = apiConfig[apiConfig.provider as keyof typeof apiConfig] as { model: string; apiKey: string };
      const prompt = filenameHint ? buildMtivityPrompt(admin) : buildPrompt(admin);

      const text = await callExtractAPI(base64, "application/pdf", apiConfig.provider, cfg.model, prompt, cfg.apiKey || "");
      if (!text) throw new Error("No response from API. Check ANTHROPIC_API_KEY is set in Vercel environment variables.");

      const cleaned = text.replace(/```json|```/g, "").trim();
      if (!cleaned) throw new Error("Empty response from API.");

      const parsed: ExtractedSpec = JSON.parse(cleaned);

      // ── Step 3: Detect if this is an Mtivity format response ──────
      const detectedMtivity = parsed.source_format === "mtivity";
      setIsMtivity(detectedMtivity);

      // If not Mtivity and filename hinted it was, re-run with generic prompt
      // (handles edge case of non-Mtivity PDF with spec-like filename)
      // For now: trust Claude's source_format field.

      // ── Step 4: Cannot-quote check ──────────────────────────────
      if (parsed.cannot_quote) {
        setSpec(parsed);
        setStatus("cannot_quote");
        return;
      }

      // ── Step 5: Apply validation rules ──────────────────────────
      // Wires: 170gsm+ scoring, required field flags
      const validated = validateExtractedSpec(parsed) as ExtractedSpec;
      setSpec(validated);
      setStatus("done");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed. Check ANTHROPIC_API_KEY in Admin Settings.");
      setStatus("idle");
    }
  };

  const g = (key: string) => { const v = spec?.[key as keyof ExtractedSpec]; return v === null || v === undefined ? "" : String(v); };
  const flags = (spec as ExtractedSpec | null)?.confidence_flags || [];
  const isFlagged = (key: string) => flags.some(f => f.toLowerCase().replace(/\s/g,"").includes(key.replace(/_/g,"")));

  const plMaterial    = lookupMaterial(spec, admin);
  const jobDefaults   = getJobDefaults(spec, admin);
  const deliveryRule  = getDeliveryRule(spec, admin);
  const itemDetails   = generateItemDetails(spec);
  const gsm           = parseInt(g("substrate_weight_gsm") || "0");
  // Scoring is now auto-applied in validateExtractedSpec — show as confirmed not warning
  const scoringApplied = gsm >= 170 && (spec?.finishing_other || "").toLowerCase().includes("scor");

  const inp = (flagged: boolean): React.CSSProperties => ({
    width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box" as const,
    border: `1.5px solid ${flagged ? "#fcd34d" : "var(--az-line)"}`,
    background: flagged ? "var(--az-amber-light)" : "#ffffff", fontSize: 14,
    fontFamily: "Roboto, sans-serif", color: "var(--az-ink)",
  });

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>Upload RFQ Spec</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--az-muted)" }}>
            Upload a portal spec PDF (HH Global · Custodian · Konica · Mtivity) — AI extracts and validates all fields.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      {status === "idle" && (
        <>
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById("pdf-upload")?.click()}
            style={{ background: dragOver ? "#E8F4FA" : "#ffffff", border: `2px dashed ${dragOver ? "var(--az-forest)" : "var(--az-line)"}`, borderRadius: 12, padding: "28px 32px", textAlign: "center", cursor: "pointer", marginBottom: 16, transition: "all 0.15s" }}
          >
            <input id="pdf-upload" type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--az-ink)", marginBottom: 6 }}>
              {file ? file.name : "Drop a spec PDF here or click to browse"}
            </div>
            <div style={{ fontSize: 14, color: "var(--az-muted)" }}>
              {file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : "Mtivity · HH Global · Custodian · Konica · Email specs"}
            </div>
          </div>
          {error && <div style={{ padding: "10px 16px", background: "var(--az-red-light)", border: "1px solid #fca5a5", borderRadius: 8, color: "var(--az-red)", fontSize: 14, marginBottom: 12 }}>{error}</div>}
          {file && (
            <button onClick={parseSpec}
              style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: "var(--az-forest)", color: "#ffffff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              Extract quote fields →
            </button>
          )}
        </>
      )}

      {status === "loading" && (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--az-line)", padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--az-ink)", marginBottom: 6 }}>Reading spec…</div>
          <div style={{ fontSize: 14, color: "var(--az-muted)" }}>Applying print industry rules to {file?.name}</div>
        </div>
      )}

      {/* ── CANNOT QUOTE STATE ── */}
      {status === "cannot_quote" && spec && (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1.5px solid #fca5a5", padding: "28px 32px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--az-red)", marginBottom: 8 }}>⛔ Cannot quote this spec</div>
          <div style={{ fontSize: 14, color: "var(--az-ink)", lineHeight: 1.7, marginBottom: 16 }}>
            {spec.cannot_quote_reason || "This RFQ does not contain a print specification."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, fontSize: 13 }}>
            {[
              ["Spec ref",    g("job_reference")],
              ["Created by",  g("created_by")],
              ["Category",    g("mtivity_product_type") || "—"],
              ["Date",        g("created_date")],
            ].map(([l, v]) => (
              <div key={l} style={{ background: "var(--az-offwhite, #f7f7f7)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div>
                <div style={{ fontWeight: 600 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); }}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1.5px solid var(--az-line)", background: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif", color: "var(--az-muted)" }}>
              ← Upload different spec
            </button>
            <button onClick={() => {
              const body = "Hi,\n\nWe received spec " + g("job_reference") + " but it appears to be a freight/logistics-only request rather than a print job. Could you clarify whether this accompanies a print order, or confirm the correct spec?\n\nThanks,\nAzure Communications";
              navigator.clipboard.writeText(body);
            }}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1.5px solid var(--az-line)", background: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif", color: "var(--az-ink)" }}>
              Copy clarification email
            </button>
          </div>
        </div>
      )}

      {(status === "done" || status === "approved") && spec && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
          {/* Left: fields */}
          <div>

            {/* ── FORMAT BADGE ── */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              {isMtivity ? (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#E8F4FA", color: "#185FA5", border: "1px solid #B5D4F4" }}>
                  ✓ Mtivity format detected — structured parser applied
                </span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F7F7F7", color: "#6B7280", border: "1px solid #E6E6E6" }}>
                  General spec — standard parser applied
                </span>
              )}
              {spec.created_by && (
                <span style={{ fontSize: 12, color: "var(--az-muted)" }}>
                  Requested by {spec.created_by}{spec.created_date ? " · " + spec.created_date : ""}
                </span>
              )}
            </div>

            {/* ── SUBSTRATE CONFLICT ALERT ── */}
            {spec.substrate_conflict && (
              <div style={{ background: "#FDECEA", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--az-red)", marginBottom: 4 }}>⛔ Substrate conflict — human selection required</div>
                <div style={{ fontSize: 13, color: "var(--az-red)", lineHeight: 1.6 }}>{spec.substrate_conflict_detail}</div>
                <div style={{ fontSize: 12, marginTop: 8, color: "var(--az-muted)" }}>Stock field has been left blank. Select the correct substrate before calculating.</div>
              </div>
            )}

            {/* ── CONFIDENCE FLAGS ── */}
            {flags.length > 0 && (
              <div style={{ background: "var(--az-amber-light)", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--az-amber)", marginBottom: 6 }}>⚠ Review these fields before approving</div>
                {flags.map((f, i) => <div key={i} style={{ fontSize: 13, color: "var(--az-amber)", paddingLeft: 10 }}>· {f}</div>)}
              </div>
            )}

            {/* ── PRINTLOGIC MATCH ── */}
            <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--az-line)", padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--az-forest)", marginBottom: 12 }}>🎯 PrintLogic Auto-Match</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  ["Stock",    spec.substrate_conflict ? "⛔ Conflict — select manually" : plMaterial ? plMaterial.printlogic + (plMaterial.confirmed ? "" : " ⚠") : "No match — select manually"],
                  ["Delivery", deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : jobDefaults?.delivery || "—"],
                  ["Job Type", jobDefaults ? `✓ ${jobDefaults.jobType}` : spec.mtivity_product_type ? `⚠ ${spec.mtivity_product_type} (unmapped)` : "—"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--az-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 13, color: "var(--az-ink)", lineHeight: 1.4 }}>{v}</div>
                  </div>
                ))}
              </div>
              {scoringApplied && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--az-greenLight, #E9F5F0)", border: "1px solid #86efac", borderRadius: 7, fontSize: 13, color: "var(--az-green)" }}>
                  ✓ <strong>Scoring auto-applied:</strong> {gsm}gsm stock — scoring added to finishing (Aaron&apos;s 170gsm+ rule)
                </div>
              )}
            </div>

            {/* Field groups */}
            {GROUPS.map(group => (
              <div key={group.title} style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--az-line)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ background: "var(--az-forest)", padding: "12px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{group.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{group.title}</span>
                </div>
                <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
                  {group.fields.map(f => {
                    const flagged = isFlagged(f.key) || (f.key === "substrate_type" && !!spec.substrate_conflict);
                    const val = g(f.key);
                    return (
                      <div key={f.key}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: flagged ? "var(--az-amber)" : "var(--az-muted)", display: "block", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                          {f.label} {flagged && "⚠"}
                        </label>
                        {"options" in f ? (
                          <select value={val} onChange={e => setSpec(prev => prev ? { ...prev, [f.key]: e.target.value } : prev)} style={inp(flagged)}>
                            {!val && <option value="">— Select —</option>}
                            {(f as { options: string[] }).options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input value={val} onChange={e => setSpec(prev => prev ? { ...prev, [f.key]: e.target.value } : prev)} placeholder={(f as { placeholder?: string }).placeholder || "Not specified"} style={inp(flagged)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); setIsMtivity(false); }}
                style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid var(--az-line)", background: "#ffffff", color: "var(--az-muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                ← New spec
              </button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(spec, null, 2))}
                style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid var(--az-line)", background: "#ffffff", color: "var(--az-muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                Export JSON
              </button>
              {status === "done" && !spec.substrate_conflict && (
                <button onClick={() => setStatus("approved")}
                  style={{ flex: 1, minWidth: 200, padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--az-forest)", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  ✓ Approve — Ready for PrintLogic
                </button>
              )}
              {status === "done" && spec.substrate_conflict && (
                <div style={{ flex: 1, padding: "12px 20px", borderRadius: 10, background: "#FDECEA", border: "1px solid #fca5a5", fontSize: 14, color: "var(--az-red)", display: "flex", alignItems: "center" }}>
                  ⛔ Resolve substrate conflict above before approving
                </div>
              )}
            </div>

            {status === "approved" && (
              <div style={{ background: "#ffffff", border: "1.5px solid #86efac", borderRadius: 12, padding: "20px", marginTop: 16 }}>
                <div style={{ fontWeight: 700, color: "var(--az-forest)", marginBottom: 12, fontSize: 16 }}>✅ Approved — PrintLogic Steps</div>
                {[
                  `Find customer: ${g("customer_name") || "[check email]"}`,
                  `Create Costed Quote → Job type: ${g("product_type") || "[confirm]"}`,
                  `Quantity: ${g("quantity") || "[confirm]"} · Size: ${g("finished_size_mm") || "[confirm]"}`,
                  `Stock: ${plMaterial?.printlogic || "[Aaron to select]"}`,
                  `Sides: ${g("sides_printed") || "[confirm]"} · Apply finishes${scoringApplied ? " · ✓ Scoring auto-applied" : ""}`,
                  `Delivery: ${deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : "[confirm]"}`,
                  `Paste item details (right panel) → Calculate → Review margin → Send`,
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < 6 ? "1px solid var(--az-line)" : "none", fontSize: 14 }}>
                    <span style={{ color: "var(--az-forest)", fontWeight: 700, minWidth: 22 }}>{i + 1}.</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: live preview */}
          <div style={{ position: "sticky", top: 20 }}>
            <div style={{ background: "#0a1a10", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ background: "var(--az-forest)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--az-lime)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>🖨 PrintLogic Item Details</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Live · updates as you edit · Aaron&apos;s format</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(itemDetails); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Roboto, sans-serif" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "18px", fontFamily: "monospace", fontSize: 13, color: "#a8e6b4", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 360, overflowY: "auto" }}>
                {itemDetails || "— Complete fields to generate —"}
              </pre>
            </div>

            <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--az-line)", padding: "16px 18px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--az-forest)", marginBottom: 12 }}>Quick summary</div>
              {[
                ["Spec ref",   g("job_reference")],
                ["Customer",   g("customer_name")],
                ["Product",    g("product_type") || (spec.mtivity_product_type ? "⚠ " + spec.mtivity_product_type : "")],
                ["Qty",        g("quantity")],
                ["Size",       g("finished_size_mm")],
                ["Pages",      g("pages") ? `${g("pages")}pp` : ""],
                ["Stock",      g("substrate_weight_gsm") && g("substrate_type") ? `${g("substrate_weight_gsm")}gsm ${g("substrate_type")}` : ""],
                ["Finishing",  g("finishing_other")],
                ["Delivery",   deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : ""],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--az-line)", fontSize: 13 }}>
                  <span style={{ color: "var(--az-muted)", fontWeight: 500 }}>{l}</span>
                  <span style={{ color: v ? "var(--az-ink)" : "rgba(16,32,51,0.18)", fontWeight: v ? 600 : 400, textAlign: "right", maxWidth: "60%" }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
