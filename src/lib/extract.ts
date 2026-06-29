import type {
  AdminConfig, ExtractedSpec, MtivitySubstrate, MtivityFinishingItem,
  MtivityDeliveryLocation, MaterialEntry, JobTypeDefault, DeliveryRule,
  FieldStatusMap, FieldStatus,
} from "./types";

// ── MTIVITY FORMAT DETECTION ─────────────────────────────────────────────
export function detectMtivityFormat(text: string): boolean {
  const signals = [
    "Form: 2D Specification", "SS1:Substrate Name",
    "Flat Size (Length)", "Form: Calculation Method",
    "Category of work:", "Life Expectancy:",
  ];
  return signals.filter(s => text.includes(s)).length >= 2;
}

// ── NON-PRINT DETECTION ──────────────────────────────────────────────────
const NON_PRINT_CATEGORIES = ["Freight", "Custom Goods and Services"];
export function detectNonPrint(text: string): { isNonPrint: boolean; reason: string | null } {
  for (const cat of NON_PRINT_CATEGORIES) {
    if (text.includes("Category of work: " + cat) || text.includes("Product Type: Freight")) {
      return { isNonPrint: true, reason: "Category of work is '" + cat + "' — not a print RFQ. Route to Ciaran or Lisa." };
    }
  }
  return { isNonPrint: false, reason: null };
}

// ── REQUIRED FIELDS ───────────────────────────────────────────────────────
// "Always shown" fields that must be populated to calculate a quote
export const REQUIRED_FIELDS: Record<string, string> = {
  quantity: "Total quantity",
  // delivery_region always gets a default (ROI/overnight) so not listed as hard-required
};

export const CONDITIONAL_REQUIRED: Record<string, {
  condition: (s: Partial<ExtractedSpec>) => boolean;
  label: string;
}> = {
  fold_type:    { condition: s => s.folded_or_bound === "Folded",  label: "Fold type" },
  binding_type: { condition: s => s.folded_or_bound === "Bound",   label: "Binding type" },
  bundling_type:{ condition: s => !!s.bundling_required,           label: "Bundling type" },
  proof_type:   { condition: s => !!s.proof_required,              label: "Proof type" },
  split_per_version: { condition: s => (s.number_of_versions ?? 0) > 1, label: "Version split" },
};

export function getMissingFields(spec: Partial<ExtractedSpec>): Array<{ key: string; label: string }> {
  const missing: Array<{ key: string; label: string }> = [];
  const isNonPrint = spec.category_of_work && spec.category_of_work !== "Print";
  if (isNonPrint) return missing; // non-print specs don't need print fields

  for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
    const val = spec[key as keyof ExtractedSpec];
    if (val === null || val === undefined || val === "") missing.push({ key, label });
  }
  if (spec.delivery_required && (!spec.delivery_locations || spec.delivery_locations.length === 0)) {
    missing.push({ key: "delivery_location_count", label: "Delivery location details" });
  }
  for (const [key, { condition, label }] of Object.entries(CONDITIONAL_REQUIRED)) {
    if (condition(spec)) {
      const val = spec[key as keyof ExtractedSpec];
      if (val === null || val === undefined || val === "") missing.push({ key, label });
    }
  }
  return missing;
}

// ── RAG FIELD STATUS ──────────────────────────────────────────────────────
// Derives a RAG status for every displayed field from:
//   - confidence_flags (amber if flagged)
//   - field value presence (red if required+empty, empty if optional+empty)
//   - field_status override from AI extraction (green = extracted confidently)
const ALWAYS_REQUIRED = new Set([
  "job_reference","category_of_work","product_type","quantity",
  "flat_size_length","flat_size_width","pages",
  "substrate_weight_gsm","sides_printed","delivery_region",
]);

export function deriveFieldStatus(
  spec: Partial<ExtractedSpec>,
  key: string
): FieldStatus {
  // Check AI-provided status first
  const aiStatus = spec.field_status?.[key];
  if (aiStatus) return aiStatus;

  const val = spec[key as keyof ExtractedSpec];
  const hasValue = val !== null && val !== undefined && val !== "" && val !== false;
  const flagged = spec.confidence_flags?.some(f =>
    f.toLowerCase().includes(key.replace(/_/g, " ").toLowerCase()) ||
    f.toLowerCase().includes(key.replace(/_/g, "").toLowerCase())
  ) ?? false;

  if (flagged) return hasValue ? "amber" : "red";
  if (!hasValue && ALWAYS_REQUIRED.has(key)) return "red";
  if (!hasValue) return "empty";
  return "green";
}

// ── MTIVITY PROMPT ───────────────────────────────────────────────────────
export function buildMtivityPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");
  return `You are a print quoting specialist for Azure Communications, an Irish print company.
This is a structured Mtivity/Caudit portal spec. Extract every field precisely.
Return ONLY valid JSON — no preamble, no markdown fences.

PRINTLOGIC JOB TYPE MAPPING:
"Leaflet/Stuffer"→"Leaflets", "Booklet"→"Brochure Body", "Brochure"→"Brochure Body",
"Poster"→"Large Format Posters", "Business Card"→"Business Cards",
"Postcard"→"Cards / Postcards", "Menu"→null (unmapped), any other→null
Known types: ${jobTypes}

SUBSTRATE CONFLICT: If substrate_name contains "Silk" AND comments mention
["write on","writable","wipeable","non-gloss","anti-microbial"]
→ substrate_conflict:true, substrate_conflict_detail: explain contradiction
Also populate substrate_special_requirements with the exact text.

SCORING RULE: weight >= 170gsm → scoring_auto_applied:true, add Scoring to finishing_items,
finishing_required:true.

FIELD STATUS: For every key in field_status, set:
  "green"  if you extracted it confidently from explicit spec text
  "amber"  if you inferred or guessed it (e.g. default applied, ambiguous text)
  "red"    if required but absent from the spec
  "empty"  if not required and absent

Return this exact JSON (all fields, null for absent, false for absent booleans):
{
  "source_format": "mtivity",
  "cannot_quote": false,
  "cannot_quote_reason": null,
  "substrate_conflict": false,
  "substrate_conflict_detail": null,

  "job_reference": "spec ID e.g. 741086",
  "spec_name": "spec title",
  "customer_name": null,
  "created_by": "Created By field",
  "created_date": "Created On field",
  "unit_of_measure": "Each",
  "life_expectancy": "Temporary or Permanent",
  "description": "Description field",
  "spec_type": "Standard",
  "form_type": "2D Specification V2",

  "category_of_work": "Print",
  "product_type": "mapped PrintLogic type or null",
  "mtivity_product_type": "raw Mtivity Product Type",
  "finished_product_style": "Flat or Folded or Bound",

  "measurement_unit": "mm",
  "flat_size_length": null,
  "flat_size_width": null,
  "finished_size_length": null,
  "finished_size_width": null,
  "pages": null,

  "substrate_type": "copy of substrates[0].substrate_name",
  "substrate_weight_gsm": null,
  "sustainability": "copy of substrates[0].sustainability_accreditation",
  "substrate_special_requirements": "any wipeable/clinical/non-gloss requirements",
  "main_substrate": "Paper",

  "substrates": [
    {
      "used_as": "SS1:Used as",
      "substrate_type": "Paper",
      "substrate_name": "SS1:Substrate Name - Paper",
      "sustainability_accreditation": "SS1:Sustainable Material Accreditation",
      "measured_by": "Weight",
      "weight": null,
      "weight_unit": "gsm",
      "thickness": null,
      "thickness_unit": "",
      "section_page_count": null,
      "substrate_comments": "SS1:Substrate Comments",
      "special_requirements": "wipeable/clinical/non-gloss notes",
      "ink_coverage": "SS1:Ink Coverage",
      "artwork_variation": "SS1:Art field e.g. Different Art",
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

  "sides_printed": "1 or 2",
  "ink_spec": "Same both sides or Different each side",
  "artwork_variation": "Different Art or Same Art",
  "artwork_status": "New or Repeat",
  "lighting_required": false,
  "electronics_required": false,

  "finishing_required": false,
  "finishing_items": [],
  "scoring_auto_applied": false,

  "trim_to_size": false,
  "folded_or_bound": "No or Folded or Bound",
  "fold_type": null,
  "binding_type": null,
  "binding_comments": null,

  "proof_required": false,
  "proof_type": null,

  "bundling_required": false,
  "bundling_type": null,
  "bundle_quantity": null,
  "inner_packaging_required": false,
  "inner_packaging_material": null,
  "outer_packaging_required": false,
  "outer_packaging_material": null,
  "inner_and_outer_packaging_required": false,
  "max_outer_packaging_size_required": false,
  "max_outer_packaging_length": null,
  "max_outer_packaging_width": null,
  "max_outer_packaging_height": null,
  "max_outer_packaging_unit": "mm",
  "pack_in": null,

  "delivery_location_count": null,
  "delivery_region": "ROI or Dublin or UK or International or null",
  "delivery_instructions": "delivery notes from Description field",
  "delivery_description": null,
  "delivery_required": false,
  "delivery_locations": [],

  "quantity": null,
  "number_of_versions": null,
  "split_per_version": null,
  "calculation_method": "Quantity",

  "confidence_flags": [],
  "special_notes": null,

  "field_status": {
    "job_reference": "green",
    "category_of_work": "green",
    "product_type": "green or amber or red",
    "quantity": "green or red",
    "flat_size_length": "green",
    "flat_size_width": "green",
    "finished_size_length": "green or empty",
    "finished_size_width": "green or empty",
    "pages": "green or amber",
    "substrate_weight_gsm": "green",
    "substrate_special_requirements": "green or empty",
    "sides_printed": "green",
    "ink_spec": "green or amber",
    "delivery_region": "green or amber or red",
    "delivery_location_count": "green or red",
    "quantity_versions": "green or empty",
    "proof_required": "green",
    "bundling_required": "green"
  }
}`;
}

// ── GENERIC PROMPT ────────────────────────────────────────────────────────
export function buildPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");
  return `You are a print quoting specialist for Azure Communications, an Irish print company.
Analyse this RFQ and extract all fields. Known job types: ${jobTypes}.
Set absent fields to null, absent booleans to false. Return ONLY valid JSON — no preamble, no fences.

{
  "source_format": "generic",
  "cannot_quote": false, "cannot_quote_reason": null,
  "substrate_conflict": false, "substrate_conflict_detail": null,
  "job_reference": null, "spec_name": null, "customer_name": null,
  "created_by": null, "created_date": null,
  "unit_of_measure": "Each", "life_expectancy": null,
  "description": null, "spec_type": null, "form_type": null,
  "category_of_work": "Print", "product_type": null,
  "mtivity_product_type": null, "finished_product_style": null,
  "measurement_unit": "mm",
  "flat_size_length": null, "flat_size_width": null,
  "finished_size_length": null, "finished_size_width": null, "pages": null,
  "substrate_type": null, "substrate_weight_gsm": null,
  "sustainability": null, "substrate_special_requirements": null,
  "main_substrate": "Paper",
  "substrates": [{
    "used_as": "", "substrate_type": "Paper", "substrate_name": "",
    "sustainability_accreditation": "", "measured_by": "Weight",
    "weight": null, "weight_unit": "gsm",
    "thickness": null, "thickness_unit": "",
    "section_page_count": null, "substrate_comments": "",
    "special_requirements": "", "ink_coverage": "", "artwork_variation": "",
    "sides": [{
      "side_number": 1, "four_colour_process": true,
      "spot_colours_required": false, "number_of_spot_colours": null,
      "coating_required": false, "number_of_coatings": null,
      "coatings": [], "side_comments": ""
    }]
  }],
  "sides_printed": "2",
  "ink_spec": null,
  "artwork_variation": null,
  "artwork_status": "New",
  "lighting_required": false, "electronics_required": false,
  "finishing_required": false, "finishing_items": [], "scoring_auto_applied": false,
  "trim_to_size": true,
  "folded_or_bound": "No", "fold_type": null, "binding_type": null, "binding_comments": null,
  "proof_required": false, "proof_type": null,
  "bundling_required": false, "bundling_type": null, "bundle_quantity": null,
  "inner_packaging_required": false, "inner_packaging_material": null,
  "outer_packaging_required": false, "outer_packaging_material": null,
  "inner_and_outer_packaging_required": false,
  "max_outer_packaging_size_required": false,
  "max_outer_packaging_length": null, "max_outer_packaging_width": null,
  "max_outer_packaging_height": null, "max_outer_packaging_unit": "mm",
  "pack_in": null,
  "delivery_location_count": null,
  "delivery_region": null, "delivery_instructions": null, "delivery_description": null,
  "delivery_required": false, "delivery_locations": [],
  "quantity": null, "number_of_versions": 1, "split_per_version": null,
  "calculation_method": "Quantity",
  "confidence_flags": [], "special_notes": null,
  "field_status": {}
}`;
}

// ── POST-EXTRACTION VALIDATION ────────────────────────────────────────────
export function validateExtractedSpec(spec: Partial<ExtractedSpec>): Partial<ExtractedSpec> {
  const updated = { ...spec };
  const flags = [...(spec.confidence_flags || [])];
  const gsm = spec.substrate_weight_gsm ?? spec.substrates?.[0]?.weight ?? 0;

  // Sync new packaging booleans from combined field (backward compat)
  if (spec.inner_and_outer_packaging_required && !spec.inner_packaging_required) {
    updated.inner_packaging_required = true;
    updated.outer_packaging_required = true;
  }
  // Sync combined from new booleans
  if (spec.inner_packaging_required || spec.outer_packaging_required) {
    updated.inner_and_outer_packaging_required = true;
  }

  // Sync delivery_instructions from description
  if (!updated.delivery_instructions && updated.delivery_description) {
    updated.delivery_instructions = updated.delivery_description;
  }

  // Scoring rule: 170gsm+ auto-adds Scoring
  if (gsm >= 170 && !spec.scoring_auto_applied) {
    const items = [...(spec.finishing_items || [])];
    if (!items.some(f => f.finishing_type.toLowerCase().includes("scor"))) {
      items.push({ finishing_type: "Scoring", finishing_area: "Overall", comments: "Auto: Aaron 170gsm+ rule" });
      updated.finishing_items = items;
      updated.finishing_required = true;
      updated.scoring_auto_applied = true;
    }
  }

  // Default number_of_versions to 1 if not set
  if (updated.number_of_versions === null || updated.number_of_versions === undefined) {
    updated.number_of_versions = 1;
  }

  // Delivery defaults:
  // - delivery_location_count defaults to 1 if not stated (amber)
  // - no delivery_region → default to ROI (outside Dublin), apply overnight, mark amber
  // - non-Dublin region → overnight instruction auto-applied
  // - Dublin → left open for human selection
  if (!updated.delivery_location_count) {
    updated.delivery_location_count = 1;
    if (updated.field_status) updated.field_status["delivery_location_count"] = "amber";
  }
  if (!updated.delivery_region) {
    // No delivery region stated — default to outside Dublin (safer/more expensive default)
    updated.delivery_region = "ROI";
    updated.delivery_instructions = updated.delivery_instructions || "Overnight parcel delivery";
    if (updated.field_status) {
      updated.field_status["delivery_region"] = "amber";
      updated.field_status["delivery_instructions"] = "amber";
    }
    // Add to confidence flags so reviewer sees it
    flags.push("delivery_region — not stated, defaulted to ROI / overnight (€10). Confirm with customer.");
  } else if (updated.delivery_region !== "Dublin" && !updated.delivery_instructions) {
    updated.delivery_instructions = "Overnight parcel delivery";
  }

  // Freight-only spec handling (Spec 3 feedback):
  // If cannot_quote but it's a multi-location delivery, allow it as a delivery-only quote
  // by estimating overnight rate × location count
  if (updated.cannot_quote && updated.category_of_work === "Freight - General") {
    const locs = updated.delivery_location_count ?? 1;
    updated.cannot_quote = false;
    updated.cannot_quote_reason = null;
    updated.delivery_required = true;
    updated.delivery_location_count = locs;
    // Auto-set delivery description with overnight rate calculation
    if (!updated.delivery_instructions) {
      updated.delivery_instructions = `${locs} location${locs > 1 ? "s" : ""} × overnight parcel €10 = €${locs * 10} estimated delivery`;
    }
    if (updated.field_status) {
      updated.field_status["delivery_location_count"] = "amber";
      updated.field_status["delivery_instructions"] = "amber";
    }
    // Mark as delivery-only so Item Details renders correctly
    updated.product_type = "Delivery Only";
    updated.special_notes = (updated.special_notes ? updated.special_notes + " · " : "") +
      "Freight/delivery-only RFQ — no print component. Overnight parcel rate applied per location.";
  }

  // Build / augment field_status with derived statuses for anything AI didn't cover
  const status: FieldStatusMap = { ...(spec.field_status ?? {}) };
  const allKeys: (keyof ExtractedSpec)[] = [
    "job_reference","category_of_work","product_type","quantity",
    "flat_size_length","flat_size_width","finished_size_length","finished_size_width","pages",
    "substrate_weight_gsm","substrate_special_requirements","sustainability",
    "sides_printed","ink_spec","artwork_variation","artwork_status",
    "delivery_region","delivery_location_count","delivery_instructions",
    "number_of_versions","split_per_version","calculation_method",
    "proof_required","proof_type","bundling_required","bundling_type","bundle_quantity",
    "inner_packaging_required","outer_packaging_required",
    "finishing_required","trim_to_size","folded_or_bound","fold_type","binding_type",
  ];
  for (const k of allKeys) {
    if (!status[k]) {
      // Import deriveFieldStatus logic inline to avoid circular ref
      const val = updated[k];
      const hasValue = val !== null && val !== undefined && val !== "" && val !== false && val !== 0;
      const flagged = flags.some(f => f.toLowerCase().includes(String(k).replace(/_/g, " ")));
      const required = ALWAYS_REQUIRED_SET.has(k as string);
      if (flagged) status[k] = hasValue ? "amber" : "red";
      else if (!hasValue && required) status[k] = "red";
      else if (!hasValue) status[k] = "empty";
      else status[k] = "green";
    }
  }
  updated.field_status = status;

  // Flag missing required fields
  const missing = getMissingFields(updated);
  for (const { label } of missing) {
    if (!flags.some(f => f.toLowerCase().includes(label.toLowerCase()))) {
      flags.push(`${label} — not stated, clarification required`);
    }
  }

  // When substrate conflict is flagged, mark the conflicting fields red
  // so the reviewer knows exactly what to manually select/override
  if (updated.substrate_conflict) {
    if (!updated.field_status) updated.field_status = {};
    // Mark the top-level substrate fields that need manual resolution
    updated.field_status["substrate_type"] = "red";
    updated.field_status["substrate_weight_gsm"] = "red";
    updated.field_status["substrate_special_requirements"] = "red";
    // Mark the PrintLogic auto-match as blocked
    updated.field_status["sustainability"] = "amber";
    // Ensure the conflict detail is clear and actionable
    if (!updated.substrate_conflict_detail) {
      updated.substrate_conflict_detail =
        "Substrate conflict detected. Review the substrate type and coating selections below and select the correct combination manually.";
    }
  }

  updated.confidence_flags = flags;
  return updated;
}

const ALWAYS_REQUIRED_SET = new Set([
  "job_reference","category_of_work","product_type","quantity",
  "flat_size_length","flat_size_width","pages",
  "substrate_weight_gsm","sides_printed",
]);

// ── MATERIAL LOOKUP ───────────────────────────────────────────────────────
export function lookupMaterial(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): (MaterialEntry & { matched: boolean }) | null {
  if (!spec) return null;
  const weight = spec.substrate_weight_gsm ?? spec.substrates?.[0]?.weight ?? null;
  if (!weight) return null;
  const rawType = spec.substrate_type ?? spec.substrates?.[0]?.substrate_name ?? "";
  const type = rawType.toLowerCase();
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
  const region = (spec?.delivery_region ?? "").toLowerCase();
  const firstLoc = spec?.delivery_locations?.[0];
  const city = (firstLoc?.city ?? firstLoc?.county ?? spec?.delivery_instructions ?? "").toLowerCase();
  const isDublin = region === "dublin" || city.includes("dublin") || /\bd\d{1,2}\b/.test(city);
  const multi = (spec?.delivery_location_count ?? 0) > 1;
  const active = admin.deliveryRules.filter(r => r.active);
  if (multi) return active.find(r => r.courier === "Overnight Parcel") || active[0] || null;
  return active.find(r => isDublin ? r.courier === "Small Van" : r.courier === "Overnight Parcel") || active[0] || null;
}

// ── CLARIFICATION EMAIL DRAFT ─────────────────────────────────────────────
export function draftClarificationEmail(
  spec: Partial<ExtractedSpec>,
  missingFields: Array<{ key: string; label: string }>
): { subject: string; body: string } {
  const ref = spec.job_reference ?? spec.spec_name ?? "your recent spec";
  const firstName = spec.created_by?.split(" ")[0] ?? "";
  const fieldList = missingFields.map(f => `  • ${f.label}`).join("\n");
  const subject = `Spec clarification required — ${ref}`;
  const body = `Hi${firstName ? " " + firstName : ""},

Thank you for sending through the spec${spec.job_reference ? ` (ref: ${spec.job_reference})` : ""}.

To complete the quote we need the following:

${fieldList}

Could you please come back to us with the above at your earliest convenience? We will have a price back to you promptly.

Many thanks,
Azure Communications
quotes@azurecomm.ie`;
  return { subject, body };
}

// ── ITEM DETAILS GENERATOR (Aaron's format) ───────────────────────────────
export function generateItemDetails(spec: Partial<ExtractedSpec> | null): string {
  if (!spec) return "";
  const lines: string[] = [];
  const sub0   = spec.substrates?.[0];
  const weight = spec.substrate_weight_gsm ?? sub0?.weight ?? null;
  const subName = spec.substrate_type ?? sub0?.substrate_name ?? "";
  const substrate = [weight ? `${weight}gsm` : null, subName].filter(Boolean).join(" ");
  const fnl = spec.finished_size_length, fnw = spec.finished_size_width;
  const fl = spec.flat_size_length, fw = spec.flat_size_width;
  const size = fnl && fnw ? `${fnl}x${fnw}mm` : fl && fw ? `${fl}x${fw}mm` : "";
  const pages = spec.pages ? `${spec.pages}pp ` : "";
  const sideCount = Number(spec.sides_printed ?? (sub0?.sides?.length ?? 2));
  const sides = sideCount === 1 ? "printed 1 side" : "printed both sides";

  // Line 1: size — sides on stock
  if (size || substrate) lines.push(`${pages}${size} — ${sides} on ${substrate}`.trim());

  // Coatings per side
  sub0?.sides?.forEach(side => {
    side.coatings?.forEach(c => {
      if (c.coating_type && c.coating_type !== "None") {
        lines.push(side.side_number === 1 ? c.coating_type : `Side ${side.side_number}: ${c.coating_type}`);
      }
    });
  });

  // Fold / binding
  if (spec.folded_or_bound === "Folded" && spec.fold_type) lines.push(spec.fold_type);
  if (spec.folded_or_bound === "Bound" && spec.binding_type) lines.push(spec.binding_type);

  // Finishing items — each on own line
  spec.finishing_items?.forEach(f => { if (f.finishing_type) lines.push(f.finishing_type); });

  // Versions note
  const versions = spec.number_of_versions ?? 1;
  if (versions > 1) {
    const split = spec.split_per_version ? ` (${spec.split_per_version} split)` : "";
    lines.push(`${versions} versions${split}`);
  }

  // Bundling
  if (spec.bundling_required && spec.bundling_type) {
    lines.push(spec.bundling_type + (spec.bundle_quantity ? ` in ${spec.bundle_quantity}s` : ""));
  }

  // Delivery — last line
  if (spec.delivery_locations && spec.delivery_locations.length > 0) {
    const loc = spec.delivery_locations[0];
    const dest = [loc.city, loc.county].filter(Boolean).join(", ") || loc.address || spec.delivery_instructions || "";
    const extra = (spec.delivery_location_count ?? 1) > 1 ? ` + ${(spec.delivery_location_count ?? 1) - 1} more` : "";
    if (dest) lines.push(`Delivered to ${dest}${extra}`);
  } else if (spec.delivery_instructions || spec.delivery_region) {
    lines.push(`Delivery: ${spec.delivery_region ?? ""}${spec.delivery_instructions ? " — " + spec.delivery_instructions : ""}`);
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
