"use client";
import { useState, useCallback } from "react";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import {
  buildPrompt, buildMtivityPrompt, callExtractAPI,
  lookupMaterial, getJobDefaults, getDeliveryRule,
  generateItemDetails, validateExtractedSpec,
} from "@/lib/extract";
import type {
  ExtractedSpec, MtivitySubstrate, MtivitySide, MtivityCoating,
  MtivityFinishingItem, MtivityDeliveryLocation,
} from "@/lib/types";

// ── STYLE HELPERS ─────────────────────────────────────────────────────────
const forest  = "var(--az-forest, #1a3a2e)";
const lime    = "var(--az-lime, #c8e63c)";
const ink     = "var(--az-ink, #111827)";
const muted   = "var(--az-muted, #6B7280)";
const line    = "var(--az-line, #E5E7EB)";
const amber   = "#ED7D31";
const amberBg = "#FDF3E8";
const red     = "#C0392B";
const redBg   = "#FDECEA";
const greenBg = "#E9F5F0";
const greenTx = "#2D6A4F";
const blueBg  = "#E8F4FA";
const blueTx  = "#185FA5";

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", borderRadius: 12, border: `1px solid ${line}`,
  padding: "16px 20px", marginBottom: 14, ...extra,
});
const sectionHead = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: forest, padding: "10px 18px", display: "flex", alignItems: "center",
  gap: 8, borderRadius: "10px 10px 0 0", ...extra,
});
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#fff",
  textTransform: "uppercase", letterSpacing: "0.08em",
};
const fieldWrap: React.CSSProperties = {
  padding: "14px 18px",
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: 12,
};
const label = (flagged?: boolean): React.CSSProperties => ({
  fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: flagged ? amber : muted,
});
const inp = (flagged?: boolean): React.CSSProperties => ({
  width: "100%", padding: "8px 11px", borderRadius: 7, fontSize: 13,
  border: `1.5px solid ${flagged ? "#fcd34d" : line}`,
  background: flagged ? amberBg : "#fff", color: ink, boxSizing: "border-box",
});
const toggle = (on: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  border: `1.5px solid ${on ? forest : line}`,
  background: on ? forest : "#fff", color: on ? lime : muted,
});
const addBtn: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 6, border: `1.5px solid ${line}`,
  background: "#fff", fontSize: 12, fontWeight: 600, color: muted, cursor: "pointer",
};
const removeBtn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 5, border: `1px solid #fca5a5`,
  background: redBg, fontSize: 11, color: red, cursor: "pointer",
};
const groupBox = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: `1px solid ${line}`, borderRadius: 10, overflow: "hidden", marginBottom: 10, ...extra,
});
const groupHead = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "#F9FAFB", padding: "8px 14px", display: "flex",
  justifyContent: "space-between", alignItems: "center",
  borderBottom: `1px solid ${line}`, ...extra,
});
const groupTitle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: ink };
const innerPad: React.CSSProperties = { padding: "12px 14px" };

// blank factories
const blankCoating  = (): MtivityCoating        => ({ coating_type: "", coating_area: "Overall", comments: "" });
const blankSide     = (n: number): MtivitySide   => ({ side_number: n, four_colour_process: true, spot_colours_required: false, number_of_spot_colours: null, coating_required: false, number_of_coatings: null, coatings: [], side_comments: "" });
const blankSub      = (): MtivitySubstrate       => ({ used_as: "", substrate_type: "Paper", substrate_name: "", sustainability_accreditation: "", measured_by: "Weight", weight: null, weight_unit: "gsm", thickness: null, thickness_unit: "", section_page_count: null, substrate_comments: "", ink_coverage: "", artwork_variation: "", sides: [blankSide(1), blankSide(2)] });
const blankFinish   = (): MtivityFinishingItem   => ({ finishing_type: "", finishing_area: "Overall", comments: "" });
const blankLocation = (): MtivityDeliveryLocation => ({ location_name: "", address: "", city: "", county: "", country: "Ireland", eircode: "", quantity: null, delivery_notes: "" });

export default function UploadQuoteView() {
  const [file, setFile]           = useState<File | null>(null);
  const [status, setStatus]       = useState<"idle"|"loading"|"done"|"approved"|"cannot_quote">("idle");
  const [spec, setSpec]           = useState<Partial<ExtractedSpec> | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [isMtivity, setIsMtivity] = useState(false);

  const admin     = DEFAULT_ADMIN;
  const apiConfig = DEFAULT_API_CONFIG;

  // ── Spec field updater ─────────────────────────────────────────────────
  const set = <K extends keyof ExtractedSpec>(key: K, val: ExtractedSpec[K]) =>
    setSpec(prev => prev ? { ...prev, [key]: val } : prev);

  // ── Substrate updater ──────────────────────────────────────────────────
  const setSub = (si: number, patch: Partial<MtivitySubstrate>) =>
    setSpec(prev => {
      if (!prev) return prev;
      const subs = [...(prev.substrates ?? [])];
      subs[si] = { ...subs[si], ...patch };
      return { ...prev, substrates: subs };
    });

  const setSide = (si: number, di: number, patch: Partial<MtivitySide>) =>
    setSpec(prev => {
      if (!prev) return prev;
      const subs = [...(prev.substrates ?? [])];
      const sides = [...(subs[si]?.sides ?? [])];
      sides[di] = { ...sides[di], ...patch };
      subs[si] = { ...subs[si], sides };
      return { ...prev, substrates: subs };
    });

  const setCoating = (si: number, di: number, ci: number, patch: Partial<MtivityCoating>) =>
    setSpec(prev => {
      if (!prev) return prev;
      const subs = [...(prev.substrates ?? [])];
      const sides = [...(subs[si]?.sides ?? [])];
      const coatings = [...(sides[di]?.coatings ?? [])];
      coatings[ci] = { ...coatings[ci], ...patch };
      sides[di] = { ...sides[di], coatings };
      subs[si] = { ...subs[si], sides };
      return { ...prev, substrates: subs };
    });

  const setFinish = (i: number, patch: Partial<MtivityFinishingItem>) =>
    setSpec(prev => {
      if (!prev) return prev;
      const items = [...(prev.finishing_items ?? [])];
      items[i] = { ...items[i], ...patch };
      return { ...prev, finishing_items: items };
    });

  const setLoc = (i: number, patch: Partial<MtivityDeliveryLocation>) =>
    setSpec(prev => {
      if (!prev) return prev;
      const locs = [...(prev.delivery_locations ?? [])];
      locs[i] = { ...locs[i], ...patch };
      return { ...prev, delivery_locations: locs };
    });

  // ── File handling ──────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setSpec(null); setError(null); setStatus("idle"); setIsMtivity(false);
  }, []);

  // ── Parse ──────────────────────────────────────────────────────────────
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
      const cfg    = apiConfig[apiConfig.provider as keyof typeof apiConfig] as { model: string; apiKey: string };
      // Mtivity hint: use Mtivity prompt for portal-named files, fall back to generic
      const hint   = file.name.toLowerCase().includes("spec") || file.name.toLowerCase().includes("mtivity");
      const prompt = hint ? buildMtivityPrompt(admin) : buildPrompt(admin);
      const text   = await callExtractAPI(base64, "application/pdf", apiConfig.provider, cfg.model, prompt, cfg.apiKey || "");
      if (!text) throw new Error("No response from API — check ANTHROPIC_API_KEY in Vercel env vars.");
      const parsed: ExtractedSpec = JSON.parse(text.replace(/```json|```/g, "").trim());

      setIsMtivity(parsed.source_format === "mtivity");
      if (parsed.cannot_quote) { setSpec(parsed); setStatus("cannot_quote"); return; }

      // Sync convenience flat fields from substrates[0]
      const s0 = parsed.substrates?.[0];
      if (s0) {
        parsed.substrate_type       = parsed.substrate_type       ?? s0.substrate_name;
        parsed.substrate_weight_gsm = parsed.substrate_weight_gsm ?? s0.weight;
        parsed.sustainability       = parsed.sustainability        ?? s0.sustainability_accreditation;
        parsed.sides_printed        = parsed.sides_printed         ?? (s0.sides?.length >= 2 ? "Double sided" : "Single sided");
      }

      const validated = validateExtractedSpec(parsed) as ExtractedSpec;
      setSpec(validated);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed — check API key.");
      setStatus("idle");
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const flags        = spec?.confidence_flags ?? [];
  const isFlagged    = (k: string) => flags.some(f => f.toLowerCase().includes(k.replace(/_/g, "")));
  const plMaterial   = lookupMaterial(spec, admin);
  const jobDefaults  = getJobDefaults(spec, admin);
  const deliveryRule = getDeliveryRule(spec, admin);
  const itemDetails  = generateItemDetails(spec);
  const hasConflict  = !!spec?.substrate_conflict;
  const scoringOn    = !!spec?.scoring_auto_applied;
  const gsm          = spec?.substrate_weight_gsm ?? spec?.substrates?.[0]?.weight ?? 0;

  // ── Render helpers ─────────────────────────────────────────────────────
  const Field = ({ k, label: lbl, placeholder, options, wide }: {
    k: keyof ExtractedSpec; label: string; placeholder?: string;
    options?: string[]; wide?: boolean;
  }) => {
    const flagged = isFlagged(String(k));
    const val = spec?.[k];
    const strVal = val === null || val === undefined ? "" : String(val);
    const style: React.CSSProperties = wide ? { ...fieldWrap, gridColumn: "1/-1" } : {};
    return (
      <div style={style}>
        <label style={label(flagged)}>{lbl} {flagged && "⚠"}</label>
        {options ? (
          <select value={strVal} onChange={e => set(k, e.target.value as never)} style={inp(flagged)}>
            {!strVal && <option value="">— Select —</option>}
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input value={strVal} placeholder={placeholder ?? "—"} style={inp(flagged)}
            onChange={e => set(k, e.target.value as never)} />
        )}
      </div>
    );
  };

  const BoolField = ({ k, label: lbl }: { k: keyof ExtractedSpec; label: string }) => (
    <div>
      <label style={label()}>{lbl}</label>
      <button style={toggle(!!spec?.[k])} onClick={() => set(k, !spec?.[k] as never)}>
        {spec?.[k] ? "Yes" : "No"}
      </button>
    </div>
  );

  // ── SUBSTRATES repeatable group ────────────────────────────────────────
  const SubstratesSection = () => {
    const subs = spec?.substrates ?? [];
    return (
      <div style={card()}>
        <div style={sectionHead()}>
          <span style={sectionLabel}>🗂 Substrates</span>
          <button style={{ ...addBtn, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", marginLeft: "auto" }}
            onClick={() => setSpec(prev => prev ? { ...prev, substrates: [...(prev.substrates ?? []), blankSub()] } : prev)}>
            + Add substrate
          </button>
        </div>
        {subs.map((sub, si) => (
          <div key={si} style={{ borderBottom: si < subs.length - 1 ? `1px solid ${line}` : "none" }}>
            {/* Substrate header */}
            <div style={groupHead({ borderRadius: 0, background: "#F3F4F6" })}>
              <span style={groupTitle}>Substrate {si + 1}{sub.substrate_name ? ` — ${sub.substrate_name}` : ""}</span>
              {subs.length > 1 && (
                <button style={removeBtn}
                  onClick={() => setSpec(prev => prev ? { ...prev, substrates: (prev.substrates ?? []).filter((_, i) => i !== si) } : prev)}>
                  Remove
                </button>
              )}
            </div>
            <div style={innerPad}>
              {/* Substrate fields */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px,1fr))", gap: 10, marginBottom: 12 }}>
                {[
                  ["used_as",                    "Used as",              "e.g. brochure"],
                  ["substrate_type",             "Substrate type",       "e.g. Paper"],
                  ["substrate_name",             "Substrate name",       "e.g. Silk Coated"],
                  ["sustainability_accreditation","Sustainability",       "e.g. FSC Mix"],
                  ["weight",                     "Weight (gsm)",         "e.g. 170"],
                  ["section_page_count",         "Section page count",   "e.g. 4"],
                  ["ink_coverage",               "Ink coverage",         ""],
                  ["artwork_variation",          "Artwork variation",    "e.g. Different Art"],
                  ["substrate_comments",         "Substrate comments",   ""],
                ].map(([key, lbl, ph]) => (
                  <div key={key}>
                    <label style={label()}>{lbl}</label>
                    <input value={String((sub as never)[key] ?? "")} placeholder={ph}
                      style={inp()} onChange={e => setSub(si, { [key]: e.target.value } as Partial<MtivitySubstrate>)} />
                  </div>
                ))}
              </div>

              {/* SIDES repeatable group */}
              {sub.sides.map((side, di) => (
                <div key={di} style={{ ...groupBox(), marginTop: 8 }}>
                  <div style={groupHead()}>
                    <span style={groupTitle}>Side {side.side_number}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {sub.sides.length > 1 && (
                        <button style={removeBtn}
                          onClick={() => setSub(si, { sides: sub.sides.filter((_, i) => i !== di) })}>
                          Remove side
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
                    <div>
                      <label style={label()}>4 colour process</label>
                      <button style={toggle(side.four_colour_process)}
                        onClick={() => setSide(si, di, { four_colour_process: !side.four_colour_process })}>
                        {side.four_colour_process ? "Yes" : "No"}
                      </button>
                    </div>
                    <div>
                      <label style={label()}>Spot colours</label>
                      <button style={toggle(side.spot_colours_required)}
                        onClick={() => setSide(si, di, { spot_colours_required: !side.spot_colours_required })}>
                        {side.spot_colours_required ? "Yes" : "No"}
                      </button>
                    </div>
                    {side.spot_colours_required && (
                      <div>
                        <label style={label()}>No. of spot colours</label>
                        <input type="number" value={side.number_of_spot_colours ?? ""} style={inp()}
                          onChange={e => setSide(si, di, { number_of_spot_colours: Number(e.target.value) || null })} />
                      </div>
                    )}
                    <div>
                      <label style={label()}>Coating required</label>
                      <button style={toggle(side.coating_required)}
                        onClick={() => {
                          const next = !side.coating_required;
                          setSide(si, di, { coating_required: next, coatings: next && side.coatings.length === 0 ? [blankCoating()] : side.coatings });
                        }}>
                        {side.coating_required ? "Yes" : "No"}
                      </button>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <input value={side.side_comments} placeholder="Side comments" style={inp()}
                        onChange={e => setSide(si, di, { side_comments: e.target.value })} />
                    </div>
                  </div>

                  {/* COATINGS — conditional on coating_required */}
                  {side.coating_required && (
                    <div style={{ padding: "0 14px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Coatings</div>
                      {side.coatings.map((c, ci) => (
                        <div key={ci} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
                          <div>
                            <label style={label()}>Coating type</label>
                            <select value={c.coating_type} style={inp()}
                              onChange={e => setCoating(si, di, ci, { coating_type: e.target.value })}>
                              <option value="">— Select —</option>
                              {["Matte Varnish","Gloss Varnish","Gloss Laminate","Matt Laminate","Soft Touch Laminate","UV Spot","Aqueous","Silk Varnish"].map(o => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={label()}>Area</label>
                            <select value={c.coating_area} style={inp()}
                              onChange={e => setCoating(si, di, ci, { coating_area: e.target.value })}>
                              {["Overall","Spot","Flood"].map(o => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={label()}>Comments</label>
                            <input value={c.comments} placeholder="e.g. wipeable" style={inp()}
                              onChange={e => setCoating(si, di, ci, { comments: e.target.value })} />
                          </div>
                          <button style={removeBtn}
                            onClick={() => setSide(si, di, { coatings: side.coatings.filter((_, i) => i !== ci) })}>
                            ✕
                          </button>
                        </div>
                      ))}
                      <button style={addBtn}
                        onClick={() => setSide(si, di, { coatings: [...side.coatings, blankCoating()] })}>
                        + Add coating
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button style={{ ...addBtn, marginTop: 6 }}
                onClick={() => setSub(si, { sides: [...sub.sides, blankSide(sub.sides.length + 1)] })}>
                + Add side
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── FINISHING repeatable group — conditional ───────────────────────────
  const FinishingSection = () => (
    <div style={card()}>
      <div style={sectionHead()}>
        <span style={sectionLabel}>✂️ Finishing</span>
      </div>
      <div style={fieldWrap}>
        <div>
          <label style={label()}>Finishing required</label>
          <button style={toggle(!!spec?.finishing_required)}
            onClick={() => set("finishing_required", !spec?.finishing_required)}>
            {spec?.finishing_required ? "Yes" : "No"}
          </button>
        </div>
        <div>
          <label style={label()}>Trim to size</label>
          <button style={toggle(!!spec?.trim_to_size)}
            onClick={() => set("trim_to_size", !spec?.trim_to_size)}>
            {spec?.trim_to_size ? "Yes" : "No"}
          </button>
        </div>
      </div>

      {spec?.finishing_required && (
        <div style={{ padding: "0 18px 14px" }}>
          {scoringOn && (
            <div style={{ padding: "8px 12px", background: greenBg, border: `1px solid #86efac`, borderRadius: 7, fontSize: 13, color: greenTx, marginBottom: 10 }}>
              ✓ Scoring auto-applied — {gsm}gsm stock (Aaron&apos;s 170gsm+ rule)
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Finishing items</div>
          {(spec.finishing_items ?? []).map((f, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
              <div>
                <label style={label()}>Finishing type</label>
                <select value={f.finishing_type} style={inp()}
                  onChange={e => setFinish(i, { finishing_type: e.target.value })}>
                  <option value="">— Select —</option>
                  {["Scoring","Folding","Guillotining","Saddle Stitch","Perfect Bound","Laminate","Gloss Laminate","Matt Laminate","Die Cut","Perforation","Tabbing","Shrink Wrap","Large Format Cutting"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={label()}>Area</label>
                <select value={f.finishing_area} style={inp()}
                  onChange={e => setFinish(i, { finishing_area: e.target.value })}>
                  {["Overall","Spot"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={label()}>Comments</label>
                <input value={f.comments} placeholder="Sub-option or note" style={inp()}
                  onChange={e => setFinish(i, { comments: e.target.value })} />
              </div>
              <button style={removeBtn}
                onClick={() => setSpec(prev => prev ? { ...prev, finishing_items: (prev.finishing_items ?? []).filter((_, j) => j !== i) } : prev)}>
                ✕
              </button>
            </div>
          ))}
          <button style={addBtn}
            onClick={() => setSpec(prev => prev ? { ...prev, finishing_items: [...(prev.finishing_items ?? []), blankFinish()] } : prev)}>
            + Add finishing item
          </button>
        </div>
      )}
    </div>
  );

  // ── FOLDING & BINDING — conditional ───────────────────────────────────
  const FoldingSection = () => (
    <div style={card()}>
      <div style={sectionHead()}><span style={sectionLabel}>📐 Folding & Binding</span></div>
      <div style={fieldWrap}>
        <Field k="folded_or_bound" label="Folded or bound" options={["No","Folded","Bound"]} />
        {spec?.folded_or_bound === "Folded" && (
          <Field k="fold_type" label="Fold type" options={["Single Fold","Z-Fold","Roll Fold","Gatefold","Concertina","French Fold","4pp","6pp","8pp","Complex Fold"]} />
        )}
        {spec?.folded_or_bound === "Bound" && (
          <>
            <Field k="binding_type" label="Binding type" options={["Saddle Stitch","Perfect Bound","Loop Stitch","Spiral Bound","Wiro Bound"]} />
            <Field k="binding_comments" label="Binding comments" placeholder="e.g. min 8 pages" />
          </>
        )}
      </div>
    </div>
  );

  // ── PACKAGING — conditional ───────────────────────────────────────────
  const PackagingSection = () => (
    <div style={card()}>
      <div style={sectionHead()}><span style={sectionLabel}>📦 Packaging</span></div>
      <div style={fieldWrap}>
        <BoolField k="inner_and_outer_packaging_required" label="Inner/outer packaging" />
        {spec?.inner_and_outer_packaging_required && (
          <>
            <Field k="inner_packaging_material" label="Inner material" options={["Packaging Cardboard","Bubble Wrap","Foam","Tissue"]} />
            <Field k="outer_packaging_material" label="Outer material" options={["Packaging Cardboard","Pallet","Box"]} />
          </>
        )}
        <Field k="pack_in" label="Pack in" placeholder="e.g. N/A" />
        <BoolField k="bundling_required" label="Bundling required" />
        {/* BUNDLING — conditional on bundling_required */}
        {spec?.bundling_required && (
          <>
            <Field k="bundling_type" label="Bundling type" options={["Shrink Wrap","Banded","Boxed","Palletised"]} />
            <div>
              <label style={label()}>Bundle quantity</label>
              <input type="number" value={spec?.bundle_quantity ?? ""} placeholder="e.g. 25" style={inp()}
                onChange={e => set("bundle_quantity", Number(e.target.value) || null)} />
            </div>
          </>
        )}
        <BoolField k="max_outer_packaging_size_required" label="Max outer size?" />
        {/* MAX OUTER PACKAGING SIZE — conditional */}
        {spec?.max_outer_packaging_size_required && (
          <>
            <div>
              <label style={label()}>Max length (mm)</label>
              <input type="number" value={spec?.max_outer_packaging_length ?? ""} style={inp()}
                onChange={e => set("max_outer_packaging_length", Number(e.target.value) || null)} />
            </div>
            <div>
              <label style={label()}>Max width (mm)</label>
              <input type="number" value={spec?.max_outer_packaging_width ?? ""} style={inp()}
                onChange={e => set("max_outer_packaging_width", Number(e.target.value) || null)} />
            </div>
            <div>
              <label style={label()}>Max height (mm)</label>
              <input type="number" value={spec?.max_outer_packaging_height ?? ""} style={inp()}
                onChange={e => set("max_outer_packaging_height", Number(e.target.value) || null)} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── DELIVERY repeatable group — conditional ───────────────────────────
  const DeliverySection = () => (
    <div style={card()}>
      <div style={sectionHead()}><span style={sectionLabel}>🚚 Delivery</span></div>
      <div style={fieldWrap}>
        <BoolField k="delivery_required" label="Delivery required" />
        <Field k="delivery_description" label="Delivery description" placeholder="e.g. 1 Delivery Dublin" />
        <div>
          <label style={label(isFlagged("delivery_location_count"))}>Location count</label>
          <input type="number" value={spec?.delivery_location_count ?? ""} placeholder="e.g. 1" style={inp(isFlagged("delivery_location_count"))}
            onChange={e => set("delivery_location_count", Number(e.target.value) || null)} />
        </div>
      </div>
      {/* DELIVERY LOCATIONS — conditional on delivery_required */}
      {spec?.delivery_required && (
        <div style={{ padding: "0 18px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Delivery locations</div>
          {(spec.delivery_locations ?? []).map((loc, i) => (
            <div key={i} style={{ ...groupBox(), marginBottom: 10 }}>
              <div style={groupHead()}>
                <span style={groupTitle}>Location {i + 1}{loc.city ? ` — ${loc.city}` : ""}{loc.county ? `, ${loc.county}` : ""}</span>
                {(spec.delivery_locations ?? []).length > 1 && (
                  <button style={removeBtn}
                    onClick={() => setSpec(prev => prev ? { ...prev, delivery_locations: (prev.delivery_locations ?? []).filter((_, j) => j !== i) } : prev)}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
                {[
                  ["location_name","Location name","e.g. Head Office"],
                  ["address",      "Address",       "Street address"],
                  ["city",         "City",          "e.g. Dublin"],
                  ["county",       "County",        "e.g. Dublin"],
                  ["eircode",      "Eircode",       "e.g. D02 XY45"],
                  ["delivery_notes","Notes",        ""],
                ].map(([key, lbl, ph]) => (
                  <div key={key}>
                    <label style={label()}>{lbl}</label>
                    <input value={String((loc as never)[key] ?? "")} placeholder={ph} style={inp()}
                      onChange={e => setLoc(i, { [key]: e.target.value } as Partial<MtivityDeliveryLocation>)} />
                  </div>
                ))}
                <div>
                  <label style={label()}>Quantity to this location</label>
                  <input type="number" value={loc.quantity ?? ""} style={inp()}
                    onChange={e => setLoc(i, { quantity: Number(e.target.value) || null })} />
                </div>
              </div>
            </div>
          ))}
          <button style={addBtn}
            onClick={() => setSpec(prev => prev ? { ...prev, delivery_locations: [...(prev.delivery_locations ?? []), blankLocation()] } : prev)}>
            + Add location
          </button>
        </div>
      )}
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "16px 24px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: ink, letterSpacing: "-0.01em" }}>
          Upload RFQ Spec
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: muted }}>
          Upload a Mtivity or portal spec PDF — AI extracts all fields with full conditional logic.
        </p>
      </div>

      {/* ── UPLOAD ZONE ── */}
      {status === "idle" && (
        <>
          <div onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById("pdf-upload")?.click()}
            style={{ background: dragOver ? "#E8F4FA" : "#fff", border: `2px dashed ${dragOver ? forest : line}`, borderRadius: 12, padding: "28px 32px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <input id="pdf-upload" type="file" accept="application/pdf" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: ink, marginBottom: 4 }}>
              {file ? file.name : "Drop a spec PDF or click to browse"}
            </div>
            <div style={{ fontSize: 13, color: muted }}>
              {file ? `${(file.size / 1024).toFixed(0)} KB · click to change` : "Mtivity · HH Global · Custodian · Konica"}
            </div>
          </div>
          {error && <div style={{ padding: "10px 16px", background: redBg, border: "1px solid #fca5a5", borderRadius: 8, color: red, fontSize: 14, marginBottom: 12 }}>{error}</div>}
          {file && (
            <button onClick={parseSpec} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: forest, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Extract quote fields →
            </button>
          )}
        </>
      )}

      {/* ── LOADING ── */}
      {status === "loading" && (
        <div style={{ ...card(), textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: ink, marginBottom: 4 }}>Reading spec…</div>
          <div style={{ fontSize: 13, color: muted }}>Applying Mtivity field mapping and print rules to {file?.name}</div>
        </div>
      )}

      {/* ── CANNOT QUOTE ── */}
      {status === "cannot_quote" && spec && (
        <div style={{ ...card(), border: `1.5px solid #fca5a5` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: red, marginBottom: 8 }}>⛔ Cannot quote this spec</div>
          <div style={{ fontSize: 13, color: ink, lineHeight: 1.7, marginBottom: 16 }}>
            {spec.cannot_quote_reason ?? "This RFQ does not contain a print specification."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, fontSize: 12 }}>
            {[["Spec ref", spec.job_reference], ["Created by", spec.created_by], ["Category", spec.mtivity_product_type ?? spec.category_of_work], ["Date", spec.created_date]].map(([l, v]) => (
              <div key={l as string} style={{ background: "#F9FAFB", borderRadius: 7, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{l}</div>
                <div style={{ fontWeight: 600, color: ink }}>{v ?? "—"}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); }}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1.5px solid ${line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: muted }}>
              ← Upload different spec
            </button>
            <button onClick={() => navigator.clipboard.writeText(`Hi,\n\nWe received spec ${spec.job_reference ?? ""} but it appears to be freight/logistics-only rather than a print job. Could you clarify whether this accompanies a print order?\n\nThanks,\nAzure Communications`)}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1.5px solid ${line}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: ink }}>
              Copy clarification email
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN REVIEW ── */}
      {(status === "done" || status === "approved") && spec && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* LEFT — all sections */}
          <div>
            {/* Format + creator badge */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: isMtivity ? blueBg : "#F3F4F6", color: isMtivity ? blueTx : muted, border: `1px solid ${isMtivity ? "#B5D4F4" : line}` }}>
                {isMtivity ? "✓ Mtivity structured parser" : "General spec parser"}
              </span>
              {spec.created_by && <span style={{ fontSize: 12, color: muted }}>Requested by {spec.created_by}{spec.created_date ? " · " + spec.created_date : ""}</span>}
            </div>

            {/* Substrate conflict */}
            {hasConflict && (
              <div style={{ background: redBg, border: `1.5px solid #fca5a5`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: red, marginBottom: 4 }}>⛔ Substrate conflict — manual selection required</div>
                <div style={{ fontSize: 13, color: red, lineHeight: 1.6 }}>{spec.substrate_conflict_detail}</div>
              </div>
            )}

            {/* Confidence flags */}
            {flags.length > 0 && (
              <div style={{ background: amberBg, border: `1px solid #fcd34d`, borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: amber, marginBottom: 6 }}>⚠ Review before approving</div>
                {flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: amber, paddingLeft: 10 }}>· {f}</div>)}
              </div>
            )}

            {/* PrintLogic auto-match */}
            <div style={card()}>
              <div style={{ fontSize: 12, fontWeight: 700, color: forest, marginBottom: 10 }}>🎯 PrintLogic Auto-Match</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  ["Stock",    hasConflict ? "⛔ Conflict — select manually" : plMaterial ? plMaterial.printlogic + (plMaterial.confirmed ? "" : " ⚠") : "No match"],
                  ["Delivery", deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : "—"],
                  ["Job type", spec.product_type ? `✓ ${spec.product_type}` : spec.mtivity_product_type ? `⚠ ${spec.mtivity_product_type} (unmapped)` : "—"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, color: ink }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GENERAL */}
            <div style={card()}>
              <div style={sectionHead()}><span style={sectionLabel}>📋 General</span></div>
              <div style={fieldWrap}>
                <Field k="job_reference"  label="Spec ID"      placeholder="e.g. 741086" />
                <Field k="spec_name"      label="Spec name"    placeholder="e.g. CIREBC1105 – A4 2pp" />
                <Field k="customer_name"  label="Customer"     placeholder="e.g. Custodian" />
                <Field k="description"    label="Description"  placeholder="Quantity + key details" wide />
                <Field k="category_of_work" label="Category of work" options={["Print","Freight","Custom Goods and Services"]} />
                <Field k="product_type"   label="PrintLogic job type" options={["Leaflets","Brochure Body","Brochure Cover","Business Cards","Cards / Postcards","Large Format Posters","Mailing","Booklets","Letterheads","Comp Slips","Pads","Self Mailer","4 Page Leaflet","Menu"]} />
                {spec.mtivity_product_type && !spec.product_type && (
                  <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: amberBg, borderRadius: 7, fontSize: 12, color: amber }}>
                    ⚠ Mtivity product type "{spec.mtivity_product_type}" has no PrintLogic mapping yet — select manually above
                  </div>
                )}
                <div>
                  <label style={label()}>Quantity</label>
                  <input type="number" value={spec?.quantity ?? ""} placeholder="e.g. 500" style={inp(isFlagged("quantity"))}
                    onChange={e => set("quantity", Number(e.target.value) || null)} />
                </div>
                <Field k="life_expectancy" label="Life expectancy" options={["Temporary","Permanent"]} />
                <Field k="finished_product_style" label="Product style" options={["Flat","Folded","Bound"]} />
              </div>
            </div>

            {/* DIMENSIONS */}
            <div style={card()}>
              <div style={sectionHead()}><span style={sectionLabel}>📐 Dimensions</span></div>
              <div style={fieldWrap}>
                <div>
                  <label style={label()}>Flat length (mm)</label>
                  <input type="number" value={spec?.flat_size_length ?? ""} style={inp()} onChange={e => set("flat_size_length", Number(e.target.value) || null)} />
                </div>
                <div>
                  <label style={label()}>Flat width (mm)</label>
                  <input type="number" value={spec?.flat_size_width ?? ""} style={inp()} onChange={e => set("flat_size_width", Number(e.target.value) || null)} />
                </div>
                <div>
                  <label style={label()}>Finished length (mm)</label>
                  <input type="number" value={spec?.finished_size_length ?? ""} style={inp()} onChange={e => set("finished_size_length", Number(e.target.value) || null)} />
                </div>
                <div>
                  <label style={label()}>Finished width (mm)</label>
                  <input type="number" value={spec?.finished_size_width ?? ""} style={inp()} onChange={e => set("finished_size_width", Number(e.target.value) || null)} />
                </div>
                <div>
                  <label style={label()}>Total pages</label>
                  <input type="number" value={spec?.pages ?? ""} style={inp()} onChange={e => set("pages", Number(e.target.value) || null)} />
                </div>
              </div>
            </div>

            {/* PREPRESS */}
            <div style={card()}>
              <div style={sectionHead()}><span style={sectionLabel}>🎨 Prepress</span></div>
              <div style={fieldWrap}>
                <Field k="artwork_status" label="Artwork" options={["New","Repeat","Customer Supplied"]} />
                <div>
                  <label style={label()}>Proof required</label>
                  <button style={toggle(!!spec?.proof_required)} onClick={() => set("proof_required", !spec?.proof_required)}>
                    {spec?.proof_required ? "Yes" : "No"}
                  </button>
                </div>
                {spec?.proof_required && <Field k="proof_type" label="Proof type" options={["PDF:Colour","PDF","Hard Copy","Digital"]} />}
              </div>
            </div>

            {/* SUBSTRATES repeatable */}
            <SubstratesSection />

            {/* FOLDING & BINDING conditional */}
            <FoldingSection />

            {/* FINISHING conditional */}
            <FinishingSection />

            {/* PACKAGING conditional */}
            <PackagingSection />

            {/* DELIVERY conditional + repeatable locations */}
            <DeliverySection />

            {/* SPECIAL NOTES */}
            <div style={card()}>
              <div style={sectionHead()}><span style={sectionLabel}>📝 Notes</span></div>
              <div style={fieldWrap}>
                <Field k="special_notes" label="Special notes" placeholder="Any other quoting-relevant info" wide />
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <button onClick={() => { setFile(null); setSpec(null); setStatus("idle"); setError(null); setIsMtivity(false); }}
                style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${line}`, background: "#fff", color: muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                ← New spec
              </button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(spec, null, 2))}
                style={{ padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${line}`, background: "#fff", color: muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Export JSON
              </button>
              {status === "done" && !hasConflict && (
                <button onClick={() => setStatus("approved")}
                  style={{ flex: 1, minWidth: 180, padding: "11px 18px", borderRadius: 10, border: "none", background: forest, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Approve — Ready for PrintLogic
                </button>
              )}
              {status === "done" && hasConflict && (
                <div style={{ flex: 1, padding: "11px 18px", borderRadius: 10, background: redBg, border: `1px solid #fca5a5`, fontSize: 13, color: red, display: "flex", alignItems: "center" }}>
                  ⛔ Resolve substrate conflict before approving
                </div>
              )}
            </div>

            {status === "approved" && (
              <div style={{ ...card(), border: `1.5px solid #86efac`, marginTop: 14 }}>
                <div style={{ fontWeight: 700, color: forest, marginBottom: 12, fontSize: 15 }}>✅ Approved — PrintLogic Checklist</div>
                {[
                  `Customer: ${spec.customer_name ?? "[check email]"}`,
                  `Job type: ${spec.product_type ?? "[confirm]"} · Qty: ${spec.quantity ?? "[confirm]"}`,
                  `Size: ${spec.finished_size_length && spec.finished_size_width ? `${spec.finished_size_length}×${spec.finished_size_width}mm` : "[confirm]"}`,
                  `Stock: ${plMaterial?.printlogic ?? "[Aaron to select]"}`,
                  `Sides: ${spec.sides_printed ?? "[confirm]"} · ${scoringOn ? "✓ Scoring auto-applied" : "Check finishing"}`,
                  `Delivery: ${deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : "[confirm]"}`,
                  `Paste Item Details (right panel) → Calculate → Review margin → Send`,
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < 6 ? `1px solid ${line}` : "none", fontSize: 13 }}>
                    <span style={{ color: forest, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span><span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — sticky preview */}
          <div style={{ position: "sticky", top: 20 }}>
            <div style={{ background: "#0a1a10", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ background: forest, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: lime, textTransform: "uppercase", letterSpacing: "0.08em" }}>🖨 PrintLogic Item Details</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Live · Aaron&apos;s format</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(itemDetails); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "16px", fontFamily: "monospace", fontSize: 12, color: "#a8e6b4", lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto" }}>
                {itemDetails || "— Complete fields to generate —"}
              </pre>
            </div>

            {/* Summary panel */}
            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: forest, marginBottom: 10 }}>Quick summary</div>
              {[
                ["Spec ref",    spec.job_reference],
                ["Customer",   spec.customer_name],
                ["Job type",   spec.product_type ?? (spec.mtivity_product_type ? "⚠ " + spec.mtivity_product_type : null)],
                ["Qty",        spec.quantity],
                ["Finished",   spec.finished_size_length && spec.finished_size_width ? `${spec.finished_size_length}×${spec.finished_size_width}mm` : null],
                ["Pages",      spec.pages ? `${spec.pages}pp` : null],
                ["Stock",      (gsm && spec.substrate_type) ? `${gsm}gsm ${spec.substrate_type}` : null],
                ["Sides",      spec.sides_printed],
                ["Finishing",  spec.finishing_items?.map(f => f.finishing_type).filter(Boolean).join(", ") || null],
                ["Bundling",   spec.bundling_required ? `${spec.bundling_type ?? ""} ${spec.bundle_quantity ? "×" + spec.bundle_quantity : ""}`.trim() : null],
                ["Delivery",   deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : null],
              ].map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${line}`, fontSize: 12 }}>
                  <span style={{ color: muted, fontWeight: 500 }}>{l}</span>
                  <span style={{ color: v ? ink : "rgba(0,0,0,0.18)", fontWeight: v ? 600 : 400, textAlign: "right", maxWidth: "58%" }}>{v ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
