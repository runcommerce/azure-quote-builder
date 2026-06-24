"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import type { AdminConfig, ApiConfig, ExtractedSpec } from "@/lib/types";
import { buildPrompt, callExtractAPI, lookupMaterial, getJobDefaults, getDeliveryRule, generateItemDetails } from "@/lib/extract";
import AdminPanel from "@/components/AdminPanel";
import ClientOnly from "@/components/ClientOnly";

// ── Brand tokens ──────────────────────────────────────────────────────────
const C = {
  navy:        "#183230",
  navyDark:    "#0f2320",
  azure:       "#007EBB",
  azureLight:  "#E8F4FA",
  azureMid:    "#B3D9ED",
  white:       "#FFFFFF",
  offWhite:    "#F4F6F8",
  grey:        "#E2E6EA",
  greyMid:     "#C8D0D8",
  greyDark:    "#4A5568",
  muted:       "#718096",
  dark:        "#1A202C",
  amber:       "#D97706",
  amberLight:  "#FEF3C7",
  amberBorder: "#FCD34D",
  red:         "#DC2626",
  redLight:    "#FEE2E2",
  redBorder:   "#FCA5A5",
  green:       "#059669",
  greenLight:  "#D1FAE5",
  greenBorder: "#6EE7B7",
};

type Status = "idle" | "loading" | "done" | "approved";

// ── Confidence dot ────────────────────────────────────────────────────────
function ConfDot({ level }: { level: "green" | "amber" | "red" | "none" }) {
  const colours = { green: C.green, amber: C.amber, red: C.red, none: C.greyMid };
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: colours[level], flexShrink: 0,
      boxShadow: level === "red" ? `0 0 6px ${C.red}` : "none",
    }} />
  );
}

// ── Field component ───────────────────────────────────────────────────────
function Field({
  label, value, onChange, flagLevel = "none", flagNote, options, placeholder, readonly, wide
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  flagLevel?: "green" | "amber" | "red" | "none";
  flagNote?: string;
  options?: string[];
  placeholder?: string;
  readonly?: boolean;
  wide?: boolean;
}) {
  const borderColor = flagLevel === "red" ? C.redBorder : flagLevel === "amber" ? C.amberBorder : C.grey;
  const bgColor = flagLevel === "red" ? "#FFF5F5" : flagLevel === "amber" ? "#FFFBF0" : C.white;
  const labelColor = flagLevel === "red" ? C.red : flagLevel === "amber" ? C.amber : C.muted;

  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <ConfDot level={flagLevel} />
        <label style={{ fontSize: 13, fontWeight: 600, color: labelColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </label>
        {flagLevel === "red" && (
          <span style={{ fontSize: 11, background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}`, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>Missing</span>
        )}
        {flagLevel === "amber" && (
          <span style={{ fontSize: 11, background: C.amberLight, color: C.amber, border: `1px solid ${C.amberBorder}`, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>Review</span>
        )}
      </div>

      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={readonly}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 15,
            border: `1.5px solid ${borderColor}`, background: bgColor,
            color: value ? C.dark : C.muted, fontFamily: "Roboto, sans-serif",
            cursor: readonly ? "not-allowed" : "pointer", outline: "none",
            appearance: "none", WebkitAppearance: "none",
          }}
        >
          {!value && <option value="">— Select —</option>}
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readonly}
          placeholder={placeholder || "Not specified"}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 15,
            border: `1.5px solid ${borderColor}`, background: readonly ? C.offWhite : bgColor,
            color: value ? C.dark : C.muted, fontFamily: "Roboto, sans-serif",
            cursor: readonly ? "default" : "text", outline: "none", boxSizing: "border-box",
          }}
        />
      )}

      {flagNote && (
        <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginTop: 5, padding: "6px 10px", background: flagLevel === "red" ? C.redLight : C.amberLight, borderRadius: 6, border: `1px solid ${flagLevel === "red" ? C.redBorder : C.amberBorder}` }}>
          <span style={{ fontSize: 13 }}>{flagLevel === "red" ? "⛔" : "⚠️"}</span>
          <span style={{ fontSize: 12, color: flagLevel === "red" ? C.red : C.amber, lineHeight: 1.5 }}>{flagNote}</span>
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, icon, children, cols = 2 }: { title: string; icon: string; children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: C.navy, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.white, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
      </div>
      <div style={{
        padding: "20px",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "16px",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ spec, flags }: { spec: Partial<ExtractedSpec> | null; flags: string[] }) {
  if (!spec) return null;
  const criticalFields = ["product_type","quantity","substrate_type","substrate_weight_gsm","sides_printed","finished_size_mm","pages"];
  const filled = criticalFields.filter(k => {
    const v = spec[k as keyof ExtractedSpec];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  const pct = Math.round((filled / criticalFields.length) * 100);
  const redCount = flags.length;
  const amberCount = Object.values(spec).filter(v => v === null || v === undefined).length;

  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Spec completion</div>
        <div style={{ display: "flex", gap: 8 }}>
          {redCount > 0 && (
            <span style={{ fontSize: 12, background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}`, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              ⛔ {redCount} flagged
            </span>
          )}
          <span style={{ fontSize: 12, background: C.greenLight, color: C.green, border: `1px solid ${C.greenBorder}`, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
            ✓ {filled}/{criticalFields.length} complete
          </span>
        </div>
      </div>
      <div style={{ height: 8, background: C.grey, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.green : pct > 60 ? C.azure : C.amber, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      {redCount > 0 && (
        <div style={{ marginTop: 10, fontSize: 13, color: C.red, fontWeight: 500 }}>
          ⛔ {redCount} field{redCount !== 1 ? "s" : ""} must be resolved before sending to PrintLogic
        </div>
      )}
    </div>
  );
}

// ── PrintLogic live preview panel ─────────────────────────────────────────
function PreviewPanel({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div style={{ background: "#0a1a10", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: `1px solid #1a3a20` }}>
      <div style={{ background: C.navy, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c8e63c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            🖨 PrintLogic Item Details
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Live preview — updates as you edit</div>
        </div>
        <button onClick={onCopy} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: C.white, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif", fontWeight: 600 }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "20px", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: 13, color: "#a8e6b4", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 360, overflowY: "auto" }}>
        {text || "— Complete fields above to generate PrintLogic output —"}
      </pre>
    </div>
  );
}

// ── Scoring rule checker ──────────────────────────────────────────────────
function getScoringRule(gsm: string | null | undefined, foldType: string | null | undefined): string | null {
  const weight = parseInt(String(gsm || "0"), 10);
  if (weight >= 170) return `170gsm+ stock requires scoring — apply Score ${weight >= 250 ? "SRA3 Heavy" : "SRA3"} before folding`;
  if (foldType && foldType !== "None" && foldType !== "None (saddle-stitched)") return "Folded product — confirm if scoring is required";
  return null;
}

// ── Main App ──────────────────────────────────────────────────────────────
function QuoteApp() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminConfig>(DEFAULT_ADMIN);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [spec, setSpec] = useState<Partial<ExtractedSpec> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (sessionStatus === "loading") return null;

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setSpec(null); setError(null); setStatus("idle");
  }, []);

  const parseSpec = async () => {
    if (!file) return;
    setStatus("loading"); setError(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const cfg = apiConfig[apiConfig.provider as keyof ApiConfig] as { model: string; apiKey: string };
      const text = await callExtractAPI(base64, "application/pdf", apiConfig.provider, cfg.model, buildPrompt(admin), cfg.apiKey || "");
      const parsed: ExtractedSpec = JSON.parse(text.replace(/```json|```/g, "").trim());
      setSpec(parsed);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed. Check API settings in Admin.");
      setStatus("idle");
    }
  };

  const updateField = (key: string, value: string) =>
    setSpec(prev => prev ? { ...prev, [key]: value } : prev);

  const g = (key: keyof ExtractedSpec): string => {
    const v = spec?.[key];
    return v === null || v === undefined ? "" : String(v);
  };

  const flags = (spec as ExtractedSpec | null)?.confidence_flags || [];
  const isFlagged = (key: string) => flags.some(f => f.toLowerCase().replace(/\s/g, "").includes(key.replace(/_/g, "")));
  const flagLevel = (key: string): "red" | "amber" | "green" | "none" => {
    if (!spec) return "none";
    const val = g(key as keyof ExtractedSpec);
    if (isFlagged(key)) return "amber";
    if (!val) return "red";
    return "green";
  };

  const plMaterial = lookupMaterial(spec, admin);
  const jobDefaults = getJobDefaults(spec, admin);
  const deliveryRule = getDeliveryRule(spec, admin);
  const itemDetails = generateItemDetails(spec);
  const scoringRule = getScoringRule(g("substrate_weight_gsm"), g("fold_type"));

  const copyPreview = () => {
    navigator.clipboard.writeText(itemDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PRODUCT_TYPES = ["Leaflet", "Brochure", "Booklet", "Business Cards", "Postcard", "Mailing", "Poster", "Stationery", "Flyer", "Catalogue", "Report", "Folder", "Banner"];
  const SUBSTRATE_TYPES = ["Silk Coated", "Matt Coated", "Gloss Coated", "Uncoated", "Recycled Uncoated", "Soft Touch"];
  const FOLD_TYPES = ["None", "Single Fold", "Z-Fold", "Roll Fold", "Gatefold", "Concertina", "French Fold"];
  const BINDING_TYPES = ["None", "Saddle Stitch", "Perfect Bound", "Loop Stitch", "Spiral Bound", "Wiro Bound"];
  const COATING_TYPES = ["None", "Gloss Laminate", "Matt Laminate", "Soft Touch Laminate", "Gloss Varnish", "Matt Varnish", "UV Spot", "Aqueous"];
  const PROOF_TYPES = ["None", "PDF: Colour", "PDF: Soft Proof", "Hard Copy"];
  const ARTWORK_TYPES = ["New", "Repeat", "Customer Supplied", "To Be Supplied"];

  return (
    <div style={{ minHeight: "100vh", background: C.offWhite, fontFamily: "Roboto, sans-serif", color: C.dark }}>
      {showAdmin && (
        <AdminPanel admin={admin} setAdmin={setAdmin} apiConfig={apiConfig} setApiConfig={setApiConfig} onClose={() => setShowAdmin(false)} />
      )}

      {/* ── Header ── */}
      <header style={{ background: C.navy, padding: "0 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 32, width: "auto" }} />
            <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.15)" }} />
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>azure.iq</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Quote Builder</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {session?.user?.name && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.azure, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 13 }}>
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500 }}>{session.user.name.split(" ")[0]}</span>
              </div>
            )}
            {session?.user?.role === "admin" && (
              <button onClick={() => router.push("/admin")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
                👥 Users
              </button>
            )}
            <button onClick={() => setShowAdmin(true)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: C.white, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontFamily: "Roboto, sans-serif", fontWeight: 600 }}>
              ⚙ Admin
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Upload zone ── */}
        {status === "idle" && (
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{ background: C.white, borderRadius: 16, border: `2px dashed ${dragOver ? C.azure : C.grey}`, padding: "56px 32px", textAlign: "center", marginBottom: 24, transition: "all 0.15s", cursor: "pointer" }}
            onClick={() => document.getElementById("pdf-input")?.click()}
          >
            <input id="pdf-input" type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
              {file ? file.name : "Drop an RFQ spec PDF here"}
            </div>
            <div style={{ fontSize: 15, color: C.muted }}>
              {file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : `Active portals: ${admin.portalCustomers.filter(c => c.active).map(c => c.name).join(" · ")}`}
            </div>
            {error && <div style={{ marginTop: 16, padding: "10px 16px", background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, color: C.red, fontSize: 14 }}>{error}</div>}
          </div>
        )}

        {file && status === "idle" && (
          <button onClick={parseSpec} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", background: C.navy, color: C.white, fontSize: 17, fontWeight: 700, cursor: "pointer", marginBottom: 24, fontFamily: "Roboto, sans-serif", letterSpacing: "0.01em" }}>
            Extract quote fields from {file.name} →
          </button>
        )}

        {status === "loading" && (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.grey}`, padding: "56px 32px", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite" }}>⚙️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 8 }}>Extracting quote fields…</div>
            <div style={{ fontSize: 15, color: C.muted }}>Reading {file?.name} and applying print industry rules</div>
          </div>
        )}

        {(status === "done" || status === "approved") && spec && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

            {/* ── LEFT: Fields ── */}
            <div>
              <ProgressBar spec={spec} flags={flags} />

              {/* PrintLogic auto-match */}
              <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🎯</span> PrintLogic Auto-Match
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Stock Name</div>
                    <div style={{ fontSize: 14, color: plMaterial ? C.dark : C.amber, fontWeight: 500, lineHeight: 1.4 }}>
                      {plMaterial ? plMaterial.printlogic : "⚠ No match — select manually"}
                      {plMaterial && !plMaterial.confirmed && <span style={{ display: "block", fontSize: 12, color: C.amber, marginTop: 2 }}>⚠ Aaron to confirm</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Delivery</div>
                    <div style={{ fontSize: 14, color: C.dark }}>{deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : jobDefaults?.delivery || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Job Type</div>
                    <div style={{ fontSize: 14, color: C.dark }}>{jobDefaults ? `✓ ${jobDefaults.jobType}` : "—"}</div>
                  </div>
                </div>
                {scoringRule && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: C.amberLight, border: `1px solid ${C.amberBorder}`, borderRadius: 8, fontSize: 13, color: C.amber, display: "flex", gap: 8 }}>
                    <span>⚠️</span><span><strong>Scoring rule:</strong> {scoringRule}</span>
                  </div>
                )}
              </div>

              {/* Job Info */}
              <Section title="Job Info" icon="📋" cols={2}>
                <Field label="Quote Reference" value={g("job_reference")} onChange={v => updateField("job_reference", v)} flagLevel={flagLevel("job_reference")} placeholder="e.g. QR-2026-0847" />
                <Field label="Customer" value={g("customer_name")} onChange={v => updateField("customer_name", v)} flagLevel={flagLevel("customer_name")} placeholder="e.g. HH Global" />
                <Field label="Product Type" value={g("product_type")} onChange={v => updateField("product_type", v)} flagLevel={flagLevel("product_type")} options={PRODUCT_TYPES} />
                <Field label="Quantity" value={g("quantity")} onChange={v => updateField("quantity", v)} flagLevel={flagLevel("quantity")} placeholder="e.g. 5000" flagNote={isFlagged("quantity") ? "Quantity was ambiguous or missing in spec" : undefined} />
              </Section>

              {/* Dimensions */}
              <Section title="Dimensions" icon="📐" cols={3}>
                <Field label="Flat Size (mm)" value={g("flat_size_mm")} onChange={v => updateField("flat_size_mm", v)} flagLevel={flagLevel("flat_size_mm")} placeholder="e.g. 420 x 297" />
                <Field label="Finished Size (mm)" value={g("finished_size_mm")} onChange={v => updateField("finished_size_mm", v)} flagLevel={flagLevel("finished_size_mm")} placeholder="e.g. 210 x 297" />
                <Field label="Page Count" value={g("pages")} onChange={v => updateField("pages", v)} flagLevel={flagLevel("pages")} placeholder="e.g. 8" flagNote={isFlagged("pages") ? "Confirm if self-cover or separate cover" : undefined} />
              </Section>

              {/* Substrate */}
              <Section title="Substrate & Stock" icon="🗂" cols={3}>
                <Field label="Substrate Type" value={g("substrate_type")} onChange={v => updateField("substrate_type", v)} flagLevel={flagLevel("substrate_type")} options={SUBSTRATE_TYPES} />
                <Field label="Weight (gsm)" value={g("substrate_weight_gsm")} onChange={v => updateField("substrate_weight_gsm", v)} flagLevel={!g("substrate_weight_gsm") ? "red" : flagLevel("substrate_weight_gsm")} placeholder="e.g. 170" flagNote={!g("substrate_weight_gsm") ? "Required — affects scoring rules" : undefined} />
                <Field label="Sustainability" value={g("sustainability")} onChange={v => updateField("sustainability", v)} flagLevel={flagLevel("sustainability")} placeholder="e.g. FSC Mix" />
              </Section>

              {/* Print */}
              <Section title="Print Specification" icon="🖨" cols={2}>
                <Field label="Sides Printed" value={g("sides_printed")} onChange={v => updateField("sides_printed", v)} flagLevel={flagLevel("sides_printed")} options={["Single sided", "Double sided"]} />
                <Field label="Colours — Side 1" value={g("colours_side_1")} onChange={v => updateField("colours_side_1", v)} flagLevel={flagLevel("colours_side_1")} options={["4 colour process", "Mono", "2 colour"]} />
                <Field label="Colours — Side 2" value={g("colours_side_2")} onChange={v => updateField("colours_side_2", v)} flagLevel={flagLevel("colours_side_2")} options={["4 colour process", "Mono", "N/A"]} />
              </Section>

              {/* Finishing */}
              <Section title="Coating & Finishing" icon="✂️" cols={2}>
                <Field label="Coating — Side 1" value={g("coating_side_1")} onChange={v => updateField("coating_side_1", v)} flagLevel={flagLevel("coating_side_1")} options={COATING_TYPES} />
                <Field label="Coating — Side 2" value={g("coating_side_2")} onChange={v => updateField("coating_side_2", v)} flagLevel={flagLevel("coating_side_2")} options={COATING_TYPES} />
                <Field label="Fold Type" value={g("fold_type")} onChange={v => updateField("fold_type", v)} flagLevel={flagLevel("fold_type")} options={FOLD_TYPES} flagNote={isFlagged("fold_type") ? "Spec mentions folded delivery — confirm sub-type" : undefined} />
                <Field label="Binding" value={g("binding")} onChange={v => updateField("binding", v)} flagLevel={flagLevel("binding")} options={BINDING_TYPES} />
                <Field label="Other Finishing" value={g("finishing_other")} onChange={v => updateField("finishing_other", v)} flagLevel={flagLevel("finishing_other")} placeholder="e.g. die cut, perf, score" wide />
              </Section>

              {/* Packaging & Delivery */}
              <Section title="Packaging & Delivery" icon="🚚" cols={2}>
                <Field label="Delivery Locations" value={g("delivery_locations")} onChange={v => updateField("delivery_locations", v)} flagLevel={!g("delivery_locations") ? "red" : flagLevel("delivery_locations")} placeholder="e.g. 1x Dublin, 2x Cork" flagNote={!g("delivery_locations") ? "Not specified — request from customer or check portal brief" : undefined} />
                <Field label="Delivery Address" value={g("delivery_address")} onChange={v => updateField("delivery_address", v)} flagLevel={flagLevel("delivery_address")} placeholder="City or county" />
                <Field label="Bundling" value={g("bundling")} onChange={v => updateField("bundling", v)} flagLevel={flagLevel("bundling")} placeholder="e.g. Shrink wrap in 25s" />
                <Field label="Packaging" value={g("packaging")} onChange={v => updateField("packaging", v)} flagLevel={flagLevel("packaging")} options={["None", "Carton", "Pallet", "Customer specified"]} />
              </Section>

              {/* Artwork & Proof */}
              <Section title="Artwork & Proofing" icon="🎨" cols={2}>
                <Field label="Artwork Status" value={g("artwork_status")} onChange={v => updateField("artwork_status", v)} flagLevel={flagLevel("artwork_status")} options={ARTWORK_TYPES} />
                <Field label="Proof Required" value={g("proof_required")} onChange={v => updateField("proof_required", v)} flagLevel={flagLevel("proof_required")} options={PROOF_TYPES} />
                <Field label="Special Notes" value={g("special_notes")} onChange={v => updateField("special_notes", v)} flagLevel={flagLevel("special_notes")} placeholder="Any other requirements" wide />
              </Section>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); }}
                  style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  ← New spec
                </button>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(spec, null, 2))}
                  style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  Export JSON
                </button>
                {status === "done" && (
                  <button onClick={() => setStatus("approved")} style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "none", background: C.navy, color: C.white, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Roboto, sans-serif", minWidth: 200 }}>
                    ✓ Approve — Ready for PrintLogic
                  </button>
                )}
              </div>

              {/* Approved checklist */}
              {status === "approved" && (
                <div style={{ background: C.white, border: `1.5px solid ${C.greenBorder}`, borderRadius: 12, padding: "20px", marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, color: C.navy, marginBottom: 14, fontSize: 17, display: "flex", gap: 8 }}>
                    <span>✅</span> PrintLogic Steps
                  </div>
                  {[
                    `Find customer: ${g("customer_name") || "[check email]"}`,
                    `Create Costed Quote`,
                    `Job type: ${g("product_type") || "[confirm]"}`,
                    `Quantity: ${g("quantity") || "[confirm]"}`,
                    `Stock: ${plMaterial?.printlogic || "[Aaron to select]"}`,
                    `Size: ${g("finished_size_mm") || "[confirm]"} — Sheet: ${admin.defaultSheetSize}`,
                    `Sides: ${g("sides_printed") || jobDefaults?.sides || "[confirm]"}`,
                    `Apply finishes per Aaron's rules${scoringRule ? " — ⚠ check scoring" : ""}`,
                    `Delivery: ${deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : "[confirm]"}`,
                    `Paste item details (right panel) → Calculate → Review margin → Send`,
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < 9 ? `1px solid ${C.grey}` : "none", fontSize: 15 }}>
                      <div style={{ color: C.azure, fontWeight: 700, minWidth: 24, fontSize: 15 }}>{i + 1}.</div>
                      <div>{s}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Live preview ── */}
            <div style={{ position: "sticky", top: 80 }}>
              <PreviewPanel text={itemDetails} onCopy={copyPreview} copied={copied} />

              {/* Scoring alert */}
              {scoringRule && (
                <div style={{ background: C.amberLight, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.amber, marginBottom: 6 }}>⚠ Scoring Rule Triggered</div>
                  <div style={{ fontSize: 14, color: C.amber, lineHeight: 1.6 }}>{scoringRule}</div>
                </div>
              )}

              {/* Spec summary card */}
              <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Quick summary</div>
                {[
                  { label: "Customer", value: g("customer_name") },
                  { label: "Product", value: g("product_type") },
                  { label: "Qty", value: g("quantity") },
                  { label: "Size", value: g("finished_size_mm") },
                  { label: "Pages", value: g("pages") ? `${g("pages")}pp` : "" },
                  { label: "Stock", value: g("substrate_weight_gsm") && g("substrate_type") ? `${g("substrate_weight_gsm")}gsm ${g("substrate_type")}` : "" },
                  { label: "Finish", value: g("coating_side_1") },
                  { label: "Delivery", value: g("delivery_address") || g("delivery_locations") },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.grey}`, fontSize: 14 }}>
                    <span style={{ color: C.muted, fontWeight: 500 }}>{label}</span>
                    <span style={{ color: value ? C.dark : C.redBorder, fontWeight: value ? 600 : 400, textAlign: "right", maxWidth: "60%" }}>
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return <ClientOnly><QuoteApp /></ClientOnly>;
}
