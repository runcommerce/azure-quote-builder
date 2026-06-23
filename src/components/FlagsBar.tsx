"use client";
import { B } from "@/lib/types";
export default function FlagsBar({ flags }: { flags: string[] }) {
  return (
    <div style={{ background: B.amberLight, border: `1px solid ${B.amberBorder}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: B.amber, marginBottom: 6 }}>⚠ Ambiguous fields — review before proceeding</div>
      {flags.map((f, i) => <div key={i} style={{ fontSize: 13, color: B.amber, paddingLeft: 10 }}>· {f}</div>)}
    </div>
  );
}
