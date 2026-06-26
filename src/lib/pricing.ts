// ── AZURE COMMUNICATIONS PRICING ENGINE ──────────────────────────────────
// Source: Quoting_Process_04_06_26.xlsx — Material Lookup, Job Types & Defaults, Delivery Rules
// Confirmed by Aaron Herbert. Unconfirmed rows marked with confirmed: false.
// Markup = 1.25 (25%) applied at customer level in PrintLogic — default used here.

import type { ExtractedSpec } from "./types";

export interface PriceBreakdown {
  stock_cost:       number | null;  // paper/substrate cost estimate
  print_cost:       number | null;  // printing cost estimate
  finishing_cost:   number | null;  // finishing items total
  delivery_cost:    number | null;  // delivery charge
  subtotal_ex_vat:  number | null;  // sum before markup
  markup_pct:       number;         // e.g. 25
  quoted_price:     number | null;  // subtotal × (1 + markup/100)
  vat_rate:         number;         // 23% standard Irish VAT
  vat_amount:       number | null;
  total_inc_vat:    number | null;
  price_source:     "estimated" | "printlogic" | "manual";
  notes:            string[];
}

// ── DELIVERY PRICING (confirmed by Aaron) ────────────────────────────────
export const DELIVERY_PRICES: Record<string, number> = {
  "Small Van":         35,   // Dublin — confirmed
  "Overnight Parcel":  10,   // Outside Dublin — confirmed
  "Pallet":            75,   // High volume — confirmed price, rule outstanding
  "Truck":            150,   // Very large — confirmed price, rule outstanding
};

// ── FINISHING COST ESTIMATES (per unit) ─────────────────────────────────
// These are indicative — actual prices come from PrintLogic calculation.
// Used for in-app estimate display only.
const FINISHING_COSTS: Record<string, number> = {
  "Scoring":                   0.02,
  "Folding":                   0.03,
  "Guillotining":              0.01,
  "Saddle Stitch":             0.04,
  "Perfect Bound":             0.08,
  "Gloss Laminate":            0.05,
  "Matt Laminate":             0.05,
  "Soft Touch Laminate":       0.07,
  "Spot UV":                   0.06,
  "Die Cut":                   0.04,
  "Perforation":               0.02,
  "Tabbing":                   0.03,
  "Shrink Wrap":               0.02,
  "Large Format Cutting":      0.05,
};

// ── STOCK COST ESTIMATES (per SRA3 sheet) ───────────────────────────────
// Indicative only — actual stock pricing comes from PrintLogic.
// Costs represent approximate EBB/Antalis trade prices per sheet.
const STOCK_COSTS: Record<string, number> = {
  // Coated silk (MAGNO SATIN) — EBB
  "130gsm silk":   0.05,
  "150gsm silk":   0.06,
  "170gsm silk":   0.07,
  "200gsm silk":   0.09,
  "250gsm silk":   0.11,
  "300gsm silk":   0.14,
  "350gsm silk":   0.17,
  "400gsm silk":   0.20,
  // Digital silk (Magno Digital)
  "100gsm silk":   0.04,
  "115gsm silk":   0.045,
  // Uncoated (SOPORSET) — EBB
  "80gsm uncoated":  0.03,
  "100gsm uncoated": 0.04,
  "120gsm uncoated": 0.045,
  "170gsm uncoated": 0.06,
  "250gsm uncoated": 0.09,
  "300gsm uncoated": 0.12,
  "350gsm uncoated": 0.15,
  // Matt (Novatech) — Antalis
  "115gsm matt":   0.06,
  "170gsm matt":   0.08,
  "250gsm matt":   0.12,
  "300gsm matt":   0.15,
  "350gsm matt":   0.18,
};

// ── PRINT COST ESTIMATES (per SRA3 sheet, both sides, full colour) ───────
// Indicative digital print costs. Actual from PrintLogic.
function estimatePrintCostPerSheet(qty: number): number {
  // Digital print: cost per sheet decreases with volume
  if (qty <= 100)  return 0.35;
  if (qty <= 500)  return 0.22;
  if (qty <= 1000) return 0.15;
  if (qty <= 2500) return 0.10;
  if (qty <= 5000) return 0.07;
  return 0.05;
}

// ── SHEETS REQUIRED ──────────────────────────────────────────────────────
// Most jobs: 1 sheet = 1 finished item (leaflets, cards, etc.)
// Booklets: qty × (pages/4) sheets (each SRA3 gives 4pp)
function sheetsRequired(spec: Partial<ExtractedSpec>): number {
  const qty = spec.quantity ?? 1;
  const pages = spec.pages ?? 2;
  // Booklets / brochures: pages / 4 sheets each (SRA3 gives 4pp when folded)
  const isBooklet = (spec.product_type ?? "").toLowerCase().includes("booklet")
    || (spec.product_type ?? "").toLowerCase().includes("brochure body");
  if (isBooklet && pages > 2) return qty * Math.ceil(pages / 4);
  return qty;
}

// ── MAIN PRICING FUNCTION ─────────────────────────────────────────────────
export function estimatePrice(
  spec: Partial<ExtractedSpec>,
  deliveryCourier: string | null,
  markupPct = 25
): PriceBreakdown {
  const notes: string[] = [];
  const qty = spec.quantity ?? 0;

  if (!qty) {
    return {
      stock_cost: null, print_cost: null, finishing_cost: null,
      delivery_cost: null, subtotal_ex_vat: null,
      markup_pct: markupPct, quoted_price: null,
      vat_rate: 23, vat_amount: null, total_inc_vat: null,
      price_source: "estimated",
      notes: ["Quantity required to calculate price"],
    };
  }

  // Stock cost
  const gsm = spec.substrate_weight_gsm ?? spec.substrates?.[0]?.weight ?? null;
  const subType = (spec.substrate_type ?? spec.substrates?.[0]?.substrate_name ?? "").toLowerCase();
  const finish = subType.includes("matt") ? "matt" : subType.includes("uncoated") ? "uncoated" : "silk";
  const stockKey = gsm ? `${gsm}gsm ${finish}` : null;
  const stockCostPerSheet = stockKey ? (STOCK_COSTS[stockKey] ?? null) : null;
  const sheets = sheetsRequired(spec);
  const stock_cost = stockCostPerSheet !== null ? stockCostPerSheet * sheets : null;
  if (!stockCostPerSheet) notes.push("Stock cost: awaiting PrintLogic (stock not in lookup table)");

  // Print cost
  const printCostPerSheet = estimatePrintCostPerSheet(qty);
  const sides = Number(spec.sides_printed ?? 2);
  const print_cost = printCostPerSheet * sheets * (sides === 1 ? 0.7 : 1);

  // Finishing cost
  const finishingItems = spec.finishing_items ?? [];
  let finishing_cost = 0;
  for (const f of finishingItems) {
    const unitCost = FINISHING_COSTS[f.finishing_type] ?? null;
    if (unitCost !== null) {
      finishing_cost += unitCost * qty;
    } else {
      notes.push(`${f.finishing_type}: finishing cost estimate not available`);
    }
  }
  if (finishingItems.length === 0) finishing_cost = 0;

  // Delivery cost
  const locationCount = spec.delivery_location_count ?? 1;
  const courier = deliveryCourier ?? (spec.delivery_region === "Dublin" ? "Small Van" : "Overnight Parcel");
  const deliveryPerLocation = DELIVERY_PRICES[courier] ?? 10;
  const delivery_cost = deliveryPerLocation * locationCount;

  // Subtotal & markup
  const subtotal_ex_vat = (stock_cost ?? 0) + print_cost + finishing_cost + delivery_cost;
  const quoted_price = subtotal_ex_vat * (1 + markupPct / 100);
  const vat_amount = quoted_price * 0.23;
  const total_inc_vat = quoted_price + vat_amount;

  notes.push("Estimated price — confirm with PrintLogic before sending to customer");

  return {
    stock_cost,
    print_cost,
    finishing_cost,
    delivery_cost,
    subtotal_ex_vat,
    markup_pct: markupPct,
    quoted_price,
    vat_rate: 23,
    vat_amount,
    total_inc_vat,
    price_source: "estimated",
    notes,
  };
}

export function formatEur(n: number | null): string {
  if (n === null) return "—";
  return "€" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
