"use client";
import { B } from "@/lib/types";
import type { ExtractedSpec, AdminConfig, MaterialEntry, JobTypeDefault, DeliveryRule } from "@/lib/types";

interface Props {
  spec: Partial<ExtractedSpec>;
  admin: AdminConfig;
  plMaterial: (MaterialEntry & { matched: boolean }) | null;
  jobDefaults: JobTypeDefault | null;
  deliveryRule: DeliveryRule | null;
}

export default function ApprovedChecklist({ spec, admin, plMaterial, jobDefaults, deliveryRule }: Props) {
  const size = spec.finished_size_length && spec.finished_size_width
    ? `${spec.finished_size_length}x${spec.finished_size_width}mm`
    : spec.flat_size_length && spec.flat_size_width
    ? `${spec.flat_size_length}x${spec.flat_size_width}mm flat`
    : "[confirm]";

  const steps = [
    `Find customer: ${spec.customer_name || "[check email]"}`,
    `Create Costed Quote`,
    `Job type: ${spec.product_type || "[confirm]"}`,
    `Quantity: ${spec.quantity || "[confirm]"}`,
    `Stock: ${plMaterial?.printlogic || "[Aaron to select]"}`,
    `Size: ${size} — Sheet: ${admin.defaultSheetSize}`,
    `Sides: ${spec.sides_printed || jobDefaults?.sides || "[confirm]"}`,
    `Apply finishes (per Aaron's rules)`,
    `Delivery: ${deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : "[confirm]"}`,
    `Paste item details → Calculate → Review margin → Send`,
  ];
  return (
    <div style={{ background: B.white, border: `1px solid ${B.azureMid}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: B.navy, marginBottom: 12, fontSize: 15 }}>✓ Approved — PrintLogic Steps</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < steps.length - 1 ? `1px solid ${B.grey}` : "none", fontSize: 13 }}>
          <div style={{ color: B.azure, fontWeight: 700, minWidth: 20 }}>{i + 1}.</div>
          <div>{s}</div>
        </div>
      ))}
    </div>
  );
}
