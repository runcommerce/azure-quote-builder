"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import {
  buildPrompt, buildMtivityPrompt, callExtractAPI,
  lookupMaterial, getJobDefaults, getDeliveryRule,
  generateItemDetails, validateExtractedSpec,
  getMissingFields, draftClarificationEmail, deriveFieldStatus,
} from "@/lib/extract";
import { saveQuote, newQuoteId, loadQuotes } from "@/lib/quotes";
import { estimatePrice, formatEur } from "@/lib/pricing";
import type {
  ExtractedSpec, MtivitySubstrate, MtivitySide, MtivityCoating,
  MtivityFinishingItem, MtivityDeliveryLocation, FieldStatus,
} from "@/lib/types";

// ── TOKENS ────────────────────────────────────────────────────────────────
const T = {
  forest: "#1a3a2e", lime: "#c8e63c",
  ink: "#111827", muted: "#6B7280", line: "#E5E7EB",
  amber: "#ED7D31", amberBg: "#FDF3E8", amberTx: "#633806",
  red: "#C0392B", redBg: "#FDECEA",
  green: "#2D6A4F", greenBg: "#E9F5F0",
  blue: "#185FA5", blueBg: "#E8F4FA",
};

// ── RAG COLOURS ───────────────────────────────────────────────────────────
const RAG: Record<FieldStatus | "empty", { dot: string; border: string; bg: string; label: string }> = {
  green: { dot: "#22c55e", border: "#86efac", bg: "#f0fdf4", label: "Extracted" },
  amber: { dot: "#f59e0b", border: "#fcd34d", bg: "#fffbeb", label: "Inferred" },
  red:   { dot: "#ef4444", border: "#fca5a5", bg: "#fff5f5", label: "Missing" },
  empty: { dot: "transparent", border: T.line, bg: "#fff", label: "" },
};

function StatusDot({ status }: { status: FieldStatus }) {
  const r = RAG[status];
  if (status === "empty") return null;
  return (
    <span title={r.label} style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: r.dot, marginLeft: 5, verticalAlign: "middle", flexShrink: 0,
    }} />
  );
}

// ── STYLE HELPERS ─────────────────────────────────────────────────────────
const card  = (e?: React.CSSProperties): React.CSSProperties => ({ background: "#fff", borderRadius: 12, border: `1px solid ${T.line}`, marginBottom: 14, overflow: "hidden", ...e });
const sHdr  = (e?: React.CSSProperties): React.CSSProperties => ({ background: T.forest, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, ...e });
const sLbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" };
const fWrap: React.CSSProperties = { padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 };
const fWrapNarrow: React.CSSProperties = { ...fWrap, gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))" };

function Lbl({ children, status }: { children: React.ReactNode; status?: FieldStatus }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", color: status === "red" ? T.red : status === "amber" ? T.amber : T.muted }}>
      {children}
      {status && status !== "empty" && <StatusDot status={status} />}
    </label>
  );
}

function inpStyle(status?: FieldStatus): React.CSSProperties {
  const r = RAG[status ?? "empty"];
  return { width: "100%", padding: "8px 11px", borderRadius: 7, fontSize: 13, border: `1.5px solid ${r.border}`, background: r.bg, color: T.ink, boxSizing: "border-box" };
}

const tog = (on: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${on ? T.forest : T.line}`, background: on ? T.forest : "#fff", color: on ? T.lime : T.muted });
const addB: React.CSSProperties = { padding: "6px 14px", borderRadius: 6, border: `1.5px solid ${T.line}`, background: "#fff", fontSize: 12, fontWeight: 600, color: T.muted, cursor: "pointer" };
const remB: React.CSSProperties = { padding: "4px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: T.redBg, fontSize: 11, color: T.red, cursor: "pointer" };
const gBox = (): React.CSSProperties => ({ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 });
const gHdr = (): React.CSSProperties => ({ background: "#F9FAFB", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.line}` });
const gTtl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: T.ink };
const ipad: React.CSSProperties = { padding: "12px 14px" };

// ── BLANK FACTORIES ───────────────────────────────────────────────────────
const bCoat = (): MtivityCoating => ({ coating_type: "", coating_area: "Overall", comments: "" });
const bSide = (n: number): MtivitySide => ({ side_number: n, four_colour_process: true, spot_colours_required: false, number_of_spot_colours: null, coating_required: false, number_of_coatings: null, coatings: [], side_comments: "" });
const bSub  = (): MtivitySubstrate => ({ used_as: "", substrate_type: "Paper", substrate_name: "", sustainability_accreditation: "", measured_by: "Weight", weight: null, weight_unit: "gsm", thickness: null, thickness_unit: "", section_page_count: null, substrate_comments: "", special_requirements: "", ink_coverage: "", artwork_variation: "", sides: [bSide(1), bSide(2)] });
const bFin  = (): MtivityFinishingItem => ({ finishing_type: "", finishing_area: "Overall", comments: "" });
const bLoc  = (): MtivityDeliveryLocation => ({ location_name: "", address: "", city: "", county: "", country: "Ireland", eircode: "", quantity: null, delivery_notes: "" });

interface UploadQuoteViewProps {
  quoteId?: string | null;
  onClearQuote?: () => void;
}

export default function UploadQuoteView({ quoteId, onClearQuote }: UploadQuoteViewProps = {}) {
  const [file, setFile]         = useState<File | null>(null);
  const [status, setStatus]     = useState<"idle"|"loading"|"done"|"approved"|"cannot_quote">("idle");
  const [spec, setSpec]         = useState<Partial<ExtractedSpec> | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isMtivity, setIsMtivity] = useState(false);
  const [clarifPanel, setClarifPanel] = useState(false);
  const [clarifEmail, setClarifEmail] = useState("");
  const [clarifDraft, setClarifDraft] = useState<{ subject: string; body: string } | null>(null);
  const [clarifSending, setClarifSending] = useState(false);
  const [clarifSent, setClarifSent] = useState(false);
  const [savedQuoteId, setSavedQuoteId]   = useState<string | null>(null);
  const [draftSaved, setDraftSaved]       = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState("");
  const [dateIssued, setDateIssued]       = useState("");
  // Pricing
  const [priceMode, setPriceMode]         = useState<"estimate"|"printlogic"|"manual">("estimate");
  const [showPricing, setShowPricing]     = useState(true);
  const [manualPrice, setManualPrice]     = useState<string>("");

  // Load saved quote when quoteId prop is provided (View spec from Quotes)
  useEffect(() => {
    if (!quoteId) return;
    const all = loadQuotes();
    const found = all.find(q => q.id === quoteId);
    if (!found) return;
    setSpec(found.spec);
    setStatus("done");
    setSavedQuoteId(found.id);
    setDateSubmitted(found.date_submitted ? found.date_submitted.slice(0, 10) : "");
    setDateIssued(found.date_issued ? found.date_issued.slice(0, 10) : "");
    if (found.quoted_price !== null && found.quoted_price !== undefined) {
      setPriceMode(found.price_source ?? "estimate");
      setManualPrice(String(found.quoted_price));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const admin = DEFAULT_ADMIN;
  const apiConfig = DEFAULT_API_CONFIG;

  // ── Updaters ─────────────────────────────────────────────────────────
  const set = <K extends keyof ExtractedSpec>(k: K, v: ExtractedSpec[K]) =>
    setSpec(p => p ? { ...p, [k]: v } : p);

  const setSub = (si: number, patch: Partial<MtivitySubstrate>) =>
    setSpec(p => { if (!p) return p; const s = [...(p.substrates ?? [])]; s[si] = { ...s[si], ...patch }; return { ...p, substrates: s }; });

  const setSide = (si: number, di: number, patch: Partial<MtivitySide>) =>
    setSpec(p => {
      if (!p) return p;
      const ss = [...(p.substrates ?? [])]; const sd = [...(ss[si]?.sides ?? [])];
      sd[di] = { ...sd[di], ...patch }; ss[si] = { ...ss[si], sides: sd };
      return { ...p, substrates: ss };
    });

  const setCoat = (si: number, di: number, ci: number, patch: Partial<MtivityCoating>) =>
    setSpec(p => {
      if (!p) return p;
      const ss = [...(p.substrates ?? [])]; const sd = [...(ss[si]?.sides ?? [])]; const cs = [...(sd[di]?.coatings ?? [])];
      cs[ci] = { ...cs[ci], ...patch }; sd[di] = { ...sd[di], coatings: cs }; ss[si] = { ...ss[si], sides: sd };
      return { ...p, substrates: ss };
    });

  const setFin = (i: number, patch: Partial<MtivityFinishingItem>) =>
    setSpec(p => { if (!p) return p; const fi = [...(p.finishing_items ?? [])]; fi[i] = { ...fi[i], ...patch }; return { ...p, finishing_items: fi }; });

  const setLoc = (i: number, patch: Partial<MtivityDeliveryLocation>) =>
    setSpec(p => { if (!p) return p; const ls = [...(p.delivery_locations ?? [])]; ls[i] = { ...ls[i], ...patch }; return { ...p, delivery_locations: ls }; });

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setSpec(null); setError(null); setStatus("idle"); setIsMtivity(false);
    setClarifPanel(false); setClarifSent(false); setClarifDraft(null);
  }, []);

  // ── Parse ─────────────────────────────────────────────────────────────
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
      const cfg = apiConfig[apiConfig.provider as keyof typeof apiConfig] as { model: string; apiKey: string };
      const hint = file.name.toLowerCase().includes("spec") || file.name.toLowerCase().includes("mtivity");
      const prompt = hint ? buildMtivityPrompt(admin) : buildPrompt(admin);
      const text = await callExtractAPI(base64, "application/pdf", apiConfig.provider, cfg.model, prompt, cfg.apiKey || "");
      if (!text) throw new Error("No response — check ANTHROPIC_API_KEY in Vercel env vars.");
      const parsed: ExtractedSpec = JSON.parse(text.replace(/```json|```/g, "").trim());
      setIsMtivity(parsed.source_format === "mtivity");
      if (parsed.cannot_quote) { setSpec(parsed); setStatus("cannot_quote"); return; }
      const s0 = parsed.substrates?.[0];
      if (s0) {
        parsed.substrate_type       = parsed.substrate_type       ?? s0.substrate_name;
        parsed.substrate_weight_gsm = parsed.substrate_weight_gsm ?? s0.weight;
        parsed.sustainability       = parsed.sustainability        ?? s0.sustainability_accreditation;
        parsed.sides_printed        = parsed.sides_printed         ?? String(s0.sides?.length ?? 2);
      }
      const validated = validateExtractedSpec(parsed) as ExtractedSpec;
      setSpec(validated);
      setStatus("done");
      const missing = getMissingFields(validated);
      if (missing.length > 0) { setClarifDraft(draftClarificationEmail(validated, missing)); setClarifPanel(true); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed — check API key.");
      setStatus("idle");
    }
  };

  const sendClarification = async () => {
    if (!spec || !clarifDraft) return;
    setClarifSending(true);
    try {
      const missing = getMissingFields(spec);
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: clarifEmail || null, specRef: spec.job_reference, specName: spec.spec_name, createdBy: spec.created_by, missingFields: missing.map(f => f.key), send: !!clarifEmail }),
      });
      const data = await res.json();
      if (data.sent) { setClarifSent(true); setClarifPanel(false); }
      else if (data.draft) setClarifDraft({ subject: data.draft.subject ?? clarifDraft.subject, body: data.draft.textBody ?? clarifDraft.body });
    } catch (e) { console.error(e); }
    finally { setClarifSending(false); }
  };

  // ── Save draft ────────────────────────────────────────────────────────
  const saveDraft = () => {
    if (!spec) return;
    const id = savedQuoteId ?? newQuoteId();
    const delivRule = getDeliveryRule(spec, admin);
    const breakdown = priceMode === "estimate"
      ? estimatePrice(spec, delivRule?.courier ?? null, admin.defaultMarkup - 100)
      : null;
    const finalPrice = priceMode === "manual" && manualPrice
      ? Number(manualPrice)
      : breakdown?.quoted_price ?? null;
    saveQuote({
      id,
      status: status === "approved" ? "sent" : "incomplete",
      spec_ref: spec.job_reference ?? null,
      spec_name: spec.spec_name ?? null,
      customer_name: spec.customer_name ?? null,
      product_type: spec.product_type ?? null,
      quantity: spec.quantity ?? null,
      delivery_region: spec.delivery_region ?? null,
      date_submitted: dateSubmitted ? new Date(dateSubmitted).toISOString() : null,
      date_issued: dateIssued ? new Date(dateIssued).toISOString() : null,
      date_updated: new Date().toISOString(),
      spec,
      notes: "",
      quoted_price: finalPrice,
      price_source: priceMode,
      price_breakdown: breakdown,
    });
    setSavedQuoteId(id);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  // ── Derived ──────────────────────────────────────────────────────────
  const flags      = spec?.confidence_flags ?? [];
  const st         = (k: keyof ExtractedSpec) => deriveFieldStatus(spec ?? {}, k as string);
  const plMat      = lookupMaterial(spec, admin);
  const jobDef     = getJobDefaults(spec, admin);
  const delivRule  = getDeliveryRule(spec, admin);
  const itemDets   = generateItemDetails(spec);
  const hasConflict = !!spec?.substrate_conflict;
  const scoringOn  = !!spec?.scoring_auto_applied;
  const gsm        = spec?.substrate_weight_gsm ?? spec?.substrates?.[0]?.weight ?? 0;
  const missingNow = spec ? getMissingFields(spec) : [];
  const isNonPrint = spec?.category_of_work && spec.category_of_work !== "Print";

  // ── Field component ──────────────────────────────────────────────────
  // TEXT INPUTS: uncontrolled (defaultValue + onBlur) to prevent focus loss on re-render
  // SELECTS: controlled (value + onChange) — selects don't lose focus on re-render
  const F = ({ k, label: l, ph, opts, wide }: {
    k: keyof ExtractedSpec; label: string; ph?: string;
    opts?: string[]; wide?: boolean;
  }) => {
    const s = st(k);
    const val = spec?.[k]; const str = val === null || val === undefined ? "" : String(val);
    return (
      <div style={wide ? { gridColumn: "1/-1" } : {}}>
        <Lbl status={s}>{l}</Lbl>
        {opts
          ? <select value={str} onChange={e => set(k, e.target.value as never)} style={inpStyle(s)}>
              {!str && <option value="">— Select —</option>}
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          : <input
              key={`${k}-${savedQuoteId ?? "new"}`}
              defaultValue={str}
              placeholder={ph ?? "—"}
              style={inpStyle(s)}
              onBlur={e => set(k, e.target.value as never)} />
        }
      </div>
    );
  };

  const Bool = ({ k, label: l }: { k: keyof ExtractedSpec; label: string }) => {
    const s = st(k);
    return (
      <div>
        <Lbl status={s}>{l}</Lbl>
        <button style={tog(!!spec?.[k])} onClick={() => set(k, !spec?.[k] as never)}>{spec?.[k] ? "Yes" : "No"}</button>
      </div>
    );
  };

  const NumField = ({ k, label: l, ph }: { k: keyof ExtractedSpec; label: string; ph?: string }) => {
    const s = st(k);
    const val = spec?.[k]; const num = val === null || val === undefined ? "" : String(val);
    return (
      <div>
        <Lbl status={s}>{l}</Lbl>
        <input
          type="number"
          key={`${k}-${savedQuoteId ?? "new"}`}
          defaultValue={num}
          placeholder={ph ?? "—"}
          style={inpStyle(s)}
          onBlur={e => set(k, (Number(e.target.value) || null) as never)} />
      </div>
    );
  };

  // ── RAG LEGEND ───────────────────────────────────────────────────────
  const Legend = () => (
    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
      {(["green","amber","red"] as FieldStatus[]).map(s => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.muted }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: RAG[s].dot, display: "inline-block" }} />
          {RAG[s].label}
        </div>
      ))}
    </div>
  );

  // ── SUBSTRATES section ────────────────────────────────────────────────
  const SubstratesSection = () => {
    const subs = spec?.substrates ?? [];
    return (
      <div style={card()}>
        <div style={sHdr()}>
          <span style={sLbl}>4 + 5 — Substrate & Ink</span>
          <button style={{ ...addB, marginLeft: "auto", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            onClick={() => setSpec(p => p ? { ...p, substrates: [...(p.substrates ?? []), bSub()] } : p)}>
            + Add substrate
          </button>
        </div>
        {subs.map((sub, si) => (
          <div key={si} style={{ borderBottom: si < subs.length - 1 ? `1px solid ${T.line}` : "none" }}>
            <div style={{ ...gHdr(), borderRadius: 0, background: "#F3F4F6" }}>
              <span style={gTtl}>Substrate {si + 1}{sub.substrate_name ? ` — ${sub.substrate_name}` : ""}</span>
              {subs.length > 1 && <button style={remB} onClick={() => setSpec(p => p ? { ...p, substrates: (p.substrates ?? []).filter((_, i) => i !== si) } : p)}>Remove</button>}
            </div>
            <div style={ipad}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: 10, marginBottom: 12 }}>
                {([
                  ["substrate_name",              "Substrate name",      "e.g. Silk Coated", false],
                  ["sustainability_accreditation","Sustainability",      "e.g. FSC Mix",     false],
                  ["weight",                      "Weight (gsm)",        "e.g. 250",         true],
                  ["section_page_count",          "Section pages",       "e.g. 4",           true],
                  ["ink_coverage",                "Ink coverage",        "",                 false],
                  ["artwork_variation",           "Artwork variation",   "e.g. Different Art",false],
                  ["substrate_comments",          "Comments",            "",                 false],
                  ["special_requirements",        "Special requirements","e.g. wipeable, non-gloss",false],
                ] as [string,string,string,boolean][]).map(([key, lb, ph, isNum]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", color: T.muted }}>{lb}</label>
                    <input type={isNum ? "number" : "text"} value={String((sub as never)[key] ?? "")} placeholder={ph}
                      style={inpStyle(key === "special_requirements" && sub.special_requirements ? "amber" : "empty")}
                      onChange={e => setSub(si, { [key]: isNum ? (Number(e.target.value) || null) : e.target.value } as Partial<MtivitySubstrate>)} />
                  </div>
                ))}
              </div>

              {/* SIDES */}
              {sub.sides.map((side, di) => (
                <div key={di} style={gBox()}>
                  <div style={gHdr()}>
                    <span style={gTtl}>Side {side.side_number}</span>
                    {sub.sides.length > 1 && <button style={remB} onClick={() => setSub(si, { sides: sub.sides.filter((_, i) => i !== di) })}>Remove side</button>}
                  </div>
                  <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
                    <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>4-colour process</label><button style={tog(side.four_colour_process)} onClick={() => setSide(si, di, { four_colour_process: !side.four_colour_process })}>{side.four_colour_process ? "Yes" : "No"}</button></div>
                    <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Spot colours</label><button style={tog(side.spot_colours_required)} onClick={() => setSide(si, di, { spot_colours_required: !side.spot_colours_required })}>{side.spot_colours_required ? "Yes" : "No"}</button></div>
                    {side.spot_colours_required && <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>No. of spot colours</label><input type="number" value={side.number_of_spot_colours ?? ""} style={inpStyle()} onChange={e => setSide(si, di, { number_of_spot_colours: Number(e.target.value) || null })} /></div>}
                    <div>
                      <label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Coating required</label>
                      <button style={tog(side.coating_required)} onClick={() => { const n = !side.coating_required; setSide(si, di, { coating_required: n, coatings: n && side.coatings.length === 0 ? [bCoat()] : side.coatings }); }}>{side.coating_required ? "Yes" : "No"}</button>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}><input value={side.side_comments} placeholder="Side comments" style={inpStyle()} onChange={e => setSide(si, di, { side_comments: e.target.value })} /></div>
                  </div>
                  {/* COATINGS — conditional */}
                  {side.coating_required && (
                    <div style={{ padding: "0 14px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Coatings</div>
                      {side.coatings.map((c, ci) => (
                        <div key={ci} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
                          <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Type</label>
                            <select value={c.coating_type} style={inpStyle(c.coating_type ? "green" : "red")} onChange={e => setCoat(si, di, ci, { coating_type: e.target.value })}>
                              <option value="">— Select —</option>
                              {["Matte Varnish","Gloss Varnish","Gloss Laminate","Matt Laminate","Soft Touch Laminate","UV Spot","Aqueous","Silk Varnish"].map(o => <option key={o}>{o}</option>)}
                            </select></div>
                          <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Area</label>
                            <select value={c.coating_area} style={inpStyle("green")} onChange={e => setCoat(si, di, ci, { coating_area: e.target.value })}>
                              {["Overall","Spot","Flood"].map(o => <option key={o}>{o}</option>)}
                            </select></div>
                          <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Comments</label><input value={c.comments} placeholder="e.g. wipeable" style={inpStyle(c.comments ? "amber" : "empty")} onChange={e => setCoat(si, di, ci, { comments: e.target.value })} /></div>
                          <button style={{ ...remB, alignSelf: "flex-end" }} onClick={() => setSide(si, di, { coatings: side.coatings.filter((_, i) => i !== ci) })}>✕</button>
                        </div>
                      ))}
                      <button style={addB} onClick={() => setSide(si, di, { coatings: [...side.coatings, bCoat()] })}>+ Add coating</button>
                    </div>
                  )}
                </div>
              ))}
              <button style={{ ...addB, marginTop: 6 }} onClick={() => setSub(si, { sides: [...sub.sides, bSide(sub.sides.length + 1)] })}>+ Add side</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── MAIN RENDER ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "16px 24px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: T.ink }}>Upload RFQ Spec</h1>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Upload a Mtivity or portal PDF — full 11-section field mapping with RAG status indicators.</p>
      </div>

      {/* ── UPLOAD ── */}
      {status === "idle" && (
        <>
          <div onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById("pdf-upload")?.click()}
            style={{ background: dragOver ? T.blueBg : "#fff", border: `2px dashed ${dragOver ? T.forest : T.line}`, borderRadius: 12, padding: "28px 32px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <input id="pdf-upload" type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{file ? file.name : "Drop a spec PDF or click to browse"}</div>
            <div style={{ fontSize: 13, color: T.muted }}>{file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : "Mtivity · HH Global · Custodian · Konica"}</div>
          </div>
          {error && <div style={{ padding: "10px 16px", background: T.redBg, border: "1px solid #fca5a5", borderRadius: 8, color: T.red, fontSize: 14, marginBottom: 12 }}>{error}</div>}
          {file && <button onClick={parseSpec} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: T.forest, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Extract quote fields →</button>}
        </>
      )}

      {/* ── LOADING ── */}
      {status === "loading" && (
        <div style={{ ...card(), padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Extracting spec…</div>
          <div style={{ fontSize: 13, color: T.muted }}>Applying Mtivity field mapping, print rules, and RAG status</div>
        </div>
      )}

      {/* ── CANNOT QUOTE ── */}
      {status === "cannot_quote" && spec && (
        <div style={{ ...card(), border: `1.5px solid #fca5a5`, padding: "24px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.red, marginBottom: 8 }}>⛔ Cannot quote this spec</div>
          <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, marginBottom: 16 }}>{spec.cannot_quote_reason ?? "Not a print RFQ."}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, fontSize: 12 }}>
            {[["Spec ref", spec.job_reference],["Created by", spec.created_by],["Category", spec.mtivity_product_type ?? spec.category_of_work],["Date", spec.created_date]].map(([l, v]) => (
              <div key={l as string} style={{ background: "#F9FAFB", borderRadius: 7, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{l}</div>
                <div style={{ fontWeight: 600, color: T.ink }}>{v ?? "—"}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); }} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: T.muted }}>← Upload different spec</button>
            <button onClick={() => navigator.clipboard.writeText(`Hi,\n\nWe received spec ${spec.job_reference ?? ""} but it appears to be freight/logistics-only. Could you clarify whether this accompanies a print order?\n\nThanks,\nAzure Communications`)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: T.ink }}>Copy clarification email</button>
          </div>
        </div>
      )}

      {/* ── MAIN REVIEW ── */}
      {(status === "done" || status === "approved") && spec && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* ── LEFT ── */}
          <div>
            {/* Format + creator row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: isMtivity ? T.blueBg : "#F3F4F6", color: isMtivity ? T.blue : T.muted, border: `1px solid ${isMtivity ? "#B5D4F4" : T.line}` }}>
                {isMtivity ? "✓ Mtivity structured parser" : "General spec parser"}
              </span>
              {spec.created_by && <span style={{ fontSize: 12, color: T.muted }}>by {spec.created_by}{spec.created_date ? " · " + spec.created_date : ""}</span>}
              {clarifSent && <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>✓ Clarification sent</span>}
              {missingNow.length > 0 && !clarifPanel && (
                <button onClick={() => { setClarifDraft(draftClarificationEmail(spec, missingNow)); setClarifPanel(true); }} style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.amberBg, color: T.amberTx, border: "1px solid #fcd34d", cursor: "pointer" }}>
                  ⚠ {missingNow.length} field{missingNow.length > 1 ? "s" : ""} missing — send clarification
                </button>
              )}
            </div>

            {/* RAG Legend */}
            <Legend />

            {/* Substrate conflict */}
            {hasConflict && (
              <div style={{ background: T.redBg, border: `1.5px solid #fca5a5`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 4 }}>⛔ Substrate conflict — manual selection required</div>
                <div style={{ fontSize: 13, color: T.red, lineHeight: 1.6 }}>{spec.substrate_conflict_detail}</div>
              </div>
            )}

            {/* Clarification panel */}
            {clarifPanel && clarifDraft && (
              <div style={{ ...card(), border: `1.5px solid #fcd34d` }}>
                <div style={{ ...sHdr({ background: "#854F0B" }) }}>
                  <span style={sLbl}>📧 Clarification email — {missingNow.length} field{missingNow.length > 1 ? "s" : ""} missing</span>
                  <button style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 12 }} onClick={() => setClarifPanel(false)}>✕</button>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {missingNow.map(f => <span key={f.key} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: T.amberBg, color: T.amberTx, border: "1px solid #fcd34d" }}>{f.label}</span>)}
                  </div>
                  <div style={{ marginBottom: 10 }}><Lbl>Subject</Lbl><input value={clarifDraft.subject} style={inpStyle()} onChange={e => setClarifDraft(d => d ? { ...d, subject: e.target.value } : d)} /></div>
                  <div style={{ marginBottom: 12 }}><Lbl>Body</Lbl><textarea value={clarifDraft.body} rows={9} style={{ ...inpStyle(), resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }} onChange={e => setClarifDraft(d => d ? { ...d, body: e.target.value } : d)} /></div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input value={clarifEmail} placeholder="Send to: requester@portal.com (optional)" style={{ ...inpStyle(), flex: 1, minWidth: 200 }} onChange={e => setClarifEmail(e.target.value)} />
                    <button style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#854F0B", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} onClick={sendClarification} disabled={clarifSending}>
                      {clarifSending ? "Sending…" : clarifEmail ? "Send email" : "Copy to clipboard"}
                    </button>
                    {!clarifEmail && <button style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.line}`, background: "#fff", fontSize: 13, cursor: "pointer", color: T.ink }} onClick={() => navigator.clipboard.writeText(clarifDraft?.body ?? "")}>Copy body</button>}
                  </div>
                </div>
              </div>
            )}

            {/* Confidence flags */}
            {flags.length > 0 && (
              <div style={{ background: T.amberBg, border: `1px solid #fcd34d`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.amber, marginBottom: 6 }}>⚠ Review before approving</div>
                {flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: T.amber, paddingLeft: 10 }}>· {f}</div>)}
              </div>
            )}

            {/* PrintLogic match */}
            <div style={{ ...card(), padding: "14px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.forest, marginBottom: 10 }}>🎯 PrintLogic Auto-Match</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  ["Stock",    hasConflict ? "⛔ Conflict — select manually" : plMat ? plMat.printlogic + (plMat.confirmed ? "" : " ⚠") : "No match"],
                  ["Delivery", delivRule ? `${delivRule.courier} (${delivRule.price})` : "—"],
                  ["Job type", spec.product_type ? `✓ ${spec.product_type}` : spec.mtivity_product_type ? `⚠ ${spec.mtivity_product_type} (unmapped)` : "—"],
                ].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div><div style={{ fontSize: 13, color: T.ink }}>{v}</div></div>
                ))}
              </div>
            </div>

            {/* ─── SECTION 1: JOB HEADER ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>1 — Job Header</span></div>
              <div style={fWrap}>
                <F k="job_reference"  label="Quote / Job reference" ph="e.g. 741086" />
                <F k="customer_name"  label="Client name"           ph="Customer name" />
                <F k="created_by"     label="Created by"            ph="e.g. Bryan Nicholas CPT" />
                <F k="created_date"   label="Created on"            ph="22 May 2026" />
                <F k="unit_of_measure" label="Unit of measure"      opts={["Each","Sets","Sheets"]} />
                <F k="life_expectancy" label="Life expectancy"       opts={["Temporary","Permanent"]} />
                <F k="description"    label="Description / notes"   ph="Key details from spec" wide />
              </div>
            </div>

            {/* ─── SECTION 2: PRODUCT CLASSIFICATION ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>2 — Product Classification</span></div>
              <div style={fWrap}>
                <F k="category_of_work" label="Category of work" opts={["Print","Freight","Custom Goods & Services"]} />
                {!isNonPrint && <>
                  <F k="product_type" label="Product type (PrintLogic)" opts={["Leaflets","Brochure Body","Brochure Cover","Business Cards","Cards / Postcards","Large Format Posters","Mailing","Booklets","Letterheads","Comp Slips","Pads","Self Mailer","4 Page Leaflet","Menu","No Print"]} />
                  {spec.mtivity_product_type && !spec.product_type && (
                    <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: T.amberBg, borderRadius: 7, fontSize: 12, color: T.amberTx }}>
                      ⚠ &quot;{spec.mtivity_product_type}&quot; has no PrintLogic mapping — select above
                    </div>
                  )}
                  <F k="finished_product_style" label="Finished style" opts={["Flat","Folded","Bound"]} />
                </>}
              </div>
            </div>

            {/* ─── SECTION 3: DIMENSIONS ─── */}
            {!isNonPrint && (
              <div style={card()}>
                <div style={sHdr()}><span style={sLbl}>3 — Dimensions</span></div>
                <div style={fWrap}>
                  <NumField k="flat_size_length"     label="Flat length (mm)"     ph="e.g. 297" />
                  <NumField k="flat_size_width"      label="Flat width (mm)"       ph="e.g. 420" />
                  {(spec.finished_product_style === "Folded" || spec.finished_product_style === "Bound") && <>
                    <NumField k="finished_size_length" label="Finished length (mm)" ph="e.g. 297" />
                    <NumField k="finished_size_width"  label="Finished width (mm)"  ph="e.g. 210" />
                  </>}
                  <NumField k="pages" label="Total page count" ph="e.g. 4" />
                </div>
              </div>
            )}

            {/* ─── SECTIONS 4+5: SUBSTRATE & INK ─── */}
            {!isNonPrint && <SubstratesSection />}

            {/* ─── SECTION 5 CONTINUED: INK & ARTWORK top-level fields ─── */}
            {!isNonPrint && (
              <div style={card()}>
                <div style={sHdr()}><span style={sLbl}>5 — Ink & Artwork</span></div>
                <div style={fWrap}>
                  <F k="sides_printed"    label="Number of sides printed" opts={["1","2"]} />
                  <F k="ink_spec"         label="Ink spec"                opts={["Same both sides","Different each side"]} />
                  <F k="artwork_variation" label="Art"                    opts={["Same Art","Different Art"]} />
                  <F k="artwork_status"   label="Artwork status"          opts={["New","Repeat","Customer Supplied"]} />
                  <Bool k="lighting_required"   label="Lighting required" />
                  <Bool k="electronics_required" label="Electronics required" />
                </div>
              </div>
            )}

            {/* ─── SECTION 6: COATINGS & FINISHING ─── */}
            {!isNonPrint && (
              <div style={card()}>
                <div style={sHdr()}><span style={sLbl}>6 — Coatings & Finishing</span></div>
                <div style={fWrap}>
                  <Bool k="finishing_required" label="Additional finishing required" />
                </div>
                {spec.finishing_required && (
                  <div style={{ padding: "0 18px 14px" }}>
                    {scoringOn && <div style={{ padding: "8px 12px", background: T.greenBg, border: "1px solid #86efac", borderRadius: 7, fontSize: 13, color: T.green, marginBottom: 10 }}>✓ Scoring auto-applied — {gsm}gsm (Aaron&apos;s 170gsm+ rule)</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Finishing items</div>
                    {(spec.finishing_items ?? []).map((f, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
                        <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Type</label>
                          <select value={f.finishing_type} style={inpStyle(f.finishing_type ? "green" : "red")} onChange={e => setFin(i, { finishing_type: e.target.value })}>
                            <option value="">— Select —</option>
                            {["Scoring","Folding","Guillotining","Saddle Stitch","Perfect Bound","Gloss Laminate","Matt Laminate","Soft Touch Laminate","Spot UV","Die Cut","Perforation","Tabbing","Shrink Wrap","Large Format Cutting"].map(o => <option key={o}>{o}</option>)}
                          </select></div>
                        <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Area</label>
                          <select value={f.finishing_area} style={inpStyle("green")} onChange={e => setFin(i, { finishing_area: e.target.value })}>{["Overall","Spot"].map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label style={{ ...sLbl, color: T.muted, marginBottom: 4, display: "block" }}>Comments</label><input value={f.comments} placeholder="e.g. Gloss lam both sides" style={inpStyle(f.comments ? "amber" : "empty")} onChange={e => setFin(i, { comments: e.target.value })} /></div>
                        <button style={{ ...remB, alignSelf: "flex-end" }} onClick={() => setSpec(p => p ? { ...p, finishing_items: (p.finishing_items ?? []).filter((_, j) => j !== i) } : p)}>✕</button>
                      </div>
                    ))}
                    <button style={addB} onClick={() => setSpec(p => p ? { ...p, finishing_items: [...(p.finishing_items ?? []), bFin()] } : p)}>+ Add finishing item</button>
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 7: FOLDING & BINDING ─── */}
            {!isNonPrint && (
              <div style={card()}>
                <div style={sHdr()}><span style={sLbl}>7 — Folding & Binding</span></div>
                <div style={fWrap}>
                  <Bool k="trim_to_size"   label="Trim to size" />
                  <F k="folded_or_bound"   label="Folded or bound" opts={["No","Folded","Bound"]} />
                  {spec.folded_or_bound === "Folded" && <F k="fold_type" label="Fold type" opts={["Single Fold","Z-Fold","Roll Fold","Gatefold","Concertina","French Fold","4pp","6pp","8pp","Complex Fold"]} />}
                  {spec.folded_or_bound === "Bound"  && <>
                    <F k="binding_type"     label="Binding type" opts={["Saddle Stitch","Perfect Bound","Loop Stitch","Spiral Bound","Wiro Bound"]} />
                    <F k="binding_comments" label="Binding comments" ph="e.g. min 8 pages" />
                  </>}
                </div>
              </div>
            )}

            {/* ─── SECTION 8: PROOFING ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>8 — Proofing</span></div>
              <div style={fWrap}>
                <Bool k="proof_required" label="Proof required" />
                {spec.proof_required && <F k="proof_type" label="Proof type" opts={["PDF:Colour","PDF","Hard Copy","Digital"]} />}
              </div>
            </div>

            {/* ─── SECTION 9: PACKAGING ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>9 — Packaging</span></div>
              <div style={fWrap}>
                <Bool k="bundling_required" label="Bundling required" />
                {spec.bundling_required && <>
                  <F k="bundling_type" label="Bundle type" opts={["Shrink Wrap","Banded","Boxed","Palletised"]} />
                  <NumField k="bundle_quantity" label="Bundle quantity" ph="e.g. 25" />
                </>}
                <Bool k="inner_packaging_required" label="Inner packaging required" />
                {spec.inner_packaging_required && <F k="inner_packaging_material" label="Inner material" opts={["Packaging Cardboard","Bubble Wrap","Foam","Tissue Paper"]} />}
                <Bool k="outer_packaging_required" label="Outer packaging required" />
                {spec.outer_packaging_required && <>
                  <F k="outer_packaging_material" label="Outer material" opts={["Packaging Cardboard","Pallet","Box","Shrink Wrap"]} />
                  <Bool k="max_outer_packaging_size_required" label="Specify max outer size?" />
                  {spec.max_outer_packaging_size_required && <>
                    <NumField k="max_outer_packaging_length" label="Max length (mm)" />
                    <NumField k="max_outer_packaging_width"  label="Max width (mm)" />
                    <NumField k="max_outer_packaging_height" label="Max height (mm)" />
                  </>}
                </>}
              </div>
            </div>

            {/* ─── SECTION 10: DELIVERY & LOGISTICS ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>10 — Delivery & Logistics</span></div>
              <div style={fWrap}>
                <NumField k="delivery_location_count" label="No. of delivery locations" ph="e.g. 1" />
                <F k="delivery_region" label="Delivery region" opts={["Dublin","ROI","Northern Ireland","UK","International"]} />
                <F k="delivery_instructions" label="Delivery instructions" ph="e.g. See shipping files" wide />
              </div>
              {/* DELIVERY LOCATIONS — conditional on delivery_required */}
              <div style={{ padding: "0 18px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Delivery locations</div>
                  <button style={addB} onClick={() => setSpec(p => p ? { ...p, delivery_required: true, delivery_locations: [...(p.delivery_locations ?? []), bLoc()] } : p)}>+ Add location</button>
                </div>
                {(spec.delivery_locations ?? []).map((loc, i) => (
                  <div key={i} style={gBox()}>
                    <div style={gHdr()}>
                      <span style={gTtl}>Location {i + 1}{loc.city ? ` — ${loc.city}` : ""}{loc.county ? `, ${loc.county}` : ""}</span>
                      <button style={remB} onClick={() => setSpec(p => p ? { ...p, delivery_locations: (p.delivery_locations ?? []).filter((_, j) => j !== i) } : p)}>Remove</button>
                    </div>
                    <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
                      {([["location_name","Location name","e.g. Head Office"],["address","Address","Street"],["city","City","e.g. Dublin"],["county","County","e.g. Dublin"],["eircode","Eircode","e.g. D02 XY45"],["delivery_notes","Notes",""]] as [string,string,string][]).map(([key, lb, ph]) => (
                        <div key={key}><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", color: T.muted }}>{lb}</label><input value={String((loc as never)[key] ?? "")} placeholder={ph} style={inpStyle()} onChange={e => setLoc(i, { [key]: e.target.value } as Partial<MtivityDeliveryLocation>)} /></div>
                      ))}
                      <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", color: T.muted }}>Qty to here</label><input type="number" value={loc.quantity ?? ""} style={inpStyle()} onChange={e => setLoc(i, { quantity: Number(e.target.value) || null })} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── SECTION 11: QUANTITY & VERSIONS ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>11 — Quantity & Versions</span></div>
              <div style={fWrap}>
                <NumField k="quantity"          label="Total quantity"    ph="e.g. 1100" />
                <NumField k="number_of_versions" label="Number of versions" ph="e.g. 2" />
                {(spec.number_of_versions ?? 1) > 1 && <F k="split_per_version" label="Split per version" ph="e.g. 50/50 or 600/500" />}
                <F k="calculation_method" label="Calculation method" opts={["Quantity","Fixed Price","Rate Card"]} />
              </div>
            </div>

            {/* NOTES */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>📝 Special Notes</span></div>
              <div style={fWrap}><F k="special_notes" label="Special notes" ph="Any other quoting-relevant info" wide /></div>
            </div>

            {/* ─── PRICING PANEL ─── */}
            {(() => {
              const delivRule = getDeliveryRule(spec, admin);
              const breakdown = priceMode === "estimate"
                ? estimatePrice(spec, delivRule?.courier ?? null, admin.defaultMarkup - 100)
                : null;
              return (
                <div style={card()}>
                  <div style={sHdr()}>
                    <span style={sLbl}>💰 Pricing</span>
                    <button onClick={() => setShowPricing(p => !p)}
                      style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>
                      {showPricing ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showPricing && (
                    <div style={{ padding: "14px 18px" }}>
                      {/* Mode toggles */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, alignSelf: "center", marginRight: 4 }}>Price via:</div>
                        {(["estimate","printlogic","manual"] as const).map(mode => (
                          <button key={mode} onClick={() => setPriceMode(mode)} style={{
                            padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${priceMode === mode ? T.forest : T.line}`,
                            background: priceMode === mode ? T.forest : "#fff",
                            color: priceMode === mode ? T.lime : T.muted,
                          }}>
                            {mode === "estimate" ? "📊 Estimate" : mode === "printlogic" ? "🖨 PrintLogic" : "✏️ Manual"}
                          </button>
                        ))}
                      </div>

                      {/* Estimate mode */}
                      {priceMode === "estimate" && breakdown && (
                        <div>
                          <div style={{ background: "#F9FAFB", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                            {[
                              ["Stock cost",   formatEur(breakdown.stock_cost),    breakdown.stock_cost === null],
                              ["Print cost",   formatEur(breakdown.print_cost),    false],
                              ["Finishing",    formatEur(breakdown.finishing_cost), false],
                              ["Delivery",     formatEur(breakdown.delivery_cost),  false],
                              ["Subtotal",     formatEur(breakdown.subtotal_ex_vat), false],
                              [`Markup (${breakdown.markup_pct}%)`, formatEur(breakdown.subtotal_ex_vat !== null ? breakdown.subtotal_ex_vat * breakdown.markup_pct / 100 : null), false],
                            ].map(([l, v, warn]) => (
                              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: `1px solid ${T.line}`, fontSize: 13 }}>
                                <span style={{ color: T.muted }}>{l}</span>
                                <span style={{ fontWeight: 600, color: warn ? T.amber : T.ink }}>{v}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: T.forest, fontSize: 14, fontWeight: 700 }}>
                              <span style={{ color: "#fff" }}>Quoted price (ex VAT)</span>
                              <span style={{ color: T.lime }}>{formatEur(breakdown.quoted_price)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", fontSize: 12 }}>
                              <span style={{ color: T.muted }}>VAT (23%)</span>
                              <span style={{ color: T.ink }}>{formatEur(breakdown.vat_amount)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", fontSize: 13, fontWeight: 700 }}>
                              <span style={{ color: T.ink }}>Total inc. VAT</span>
                              <span style={{ color: T.ink }}>{formatEur(breakdown.total_inc_vat)}</span>
                            </div>
                          </div>
                          {breakdown.notes.length > 0 && (
                            <div style={{ padding: "8px 12px", background: T.amberBg, border: `1px solid #fcd34d`, borderRadius: 7, fontSize: 12, color: T.amberTx }}>
                              {breakdown.notes.map((n, i) => <div key={i}>⚠ {n}</div>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PrintLogic mode */}
                      {priceMode === "printlogic" && (
                        <div style={{ padding: "12px 14px", background: "#F9FAFB", borderRadius: 8, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 600, color: T.ink, marginBottom: 6 }}>Send to PrintLogic to calculate</div>
                          Using the Item Details in the right panel, populate PrintLogic and click Calculate Quote. Once calculated, enter the PrintLogic price below to save it against this quote.
                          <div style={{ marginTop: 10 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>PrintLogic quoted price (ex VAT €)</label>
                            <input type="number" value={manualPrice} placeholder="e.g. 485.00" style={inpStyle()}
                              onChange={e => setManualPrice(e.target.value)} />
                            <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>Enter the price from PrintLogic — saves against the quote when you click Save draft</div>
                          </div>
                        </div>
                      )}

                      {/* Manual mode */}
                      {priceMode === "manual" && (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Manual price (ex VAT €)</label>
                          <input type="number" value={manualPrice} placeholder="e.g. 485.00" style={inpStyle()}
                            onChange={e => setManualPrice(e.target.value)} />
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>Override the calculated price — use for outwork quotes or agreed rates</div>
                          {manualPrice && (
                            <div style={{ marginTop: 10, padding: "10px 12px", background: T.forest, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Quoted price</span>
                              <span style={{ color: T.lime, fontWeight: 700, fontSize: 16 }}>{formatEur(Number(manualPrice))}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── QUOTE DATES ─── */}
            <div style={card()}>
              <div style={sHdr()}><span style={sLbl}>📅 Quote Dates</span></div>
              <div style={fWrap}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: T.muted }}>Quote Submitted</label>
                  <input type="date" value={dateSubmitted} style={inpStyle()} onChange={e => setDateSubmitted(e.target.value)} />
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>When customer sent the RFQ</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: T.muted }}>Quote Issued</label>
                  <input type="date" value={dateIssued} style={inpStyle()} onChange={e => setDateIssued(e.target.value)} />
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>When Azure sent the quote</div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); setIsMtivity(false); setClarifPanel(false); setClarifSent(false); setSavedQuoteId(null); onClearQuote?.(); }} style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: "#fff", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← New spec</button>
              <button onClick={saveDraft} style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${T.forest}`, background: draftSaved ? T.forest : "#fff", color: draftSaved ? T.lime : T.forest, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                {draftSaved ? "✓ Saved" : savedQuoteId ? "↑ Update draft" : "💾 Save draft"}
              </button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(spec, null, 2))} style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: "#fff", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Export JSON</button>
              {status === "done" && !hasConflict && missingNow.length === 0 && (
                <button onClick={() => { setStatus("approved"); saveDraft(); }} style={{ flex: 1, minWidth: 180, padding: "11px 18px", borderRadius: 10, border: "none", background: T.forest, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓ Approve — Ready for PrintLogic</button>
              )}
              {status === "done" && !hasConflict && missingNow.length > 0 && (
                <div style={{ flex: 1, padding: "11px 18px", borderRadius: 10, background: T.amberBg, border: `1px solid #fcd34d`, fontSize: 13, color: T.amberTx, display: "flex", alignItems: "center", gap: 10 }}>
                  ⚠ {missingNow.length} field{missingNow.length > 1 ? "s" : ""} missing
                  <button onClick={() => { setClarifDraft(draftClarificationEmail(spec, missingNow)); setClarifPanel(true); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #fcd34d", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.amberTx }}>Send clarification</button>
                </div>
              )}
              {status === "done" && hasConflict && (
                <div style={{ flex: 1, padding: "11px 18px", borderRadius: 10, background: T.redBg, border: `1px solid #fca5a5`, fontSize: 13, color: T.red, display: "flex", alignItems: "center" }}>⛔ Resolve substrate conflict before approving</div>
              )}
            </div>

            {status === "approved" && (
              <div style={{ ...card(), border: `1.5px solid #86efac`, padding: "20px", marginTop: 14 }}>
                <div style={{ fontWeight: 700, color: T.forest, marginBottom: 12, fontSize: 15 }}>✅ Approved — PrintLogic Checklist</div>
                {[
                  `Customer: ${spec.customer_name ?? "[check email]"}`,
                  `Job type: ${spec.product_type ?? "[confirm]"} · Qty: ${spec.quantity ?? "[confirm]"}${(spec.number_of_versions ?? 1) > 1 ? ` (${spec.number_of_versions} versions — ${spec.split_per_version ?? "split TBC"})` : ""}`,
                  `Size: ${spec.finished_size_length && spec.finished_size_width ? `${spec.finished_size_length}×${spec.finished_size_width}mm` : spec.flat_size_length ? `${spec.flat_size_length}×${spec.flat_size_width}mm flat` : "[confirm]"}`,
                  `Stock: ${plMat?.printlogic ?? "[Aaron to select]"}`,
                  `Sides: ${spec.sides_printed ?? "[confirm]"} · ${scoringOn ? "✓ Scoring auto-applied" : "Check finishing"}`,
                  `Delivery: ${delivRule ? `${delivRule.courier} (${delivRule.price})` : "[confirm]"} · Region: ${spec.delivery_region ?? "[confirm]"}`,
                  `Paste Item Details (right panel) → Calculate → Review margin → Send`,
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < 6 ? `1px solid ${T.line}` : "none", fontSize: 13 }}>
                    <span style={{ color: T.forest, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT — sticky preview ── */}
          <div style={{ position: "sticky", top: 20 }}>
            {/* Item Details */}
            <div style={{ background: "#0a1a10", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ background: T.forest, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.lime, textTransform: "uppercase", letterSpacing: "0.08em" }}>🖨 PrintLogic Item Details</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Live · Aaron&apos;s format</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(itemDets); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "16px", fontFamily: "monospace", fontSize: 12, color: "#a8e6b4", lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {itemDets || "— Complete fields to generate —"}
              </pre>
            </div>

            {/* RAG Summary */}
            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.forest, marginBottom: 10 }}>Field status summary</div>
              {(() => {
                const fm = spec.field_status ?? {};
                const counts = { green: 0, amber: 0, red: 0, empty: 0 };
                Object.values(fm).forEach(v => { if (v in counts) counts[v as keyof typeof counts]++; });
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {(["green","amber","red","empty"] as const).filter(s => s !== "empty").map(s => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: RAG[s].bg, border: `1px solid ${RAG[s].border}` }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: RAG[s].dot, display: "inline-block", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: s === "green" ? T.green : s === "amber" ? T.amber : T.red }}>{RAG[s].label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{counts[s]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ fontSize: 12, fontWeight: 700, color: T.forest, marginBottom: 8 }}>Quick summary</div>
              {[
                ["Spec ref",   spec.job_reference],
                ["Customer",   spec.customer_name],
                ["Job type",   spec.product_type ?? (spec.mtivity_product_type ? "⚠ " + spec.mtivity_product_type : null)],
                ["Qty",        spec.quantity ? `${spec.quantity}${(spec.number_of_versions ?? 1) > 1 ? ` (${spec.number_of_versions} ver)` : ""}` : null],
                ["Size",       spec.finished_size_length && spec.finished_size_width ? `${spec.finished_size_length}×${spec.finished_size_width}mm` : null],
                ["Pages",      spec.pages ? `${spec.pages}pp` : null],
                ["Stock",      (gsm && spec.substrate_type) ? `${gsm}gsm ${spec.substrate_type}` : null],
                ["Sides",      spec.sides_printed ? `${spec.sides_printed} side${Number(spec.sides_printed) > 1 ? "s" : ""}` : null],
                ["Finishing",  spec.finishing_items?.map(f => f.finishing_type).filter(Boolean).join(", ") || null],
                ["Bundling",   spec.bundling_required ? `${spec.bundling_type ?? ""} ${spec.bundle_quantity ? "×" + spec.bundle_quantity : ""}`.trim() : null],
                ["Region",     spec.delivery_region],
                ["Delivery",   delivRule ? `${delivRule.courier} (${delivRule.price})` : null],
                ["Missing",    missingNow.length > 0 ? `⚠ ${missingNow.length} field${missingNow.length > 1 ? "s" : ""}` : null],
              ].map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.line}`, fontSize: 12 }}>
                  <span style={{ color: T.muted, fontWeight: 500 }}>{l}</span>
                  <span style={{ color: v ? (String(l) === "Missing" ? T.amber : T.ink) : "rgba(0,0,0,0.15)", fontWeight: v ? 600 : 400, textAlign: "right", maxWidth: "58%" }}>{v ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
