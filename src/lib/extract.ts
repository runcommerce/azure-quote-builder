import type {
  AdminConfig, ExtractedSpec, MtivitySubstrate, MtivityFinishingItem,
  MtivityDeliveryLocation, MaterialEntry, JobTypeDefault, DeliveryRule,
} from "./types";

// ── MTIVITY FORMAT DETECTION ─────────────────────────────────────────────
export function detectMtivityFormat(text: string): boolean {
  const signals = [
    "Form: 2D Specification",
    "SS1:Substrate Name",
    "Flat Size (Length)",
    "Form: Calculation Method",
    "Category of work:",
    "Life Expectancy:",
  ];
  return signals.filter(s => text.includes(s)).length >= 2;
}

// ── NON-PRINT DETECTION ──────────────────────────────────────────────────
const NON_PRINT_CATEGORIES = ["Freight", "Custom Goods and Services"];
export function detectNonPrint(text: string): { isNonPrint: boolean; reason: string | null } {
  for (const cat of NON_PRINT_CATEGORIES) {
    if (text.includes("Category of work: " + cat) || text.includes("Product Type: Freight")) {
      return {
        isNonPrint: true,
        reason: "Category of work is '" + cat + "' — not a print RFQ. Route to Ciaran or Lisa.",
      };
    }
  }
  return { isNonPrint: false, reason: null };
}

// ── MTIVITY PROMPT ───────────────────────────────────────────────────────
export function buildMtivityPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");

  return `You are a print quoting specialist for Azure Communications, an Irish print company.
This is a structured Mtivity/Caudit portal spec. Extract every field precisely.
Return ONLY valid JSON — no preamble, no markdown fences.

PRINTLOGIC JOB TYPE MAPPING (map mtivity_product_type to product_type):
"Leaflet/Stuffer" → "Leaflets"
"Booklet" → "Brochure Body"
"Brochure" → "Brochure Body"
"Poster" → "Large Format Posters"
"Business Card" → "Business Cards"
"Postcard" → "Cards / Postcards"
"Menu" → null  (unmapped — leave product_type null)
Any unlisted type → null (leave product_type null)
Known PrintLogic types for reference: ${jobTypes}

SUBSTRATE CONFLICT RULE:
If substrate_name contains "Silk" AND substrate_comments OR side_comments contain any of
["write on","writable","wipeable","non-gloss","anti-microbial"]
→ set substrate_conflict: true, substrate_conflict_detail: explain the contradiction

SCORING RULE (Aaron's confirmed rule):
If any substrate weight >= 170gsm → set scoring_auto_applied: true
AND add {"finishing_type":"Scoring","finishing_area":"Overall","comments":"Auto-applied: 170gsm+ rule"} to finishing_items
AND set finishing_required: true

REQUIRED FIELD FLAGS:
If quantity is null → add "quantity — not stated, clarification required" to confidence_flags
If delivery_required is true and delivery_locations is empty → add "delivery_address — locations not specified" to confidence_flags

Return this exact JSON structure — populate every field, use null for absent values, false for absent booleans:
{
  "source_format": "mtivity",
  "cannot_quote": false,
  "cannot_quote_reason": null,
  "substrate_conflict": false,
  "substrate_conflict_detail": null,

  "job_reference": "the spec ID number in parentheses e.g. 741086",
  "spec_name": "the spec title e.g. CIREBC1105 - A4 2pp",
  "customer_name": null,
  "created_by": "from Created By: field",
  "created_date": "from Created On: field",
  "unit_of_measure": "Each",
  "description": "contents of Description: field",
  "spec_type": "Standard",
  "form_type": "2D Specification V2 or Calculation Method etc",

  "category_of_work": "e.g. Print",
  "product_type": "mapped PrintLogic job type or null",
  "mtivity_product_type": "raw Mtivity Product Type label",
  "life_expectancy": "e.g. Temporary, Permanent",

  "finished_product_style": "Flat or Folded or Bound",
  "main_substrate": "Paper or Board or Synthetic",
  "lighting_required": false,
  "electronics_required": false,

  "measurement_unit": "mm",
  "flat_size_length": null,
  "flat_size_width": null,
  "finished_size_length": null,
  "finished_size_width": null,
  "pages": null,

  "quantity": null,

  "substrates": [
    {
      "used_as": "e.g. 4pp 2pp or brochure",
      "substrate_type": "Paper",
      "substrate_name": "e.g. Matt Coated or Silk Coated",
      "sustainability_accreditation": "e.g. FSC Mix (min 70%)",
      "measured_by": "Weight or Thickness",
      "weight": null,
      "weight_unit": "gsm",
      "thickness": null,
      "thickness_unit": "",
      "section_page_count": null,
      "substrate_comments": "from SS1:Substrate Comments field",
      "ink_coverage": "e.g. Ink spec - Two sides, same inks both sides",
      "artwork_variation": "e.g. Different Art or Same Art",
      "sides": [
        {
          "side_number": 1,
          "four_colour_process": false,
          "spot_colours_required": false,
          "number_of_spot_colours": null,
          "coating_required": false,
          "number_of_coatings": null,
          "coatings": [],
          "side_comments": ""
        }
      ]
    }
  ],

  "substrate_type": "convenience copy of substrates[0].substrate_name",
  "substrate_weight_gsm": null,
  "sustainability": "convenience copy of substrates[0].sustainability_accreditation",
  "sides_printed": "Single sided or Double sided based on number of sides in substrates[0].sides",

  "artwork_status": "New or Repeat or Customer Supplied",
  "proof_required": false,
  "proof_type": "e.g. PDF:Colour or PDF",

  "trim_to_size": false,
  "folded_or_bound": "Folded or Bound or No",
  "fold_type": null,
  "binding_type": null,
  "binding_comments": null,

  "finishing_required": false,
  "finishing_items": [],
  "scoring_auto_applied": false,

  "inner_and_outer_packaging_required": false,
  "inner_packaging_material": null,
  "outer_packaging_material": null,
  "max_outer_packaging_size_required": false,
  "max_outer_packaging_length": null,
  "max_outer_packaging_width": null,
  "max_outer_packaging_height": null,
  "max_outer_packaging_unit": "mm",
  "pack_in": null,
  "bundling_required": false,
  "bundling_type": null,
  "bundle_quantity": null,

  "delivery_required": false,
  "delivery_description": "any delivery info from Description field",
  "delivery_location_count": null,
  "delivery_locations": [],

  "calculation_method": "Quantity",

  "confidence_flags": [],
  "special_notes": null
}`;
}

// ── GENERIC PROMPT ────────────────────────────────────────────────────────
export function buildPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");
  return `You are a print industry quoting specialist for Azure Communications, an Irish print company.
Analyse this RFQ (PDF, email, or spec sheet) and extract all quoting-relevant fields.
Known job types: ${jobTypes}. Set absent or ambiguous fields to null.
Respond ONLY with valid JSON — no preamble, no markdown fences.

{
  "source_format": "generic",
  "cannot_quote": false,
  "cannot_quote_reason": null,
  "substrate_conflict": false,
  "substrate_conflict_detail": null,
  "job_reference": null,
  "spec_name": null,
  "customer_name": null,
  "created_by": null,
  "created_date": null,
  "unit_of_measure": "Each",
  "description": null,
  "spec_type": null,
  "form_type": null,
  "category_of_work": "Print",
  "product_type": null,
  "mtivity_product_type": null,
  "life_expectancy": null,
  "finished_product_style": null,
  "main_substrate": "Paper",
  "lighting_required": false,
  "electronics_required": false,
  "measurement_unit": "mm",
  "flat_size_length": null,
  "flat_size_width": null,
  "finished_size_length": null,
  "finished_size_width": null,
  "pages": null,
  "quantity": null,
  "substrates": [
    {
      "used_as": "",
      "substrate_type": "Paper",
      "substrate_name": "",
      "sustainability_accreditation": "",
      "measured_by": "Weight",
      "weight": null,
      "weight_unit": "gsm",
      "thickness": null,
      "thickness_unit": "",
      "section_page_count": null,
      "substrate_comments": "",
      "ink_coverage": "",
      "artwork_variation": "",
      "sides": [
        {
          "side_number": 1,
          "four_colour_process": true,
          "spot_colours_required": false,
          "number_of_spot_colours": null,
          "coating_required": false,
          "number_of_coatings": null,
          "coatings": [],
          "side_comments": ""
        }
      ]
    }
  ],
  "substrate_type": null,
  "substrate_weight_gsm": null,
  "sustainability": null,
  "sides_printed": "Double sided",
  "artwork_status": "New",
  "proof_required": false,
  "proof_type": null,
  "trim_to_size": true,
  "folded_or_bound": "No",
  "fold_type": null,
  "binding_type": null,
  "binding_comments": null,
  "finishing_required": false,
  "finishing_items": [],
  "scoring_auto_applied": false,
  "inner_and_outer_packaging_required": false,
  "inner_packaging_material": null,
  "outer_packaging_material": null,
  "max_outer_packaging_size_required": false,
  "max_outer_packaging_length": null,
  "max_outer_packaging_width": null,
  "max_outer_packaging_height": null,
  "max_outer_packaging_unit": "mm",
  "pack_in": null,
  "bundling_required": false,
  "bundling_type": null,
  "bundle_quantity": null,
  "delivery_required": false,
  "delivery_description": null,
  "delivery_location_count": null,
  "delivery_locations": [],
  "calculation_method": "Quantity",
  "confidence_flags": [],
  "special_notes": null
}`;
}

// ── POST-EXTRACTION VALIDATION ────────────────────────────────────────────
export function validateExtractedSpec(spec: Partial<ExtractedSpec>): Partial<ExtractedSpec> {
  const updated = { ...spec };
  const flags = [...(spec.confidence_flags || [])];
  const gsm = spec.substrate_weight_gsm ?? (spec.substrates?.[0]?.weight ?? 0);

  // Scoring rule: 170gsm+ auto-adds Scoring finishing item
  if (gsm >= 170 && !spec.scoring_auto_applied) {
    const items = [...(spec.finishing_items || [])];
    const alreadyHasScoring = items.some(f => f.finishing_type.toLowerCase().includes("scor"));
    if (!alreadyHasScoring) {
      items.push({ finishing_type: "Scoring", finishing_area: "Overall", comments: "Auto-applied: Aaron 170gsm+ rule" });
      updated.finishing_items = items;
      updated.finishing_required = true;
      updated.scoring_auto_applied = true;
    }
  }

  // Required field flags
  if (!spec.quantity) flags.push("quantity — not stated, clarification email required");
  if (spec.delivery_required && (!spec.delivery_locations || spec.delivery_locations.length === 0)) {
    flags.push("delivery_locations — delivery required but no locations specified");
  }

  updated.confidence_flags = flags;
  return updated;
}

// ── MATERIAL LOOKUP ───────────────────────────────────────────────────────
export function lookupMaterial(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): (MaterialEntry & { matched: boolean }) | null {
  if (!spec) return null;
  const weight = spec.substrate_weight_gsm ?? spec.substrates?.[0]?.weight ?? null;
  if (!weight) return null;
  const type = (spec.substrate_type ?? spec.substrates?.[0]?.substrate_name ?? "").toLowerCase();
  const finish = type.includes("matt") ? "matt" : type.includes("uncoated") ? "uncoated" : "silk";
  const key = `${weight}gsm ${finish}`;
  const match = admin.materialLookup.find(m => m.key.toLowerCase() === key.toLowerCase());
  return match ? { ...match, matched: true } : null;
}

// ── JOB DEFAULTS ─────────────────────────────────────────────────────────
export function getJobDefaults(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): JobTypeDefault | null {
  if (!spec?.product_type) return null;
  const pt = spec.product_type.toLowerCase();
  return admin.jobTypeDefaults.find(j => j.active && pt.includes(j.jobType.toLowerCase())) || null;
}

// ── DELIVERY RULE ─────────────────────────────────────────────────────────
export function getDeliveryRule(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): DeliveryRule | null {
  // Check first delivery location city, then description fallback
  const firstLoc = spec?.delivery_locations?.[0];
  const city = (firstLoc?.city ?? firstLoc?.county ?? spec?.delivery_description ?? "").toLowerCase();
  const isDublin = city.includes("dublin") || /\bd\d{1,2}\b/.test(city);
  const active = admin.deliveryRules.filter(r => r.active);
  // Multi-location: flag for pallet check
  if ((spec?.delivery_location_count ?? 0) > 1) {
    return active.find(r => r.courier === "Overnight Parcel") || active[0] || null;
  }
  return active.find(r => isDublin ? r.courier === "Small Van" : r.courier === "Overnight Parcel") || active[0] || null;
}

// ── ITEM DETAILS GENERATOR (Aaron's format) ───────────────────────────────
export function generateItemDetails(spec: Partial<ExtractedSpec> | null): string {
  if (!spec) return "";
  const lines: string[] = [];

  // Resolve size
  const fl = spec.flat_size_length;
  const fw = spec.flat_size_width;
  const fnl = spec.finished_size_length;
  const fnw = spec.finished_size_width;
  const size = fnl && fnw ? `${fnl}x${fnw}mm` : fl && fw ? `${fl}x${fw}mm` : "";
  const pages = spec.pages ? `${spec.pages}pp ` : "";

  // Resolve substrate from substrates[0] or flat fields
  const sub0 = spec.substrates?.[0];
  const weight = spec.substrate_weight_gsm ?? sub0?.weight ?? null;
  const subName = spec.substrate_type ?? sub0?.substrate_name ?? "";
  const substrate = [weight ? `${weight}gsm` : null, subName].filter(Boolean).join(" ");

  // Sides
  const sideCount = sub0?.sides?.length ?? (spec.sides_printed === "Single sided" ? 1 : 2);
  const sides = sideCount === 1 ? "printed 1 side" : "printed both sides";

  // Line 1: size — sides on stock
  if (size || substrate) lines.push(`${pages}${size} — ${sides} on ${substrate}`.trim());

  // Coatings — iterate substrate sides
  sub0?.sides?.forEach(side => {
    side.coatings?.forEach(c => {
      if (c.coating_type && c.coating_type !== "None") {
        lines.push(side.side_number === 1 ? c.coating_type : `Side ${side.side_number}: ${c.coating_type}`);
      }
    });
  });

  // Fold / binding
  if (spec.folded_or_bound === "Folded" && spec.fold_type && spec.fold_type !== "None") lines.push(spec.fold_type);
  if (spec.folded_or_bound === "Bound" && spec.binding_type && spec.binding_type !== "None") lines.push(spec.binding_type);

  // Finishing items — each on own line (Aaron's format)
  spec.finishing_items?.forEach(f => {
    if (f.finishing_type && f.finishing_type !== "None") lines.push(f.finishing_type);
  });

  // Bundling
  if (spec.bundling_required && spec.bundling_type) {
    const qty = spec.bundle_quantity ? ` in ${spec.bundle_quantity}s` : "";
    lines.push(spec.bundling_type + qty);
  }

  // Delivery — last line
  if (spec.delivery_required && spec.delivery_locations && spec.delivery_locations.length > 0) {
    const loc = spec.delivery_locations[0];
    const dest = [loc.city, loc.county].filter(Boolean).join(", ") || loc.address || spec.delivery_description || "";
    const multiNote = (spec.delivery_location_count ?? 1) > 1 ? ` (+${(spec.delivery_location_count ?? 1) - 1} more)` : "";
    if (dest) lines.push(`Delivered to ${dest}${multiNote}`);
  } else if (spec.delivery_description) {
    lines.push(`Delivery: ${spec.delivery_description}`);
  }

  return lines.join("\n");
}

// ── API CALLER ────────────────────────────────────────────────────────────
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
