"use client";
import { B } from "@/lib/types";
import type { ExtractedSpec } from "@/lib/types";

const GROUPS = [
  { label: "Job", fields: [{ key: "job_reference", label: "Job Reference" }, { key: "customer_name", label: "Customer" }, { key: "product_type", label: "Product Type" }, { key: "quantity", label: "Quantity" }] },
  { label: "Dimensions", fields: [{ key: "flat_size_mm", label: "Flat Size (mm)" }, { key: "finished_size_mm", label: "Finished Size (mm)" }, { key: "pages", label: "Pages" }] },
  { label: "Substrate", fields: [{ key: "substrate_type", label: "Substrate Type" }, { key: "substrate_weight_gsm", label: "Weight (gsm)" }, { key: "sustainability", label: "Sustainability" }] },
  { label: "Print", fields: [{ key: "sides_printed", label: "Sides Printed" }, { key: "colours_side_1", label: "Colours — Side 1" }, { key: "colours_side_2", label: "Colours — Side 2" }] },
  { label: "Coating & Finishing", fields: [{ key: "coating_side_1", label: "Coating — Side 1" }, { key: "coating_side_2", label: "Coating — Side 2" }, { key: "fold_type", label: "Fold Type" }, { key: "binding", label: "Binding" }, { key: "finishing_other", label: "Other Finishing" }] },
  { label: "Packaging & Delivery", fields: [{ key: "bundling", label: "Bundling" }, { key: "packaging", label: "Packaging" }, { key: "delivery_locations", label: "Delivery Locations" }, { key: "delivery_address", label: "Delivery Address" }] },
  { label: "Artwork & Proof", fields: [{ key: "proof_required", label: "Proof Required" }, { key: "artwork_status", label: "Artwork Status" }] },
  { label: "Notes", fields: [{ key: "special_notes", label: "Special Notes" }] },
];

interface Props {
  spec: Partial<ExtractedSpec>;
  flags: string[];
  onUpdate: (key: string, val: string) => void;
}

export default function FieldGroups({ spec, flags, onUpdate }: Props) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", borderRadius: 6, boxSizing: "border-box",
    border: `1px solid ${B.grey}`, fontSize: 13, fontFamily: "Roboto, sans-serif", color: B.dark,
  };
  return (
    <div style={{ background: B.white, borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, borderBottom: `1px solid ${B.grey}`, paddingBottom: 10 }}>
        Extracted Fields — Edit to Correct
      </div>
      {GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.azure, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${B.azureMid}`, paddingBottom: 5, marginBottom: 10 }}>
            {group.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
            {group.fields.map(({ key, label }) => {
              const val = spec[key as keyof ExtractedSpec];
              const flagged = flags.some(f => f.toLowerCase().replace(/\s/g, "").includes(key.replace(/_/g, "")));
              return (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: flagged ? B.amber : B.muted, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label} {flagged && "⚠"}
                  </label>
                  <input
                    value={val === null || val === undefined ? "" : String(val)}
                    onChange={e => onUpdate(key, e.target.value)}
                    style={{ ...inputStyle, border: `1px solid ${flagged ? B.amberBorder : B.grey}`, background: !val ? B.offWhite : B.white }}
                    placeholder="Not specified"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
