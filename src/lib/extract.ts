import type { AdminConfig, ExtractedSpec, MaterialEntry, JobTypeDefault, DeliveryRule } from "./types";

// ── MTIVITY FORMAT DETECTION ────────────────────────────────────────────
// Mtivity/Caudit portal specs have consistent field labels we can key on.
// Checking for 2+ signals avoids false positives on generic print PDFs.
export function detectMtivityFormat(text: string): boolean {
  const signals = [
    "Form: 2D Specification",
    "SS1:Substrate Name",
    "Flat Size (Length)",
    "Flat Size (Width)",
    "SS1:Weight",
    "Form: Calculation Method",
    "Category of work:",
    "Life Expectancy:",
  ];
  const matches = signals.filter(s => text.includes(s));
  return matches.length >= 2;
}

// ── NON-PRINT DETECTION ─────────────────────────────────────────────────
// Freight-only or Custom Goods RFQs cannot be quoted by the print system.
const NON_PRINT_CATEGORIES = ["Freight", "Custom Goods and Services"];
const NON_PRINT_PRODUCT_TYPES = ["Freight - General", "Freight - Express"];

export function detectNonPrint(text: string): { isNonPrint: boolean; reason: string | null } {
  for (const cat of NON_PRINT_CATEGORIES) {
    if (text.includes("Category of work: " + cat) || text.includes("Category of work:" + cat)) {
      return {
        isNonPrint: true,
        reason: "Category of work is '" + cat + "' — this is not a print RFQ. Route to Ciaran or Lisa for manual handling.",
      };
    }
  }
  for (const pt of NON_PRINT_PRODUCT_TYPES) {
    if (text.includes("Product Type: " + pt) || text.includes("Product Type:" + pt)) {
      return {
        isNonPrint: true,
        reason: "Product Type is '" + pt + "' — freight/logistics only, no print spec present.",
      };
    }
  }
  return { isNonPrint: false, reason: null };
}

// ── MTIVITY-SPECIFIC PROMPT ─────────────────────────────────────────────
// Structured prompt engineered for the consistent Mtivity/Caudit field format.
// Uses exact Mtivity field names so Claude can locate them reliably.
export function buildMtivityPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");

  return `You are a print quoting specialist for Azure Communications, an Irish print company.
This document is a structured Mtivity/Caudit portal spec sheet. The fields use consistent labels.
Extract all quoting-relevant information and return ONLY valid JSON — no preamble, no markdown fences.

KNOWN PRINTLOGIC JOB TYPES: ${jobTypes}

MTIVITY PRODUCT TYPE MAPPING (map the Mtivity label to the closest PrintLogic job type):
- "Leaflet/Stuffer" → "Leaflets"
- "Booklet" → "Brochure Body"
- "Brochure" → "Brochure Body"
- "Poster" → "Large Format Posters"
- "Business Card" → "Business Cards"
- "Postcard" → "Cards / Postcards"
- "Menu" → null (not yet mapped — leave product_type null, set mtivity_product_type to raw value)
- Any other type not listed → leave product_type null, set mtivity_product_type to raw value

SUBSTRATE CONFLICT DETECTION:
If the spec states "Silk Coated" or "Silk" as substrate name BUT the comments mention any of:
["write on", "writable", "wipeable", "non-gloss", "matte finish", "anti-microbial"]
then set substrate_conflict: true and explain in substrate_conflict_detail.

FIELD EXTRACTION GUIDE (use exact Mtivity field labels to locate values):
- Spec reference: the number in parentheses in the title e.g. (741086)
- Created By: "Created By:" line
- Created On: "Created On:" line
- Quantity: found in Description field or inferred
- Flat size: "Flat Size (Length)" and "Flat Size (Width)" in mm
- Finished size: "Finished Size (Length)" and "Finished Size (Width)" in mm
- Pages: "Total Number of Pages"
- Substrate type: "SS1:Substrate Name - Paper:" field
- Weight: "SS1:Weight:" + "SS1:Weight Unit:" (always gsm)
- Sustainability: "SS1:Sustainable Material Accreditation:"
- Sides: if "SS1:Side 2" section exists = Double sided; else Single sided
- Colours side 1: "SS1:Side 1:4 colour process: Yes" = "4 colour process"; No = "Mono"
- Colours side 2: same pattern for Side 2
- Coating side 1: "SS1:Side 1:Coating 1:" field; if "Coating Required?: No" = "None"
- Coating side 2: same for Side 2
- Fold type: "Fold Type:" field; if "Folded or Bound?: No" = "None"
- Binding: "Folded or Bound?: Folded" + Fold Type → set fold_type; "Saddle Stitch" → set binding
- Bundling: "Bundling Type:" + "Shrink Wrap Qty:" e.g. "Shrink wrap in 25s"
- Packaging: "Inner Packaging Material:" and "Outer Packaging Material:"
- Proof: "Proof Type:" field
- Artwork: "Artwork:" field (New / Repeat)
- Delivery: "Description" field often states delivery info e.g. "1 Delivery Dublin"
- Special notes: "SS1:Side 1:Comments:" or "SS1:Substrate Comments:" fields

Return this exact JSON structure:
{
  "source_format": "mtivity",
  "cannot_quote": false,
  "cannot_quote_reason": null,
  "substrate_conflict": false,
  "substrate_conflict_detail": null,
  "job_reference": "spec ref number e.g. 741086",
  "customer_name": null,
  "created_by": "name from Created By field",
  "created_date": "date from Created On field",
  "product_type": "mapped PrintLogic job type or null",
  "mtivity_product_type": "raw Mtivity product type label",
  "quantity": number or null,
  "flat_size_mm": "LENGTHxWIDTH e.g. 297x210",
  "finished_size_mm": "LENGTHxWIDTH e.g. 297x210",
  "pages": number or null,
  "substrate_type": "e.g. Silk Coated, Matt Coated, Uncoated",
  "substrate_weight_gsm": number or null,
  "sustainability": "e.g. FSC Mix (min 70%)",
  "sides_printed": "Single sided or Double sided",
  "colours_side_1": "4 colour process or Mono",
  "colours_side_2": "4 colour process, Mono, or N/A",
  "coating_side_1": "e.g. Matt Varnish, Gloss Laminate, None",
  "coating_side_2": "e.g. None, N/A",
  "fold_type": "e.g. Single Fold, None",
  "binding": "e.g. Saddle Stitch, None",
  "finishing_other": "e.g. Scoring, Guillotining, or None",
  "bundling": "e.g. Shrink wrap in 25s, None",
  "packaging": "e.g. Cardboard inner and outer, None",
  "proof_required": "e.g. PDF:Colour, PDF, None",
  "artwork_status": "New, Repeat, or Customer Supplied",
  "delivery_locations": number or null,
  "delivery_address": "city/county or null",
  "special_notes": "any clinical use, version notes, multi-location info, or null",
  "confidence_flags": ["list only fields that are genuinely ambiguous or missing"]
}`;
}

// ── GENERIC PROMPT (unchanged — used for emails and non-Mtivity PDFs) ───
export function buildPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");
  return `You are a print industry quoting specialist for Azure Communications, an Irish print company.
Analyse this RFQ document (PDF, email, or spec sheet) and extract all quoting-relevant fields.
Known job types: ${jobTypes}.
If a field is absent or ambiguous, set it to null.
Respond ONLY with valid JSON — no preamble, no markdown fences.

{
  "source_format": "generic",
  "cannot_quote": false,
  "cannot_quote_reason": null,
  "substrate_conflict": false,
  "substrate_conflict_detail": null,
  "job_reference": "spec/job reference if present",
  "customer_name": "customer or portal name if identifiable",
  "created_by": null,
  "created_date": null,
  "product_type": "one of the known job types or best match",
  "mtivity_product_type": null,
  "quantity": null,
  "flat_size_mm": "e.g. 420x297",
  "finished_size_mm": "e.g. 297x210",
  "pages": null,
  "substrate_type": "e.g. Silk Coated, Matt Coated, Uncoated",
  "substrate_weight_gsm": null,
  "sustainability": "e.g. FSC Mix, FSC Recycled, none stated",
  "sides_printed": "Single sided or Double sided",
  "colours_side_1": "e.g. 4 colour process, Mono",
  "colours_side_2": "e.g. 4 colour process, Mono, N/A",
  "coating_side_1": "e.g. Gloss laminate, Matt laminate, Gloss varnish, Matt varnish, None",
  "coating_side_2": "e.g. Gloss laminate, Matt laminate, None, N/A",
  "fold_type": "e.g. Single fold, Gatefold, Z fold, None",
  "binding": "e.g. Saddle stitch, Perfect bound, None",
  "finishing_other": "any other finishing e.g. scoring, die cut, perforation",
  "bundling": "e.g. Shrink wrap in 25s, Banded in 100s, Loose, None",
  "packaging": "e.g. Carton, Pallet, None",
  "proof_required": "PDF, Hard copy, None",
  "artwork_status": "New, Repeat, Customer supplied",
  "delivery_locations": null,
  "delivery_address": "city or county if stated",
  "special_notes": "any other quoting-relevant requirements",
  "confidence_flags": ["list fields where you are uncertain or the spec is ambiguous"]
}`;
}

// ── POST-EXTRACTION VALIDATION ───────────────────────────────────────────
// Applied after Claude returns JSON — catches issues the prompt may miss.
export function validateExtractedSpec(spec: Partial<ExtractedSpec>): Partial<ExtractedSpec> {
  const updated = { ...spec };
  const flags = [...(spec.confidence_flags || [])];

  // Scoring rule: 170gsm+ auto-adds scoring to finishing_other
  const gsm = spec.substrate_weight_gsm || 0;
  if (gsm >= 170) {
    const existing = (spec.finishing_other || "").toLowerCase();
    if (!existing.includes("scor")) {
      updated.finishing_other = spec.finishing_other
        ? spec.finishing_other + ", Scoring"
        : "Scoring";
    }
  }

  // Required field check — flag anything missing that blocks quoting
  if (!spec.quantity) flags.push("quantity — not stated, clarification email required");
  if (!spec.delivery_address) flags.push("delivery_address — not stated, cannot apply delivery rule");

  updated.confidence_flags = flags;
  return updated;
}

// ── MATERIAL LOOKUP (unchanged) ──────────────────────────────────────────
export function lookupMaterial(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): (MaterialEntry & { matched: boolean }) | null {
  if (!spec?.substrate_weight_gsm) return null;
  const weight = spec.substrate_weight_gsm;
  const type = (spec.substrate_type || "").toLowerCase();
  const finish = type.includes("matt") ? "matt" : type.includes("uncoated") ? "uncoated" : "silk";
  const key = `${weight}gsm ${finish}`;
  const match = admin.materialLookup.find(m => m.key.toLowerCase() === key.toLowerCase());
  return match ? { ...match, matched: true } : null;
}

// ── JOB DEFAULTS (unchanged) ─────────────────────────────────────────────
export function getJobDefaults(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): JobTypeDefault | null {
  if (!spec?.product_type) return null;
  const pt = spec.product_type.toLowerCase();
  return admin.jobTypeDefaults.find(j => j.active && pt.includes(j.jobType.toLowerCase())) || null;
}

// ── DELIVERY RULE (unchanged) ────────────────────────────────────────────
export function getDeliveryRule(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): DeliveryRule | null {
  const addr = (spec?.delivery_address || "").toLowerCase();
  const isDublin = addr.includes("dublin") || /\bd\d{1,2}\b/.test(addr);
  const active = admin.deliveryRules.filter(r => r.active);
  return active.find(r => isDublin ? r.courier === "Small Van" : r.courier === "Overnight Parcel") || active[0] || null;
}

// ── ITEM DETAILS GENERATOR (updated to use Aaron's format strictly) ───────
export function generateItemDetails(spec: Partial<ExtractedSpec> | null): string {
  if (!spec) return "";
  const lines: string[] = [];
  const size = spec.finished_size_mm || spec.flat_size_mm || "";
  const pages = spec.pages ? `${spec.pages}pp ` : "";
  const weight = spec.substrate_weight_gsm ? `${spec.substrate_weight_gsm}gsm` : "";
  const substrate = [weight, spec.substrate_type].filter(Boolean).join(" ");
  const sides = spec.sides_printed === "Single sided" ? "printed 1 side" : "printed both sides";
  // Line 1: size — sides on stock
  if (size || substrate) lines.push(`${pages}${size} — ${sides} on ${substrate}`.trim());
  // Coatings
  if (spec.coating_side_1 && spec.coating_side_1 !== "None") lines.push(spec.coating_side_1);
  if (spec.coating_side_2 && !["None", "N/A"].includes(spec.coating_side_2 || "")) lines.push(`Side 2: ${spec.coating_side_2}`);
  // Finishing (each on its own line — Aaron's format)
  if (spec.fold_type && spec.fold_type !== "None") lines.push(spec.fold_type);
  if (spec.binding && spec.binding !== "None") lines.push(spec.binding);
  // finishing_other may now contain multiple items e.g. "Scoring, Guillotining"
  if (spec.finishing_other && spec.finishing_other !== "None") {
    spec.finishing_other.split(",").map(f => f.trim()).filter(Boolean).forEach(f => lines.push(f));
  }
  // Bundling
  if (spec.bundling && spec.bundling !== "None") lines.push(spec.bundling);
  // Last line: delivery
  if (spec.delivery_address) lines.push(`Delivered to ${spec.delivery_address}`);
  return lines.join("\n");
}

// ── API CALLER (updated — now accepts pre-extracted text for format detection) ──
export async function callExtractAPI(
  base64: string,
  mediaType: string,
  provider: string,
  model: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, model, base64, mediaType, prompt, apiKey }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.result ?? data.text ?? "";
}

// ── TEXT-BASED FORMAT PRE-CHECK (for when text is extracted client-side) ─
// Called before sending to API — allows choosing the right prompt without
// a round trip. Pass the raw PDF text if available; falls back to generic.
export function selectPrompt(
  pdfText: string | null,
  admin: AdminConfig
): { prompt: string; isMtivity: boolean } {
  if (pdfText && detectMtivityFormat(pdfText)) {
    return { prompt: buildMtivityPrompt(admin), isMtivity: true };
  }
  return { prompt: buildPrompt(admin), isMtivity: false };
}
