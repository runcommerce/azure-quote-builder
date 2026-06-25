// ── BRAND TOKENS (azurecomm.ie) ─────────────────────────────────────────
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

// ── SHARED TYPES ─────────────────────────────────────────────────────────
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
  // Source metadata
  source_format: "mtivity" | "generic" | null;
  cannot_quote: boolean | null;
  cannot_quote_reason: string | null;

  // Substrate conflict (e.g. silk vs writable)
  substrate_conflict: boolean | null;
  substrate_conflict_detail: string | null;

  // General
  job_reference: string | null;       // spec_id
  spec_name: string | null;
  customer_name: string | null;
  created_by: string | null;
  created_date: string | null;
  unit_of_measure: string | null;
  description: string | null;
  spec_type: string | null;
  form_type: string | null;

  // Item details
  category_of_work: string | null;
  product_type: string | null;
  mtivity_product_type: string | null; // raw label before PrintLogic mapping
  life_expectancy: string | null;

  // Product
  finished_product_style: string | null;  // Flat | Folded | Bound
  main_substrate: string | null;
  lighting_required: boolean;
  electronics_required: boolean;

  // Dimensions
  measurement_unit: string;
  flat_size_length: number | null;
  flat_size_width: number | null;
  finished_size_length: number | null;
  finished_size_width: number | null;
  pages: number | null;

  // Quantity (from description or delivery)
  quantity: number | null;

  // Substrates[] — repeatable group
  substrates: MtivitySubstrate[];

  // Convenience flat fields derived from substrates[0] for lookups
  substrate_type: string | null;
  substrate_weight_gsm: number | null;
  sustainability: string | null;
  sides_printed: string | null;

  // Prepress
  artwork_status: string | null;        // artwork field
  proof_required: boolean;
  proof_type: string | null;

  // Folding & binding — conditional
  trim_to_size: boolean;
  folded_or_bound: string | null;       // "Folded" | "Bound" | "No"
  fold_type: string | null;             // shown when folded_or_bound = "Folded"
  binding_type: string | null;          // shown when folded_or_bound = "Bound"
  binding_comments: string | null;

  // Finishing — conditional on finishing_required
  finishing_required: boolean;
  finishing_items: MtivityFinishingItem[];
  // Convenience: auto-populated scoring rule
  scoring_auto_applied: boolean;

  // Packaging
  inner_and_outer_packaging_required: boolean;
  inner_packaging_material: string | null;
  outer_packaging_material: string | null;
  max_outer_packaging_size_required: boolean;
  max_outer_packaging_length: number | null;  // shown when max_outer_packaging_size_required
  max_outer_packaging_width: number | null;
  max_outer_packaging_height: number | null;
  max_outer_packaging_unit: string;
  pack_in: string | null;
  bundling_required: boolean;
  bundling_type: string | null;         // shown when bundling_required
  bundle_quantity: number | null;       // shown when bundling_required

  // Delivery — conditional on delivery_required
  delivery_required: boolean;
  delivery_description: string | null;
  delivery_location_count: number | null;
  delivery_locations: MtivityDeliveryLocation[]; // shown when delivery_required

  // Calculation
  calculation_method: string | null;

  // Audit
  confidence_flags: string[];
  special_notes: string | null;
}
