import type { AdminConfig, ExtractedSpec, MaterialEntry, JobTypeDefault, DeliveryRule } from "./types";

export function buildPrompt(admin: AdminConfig): string {
  const jobTypes = admin.jobTypeDefaults.filter(j => j.active).map(j => j.jobType).join(", ");
  return `You are a print industry quoting specialist for Azure Communications, an Irish print company.
Analyse this RFQ document (PDF, email, or spec sheet) and extract all quoting-relevant fields.
Known job types: ${jobTypes}.
If a field is absent or ambiguous, set it to null.
Respond ONLY with valid JSON — no preamble, no markdown fences.

{
  "job_reference": "spec/job reference if present",
  "customer_name": "customer or portal name if identifiable",
  "product_type": "one of the known job types or best match",
  "quantity": number or null,
  "flat_size_mm": "e.g. 420 x 297",
  "finished_size_mm": "e.g. 297 x 210",
  "pages": number or null,
  "substrate_type": "e.g. Silk Coated, Matt Coated, Uncoated",
  "substrate_weight_gsm": number or null,
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
  "delivery_locations": number or null,
  "delivery_address": "city or county if stated",
  "special_notes": "any other quoting-relevant requirements",
  "confidence_flags": ["list fields where you are uncertain or the spec is ambiguous"]
}`;
}

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

export function getJobDefaults(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): JobTypeDefault | null {
  if (!spec?.product_type) return null;
  const pt = spec.product_type.toLowerCase();
  return admin.jobTypeDefaults.find(j => j.active && pt.includes(j.jobType.toLowerCase())) || null;
}

export function getDeliveryRule(
  spec: Partial<ExtractedSpec> | null,
  admin: AdminConfig
): DeliveryRule | null {
  const addr = (spec?.delivery_address || "").toLowerCase();
  const isDublin = addr.includes("dublin") || /\bd\d{1,2}\b/.test(addr);
  const active = admin.deliveryRules.filter(r => r.active);
  return active.find(r => isDublin ? r.courier === "Small Van" : r.courier === "Overnight Parcel") || active[0] || null;
}

export function generateItemDetails(spec: Partial<ExtractedSpec> | null): string {
  if (!spec) return "";
  const lines: string[] = [];
  const size = spec.finished_size_mm || spec.flat_size_mm || "";
  const pages = spec.pages ? `${spec.pages}pp ` : "";
  const weight = spec.substrate_weight_gsm ? `${spec.substrate_weight_gsm}gsm` : "";
  const substrate = [weight, spec.substrate_type].filter(Boolean).join(" ");
  const sides = spec.sides_printed === "Single sided" ? "printed 1 side" : "printed both sides";
  if (size || substrate) lines.push(`${pages}${size} — ${sides} on ${substrate}`.trim());
  if (spec.coating_side_1 && spec.coating_side_1 !== "None") lines.push(spec.coating_side_1);
  if (spec.coating_side_2 && !["None", "N/A"].includes(spec.coating_side_2 || "")) lines.push(`Side 2: ${spec.coating_side_2}`);
  if (spec.fold_type && spec.fold_type !== "None") lines.push(spec.fold_type);
  if (spec.binding && spec.binding !== "None") lines.push(spec.binding);
  if (spec.finishing_other && spec.finishing_other !== "None") lines.push(spec.finishing_other);
  if (spec.bundling && spec.bundling !== "None") lines.push(spec.bundling);
  if (spec.delivery_address) lines.push(`Delivered to ${spec.delivery_address}`);
  return lines.join("\n");
}

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
  return data.text;
}
