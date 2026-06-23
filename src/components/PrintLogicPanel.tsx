"use client";
import { B } from "@/lib/types";
import type { AdminConfig, ExtractedSpec, MaterialEntry, JobTypeDefault, DeliveryRule } from "@/lib/types";

interface Props {
  spec: Partial<ExtractedSpec>;
  admin: AdminConfig;
  plMaterial: (MaterialEntry & { matched: boolean }) | null;
  jobDefaults: JobTypeDefault | null;
  deliveryRule: DeliveryRule | null;
}

export default function PrintLogicPanel({ admin, plMaterial, jobDefaults, deliveryRule }: Props) {
  return (
    <div style={{ background: B.white, borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, borderBottom: `1px solid ${B.grey}`, paddingBottom: 10 }}>
        PrintLogic Auto-Match
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", marginBottom: 4 }}>Stock Name</div>
          <div style={{ fontSize: 13, color: plMaterial ? B.dark : B.amber, fontWeight: plMaterial?.confirmed ? 600 : 400 }}>
            {plMaterial ? plMaterial.printlogic : "⚠ No match — select manually"}
            {plMaterial && !plMaterial.confirmed && <span style={{ color: B.amber, fontSize: 11, marginLeft: 6 }}>⚠ unconfirmed</span>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", marginBottom: 4 }}>Default Delivery</div>
          <div style={{ fontSize: 13 }}>{deliveryRule ? `${deliveryRule.courier} (${deliveryRule.price})` : jobDefaults?.delivery || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", marginBottom: 4 }}>Job Type</div>
          <div style={{ fontSize: 13 }}>{jobDefaults ? `✓ ${jobDefaults.jobType}` : "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", marginBottom: 4 }}>Sheet Size</div>
          <div style={{ fontSize: 13 }}>{admin.defaultSheetSize} (default)</div>
        </div>
      </div>
    </div>
  );
}
