// ── BRAND TOKENS ─────────────────────────────────────────────────────────
export const B = {
  navy:        "#183230",
  dark:        "#23282D",
  azure:       "#007EBB",
  azureLight:  "#E8F4FA",
  azureMid:    "#B3D9ED",
  white:       "#FFFFFF",
  offWhite:    "#F7F7F7",
  grey:        "#E6E6E6",
  greyDark:    "#404040",
  muted:       "#6B7280",
  amber:       "#ED7D31",
  amberLight:  "#FDF3E8",
  amberBorder: "#F5C27A",
  red:         "#C0392B",
  redLight:    "#FDECEA",
  green:       "#2D6A4F",
  greenLight:  "#E9F5F0",
} as const;

// ── ADMIN CONFIG TYPES ────────────────────────────────────────────────────
export interface PortalCustomer {
  id: string;
  name: string;
  inputType: "pdf" | "email" | "api";
  active: boolean;
}

export interface JobTypeDefault {
  jobType: string;
  stock: string;
  sides: string;
  delivery: string;
  active: boolean;
}

export interface MaterialEntry {
  key: string;
  printlogic: string;
  confirmed: boolean;
}

export interface DeliveryRule {
  condition: string;
  courier: string;
  price: string;
  active: boolean;
}

export interface AdminConfig {
  portalCustomers: PortalCustomer[];
  jobTypeDefaults: JobTypeDefault[];
  materialLookup: MaterialEntry[];
  deliveryRules: DeliveryRule[];
  followUp: {
    day2Email: boolean;
    day5RepAlert: boolean;
    highValueThreshold: number;
  };
  defaultMarkup: number;
  defaultSheetSize: string;
}

export interface ApiProviderConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  headerName?: string;
  headerPrefix?: string;
}

export interface ApiConfig {
  provider: "anthropic" | "openai" | "custom";
  anthropic: ApiProviderConfig;
  openai: ApiProviderConfig;
  custom: ApiProviderConfig;
}

// ── RAG FIELD STATUS ──────────────────────────────────────────────────────
// GREEN  = populated from spec with high confidence
// AMBER  = guessed / inferred / low confidence
// RED    = required but blank
// EMPTY  = not required, left blank (no colour)
export type FieldStatus = "green" | "amber" | "red" | "empty";

export interface FieldStatusMap {
  [fieldKey: string]: FieldStatus;
}

// ── MTIVITY NESTED TYPES ─────────────────────────────────────────────────

export interface MtivityCoating {
  coating_type: string;
  coating_area: string;
  comments: string;
}

export interface MtivitySide {
  side_number: number;
  four_colour_process: boolean;
  spot_colours_required: boolean;
  number_of_spot_colours: number | null;
  coating_required: boolean;
  number_of_coatings: number | null;
  coatings: MtivityCoating[];
  side_comments: string;
}

export interface MtivitySubstrate {
  used_as: string;
  substrate_type: string;
  substrate_name: string;
  sustainability_accreditation: string;
  measured_by: string;
  weight: number | null;
  weight_unit: string;
  thickness: number | null;
  thickness_unit: string;
  section_page_count: number | null;
  substrate_comments: string;
  special_requirements: string;   // NEW — non-gloss, wipeable, clinical use notes
  ink_coverage: string;
  artwork_variation: string;
  sides: MtivitySide[];
}

export interface MtivityFinishingItem {
  finishing_type: string;
  finishing_area: string;
  comments: string;
}

export interface MtivityDeliveryLocation {
  location_name: string;
  address: string;
  city: string;
  county: string;
  country: string;
  eircode: string;
  quantity: number | null;
  delivery_notes: string;
}

// ── EXTRACTED SPEC ────────────────────────────────────────────────────────

export interface ExtractedSpec {
  // ── Source metadata ────────────────────────────────────────────────────
  source_format: "mtivity" | "generic" | null;
  cannot_quote: boolean | null;
  cannot_quote_reason: string | null;
  substrate_conflict: boolean | null;
  substrate_conflict_detail: string | null;

  // ── 1. Job Header ──────────────────────────────────────────────────────
  job_reference: string | null;         // Quote / Job Reference
  spec_name: string | null;
  customer_name: string | null;         // Client Name
  created_by: string | null;
  created_date: string | null;
  unit_of_measure: string | null;       // always "Each"
  life_expectancy: string | null;       // Temporary | Permanent
  description: string | null;           // Description / Notes

  // internal Mtivity metadata (not shown as fields)
  spec_type: string | null;
  form_type: string | null;

  // ── 2. Product Classification ──────────────────────────────────────────
  category_of_work: string | null;      // Print | Freight | Custom Goods...
  product_type: string | null;          // PrintLogic job type (mapped)
  mtivity_product_type: string | null;  // raw Mtivity label pre-mapping
  finished_product_style: string | null; // Flat | Folded | Bound

  // ── 3. Dimensions — conditional on category_of_work = Print ───────────
  measurement_unit: string;
  flat_size_length: number | null;
  flat_size_width: number | null;
  finished_size_length: number | null;  // conditional: Folded or Bound
  finished_size_width: number | null;
  pages: number | null;                 // Total Page Count

  // ── 4. Substrate — conditional on category_of_work = Print ────────────
  substrate_type: string | null;        // convenience from substrates[0]
  substrate_weight_gsm: number | null;  // convenience from substrates[0]
  sustainability: string | null;        // convenience from substrates[0]
  substrate_special_requirements: string | null; // NEW — wipeable, non-gloss etc.
  main_substrate: string | null;        // Paper | Board | Synthetic

  // Substrates repeatable group
  substrates: MtivitySubstrate[];

  // ── 5. Ink & Artwork — conditional on category_of_work = Print ─────────
  sides_printed: string | null;         // "1" or "2" (number of sides)
  ink_spec: string | null;              // NEW — "Same both sides" | "Different each side"
  artwork_variation: string | null;     // NEW top-level — "Different Art" | "Same Art"
  artwork_status: string | null;        // New | Repeat | Customer Supplied
  lighting_required: boolean;
  electronics_required: boolean;

  // ── 6. Coatings & Finishing ─────────────────────────────────────────────
  // Coatings live in substrates[].sides[].coatings[]
  finishing_required: boolean;          // Additional Finishing Required
  finishing_items: MtivityFinishingItem[];
  scoring_auto_applied: boolean;

  // ── 7. Folding & Binding ─────────────────────────────────────────────────
  trim_to_size: boolean;
  folded_or_bound: string | null;       // No | Folded | Bound
  fold_type: string | null;             // conditional: folded_or_bound = Folded
  binding_type: string | null;          // conditional: folded_or_bound = Bound
  binding_comments: string | null;

  // ── 8. Proofing ───────────────────────────────────────────────────────────
  proof_required: boolean;
  proof_type: string | null;            // conditional: proof_required = true

  // ── 9. Packaging ──────────────────────────────────────────────────────────
  bundling_required: boolean;
  bundling_type: string | null;         // conditional: bundling_required
  bundle_quantity: number | null;       // conditional: bundling_required
  inner_packaging_required: boolean;    // NEW — split from combined
  inner_packaging_material: string | null; // conditional: inner_packaging_required
  outer_packaging_required: boolean;    // NEW — split from combined
  outer_packaging_material: string | null; // conditional: outer_packaging_required
  max_outer_packaging_size_required: boolean; // conditional: outer_packaging_required
  max_outer_packaging_length: number | null;
  max_outer_packaging_width: number | null;
  max_outer_packaging_height: number | null;
  max_outer_packaging_unit: string;
  pack_in: string | null;

  // kept for backward compat — derived from the two new booleans
  inner_and_outer_packaging_required: boolean;

  // ── 10. Delivery & Logistics — always shown ────────────────────────────
  delivery_location_count: number | null;
  delivery_region: string | null;       // NEW — ROI | Dublin | UK | International
  delivery_instructions: string | null; // NEW — renamed from delivery_description
  delivery_description: string | null;  // kept for compat
  delivery_required: boolean;           // kept for location group gate
  delivery_locations: MtivityDeliveryLocation[];

  // ── 11. Quantity & Versions — always shown ─────────────────────────────
  quantity: number | null;              // Total Quantity
  number_of_versions: number | null;    // NEW
  split_per_version: string | null;     // NEW — conditional: number_of_versions > 1
  calculation_method: string | null;    // Quantity | Fixed

  // ── Audit ──────────────────────────────────────────────────────────────
  confidence_flags: string[];
  special_notes: string | null;

  // ── RAG field status map ───────────────────────────────────────────────
  // Populated by AI alongside extracted values.
  // Keys match field names above. Values: "green" | "amber" | "red" | "empty"
  field_status: FieldStatusMap;
}

// ── SAVED QUOTE RECORD ────────────────────────────────────────────────────
// Stored in localStorage (key: "azure_iq_quotes") as JSON array.
// Status lifecycle: incomplete → sent → won | lost
export type QuoteStatus = "incomplete" | "sent" | "won" | "lost";

export interface QuoteRecord {
  id: string;
  status: QuoteStatus;
  spec_ref: string | null;
  spec_name: string | null;
  customer_name: string | null;
  product_type: string | null;
  quantity: number | null;
  delivery_region: string | null;
  date_submitted: string | null;
  date_issued: string | null;
  date_updated: string;
  spec: Partial<ExtractedSpec>;
  notes: string;
  // Pricing
  quoted_price: number | null;
  price_source: "estimated" | "printlogic" | "manual" | null;
  price_breakdown: import("./pricing").PriceBreakdown | null;
}
