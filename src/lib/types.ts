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

export interface ExtractedSpec {
  // ── Source metadata ───────────────────────────────────────────────────
  source_format: "mtivity" | "generic" | null;   // NEW — format detected
  cannot_quote:  boolean | null;                  // NEW — non-print flag
  cannot_quote_reason: string | null;             // NEW — reason if true
  // ── Substrate conflict flags ──────────────────────────────────────────
  substrate_conflict: boolean | null;             // NEW — e.g. silk but writable
  substrate_conflict_detail: string | null;       // NEW — human-readable explanation
  // ── Core fields ──────────────────────────────────────────────────────
  job_reference: string | null;
  customer_name: string | null;
  created_by: string | null;                      // NEW — Mtivity spec creator name
  created_date: string | null;                    // NEW — Mtivity created date
  product_type: string | null;
  mtivity_product_type: string | null;            // NEW — raw Mtivity label pre-mapping
  quantity: number | null;
  flat_size_mm: string | null;
  finished_size_mm: string | null;
  pages: number | null;
  substrate_type: string | null;
  substrate_weight_gsm: number | null;
  sustainability: string | null;
  sides_printed: string | null;
  colours_side_1: string | null;
  colours_side_2: string | null;
  coating_side_1: string | null;
  coating_side_2: string | null;
  fold_type: string | null;
  binding: string | null;
  finishing_other: string | null;
  bundling: string | null;
  packaging: string | null;
  proof_required: string | null;
  artwork_status: string | null;
  delivery_locations: number | null;
  delivery_address: string | null;
  special_notes: string | null;
  confidence_flags: string[];
}
