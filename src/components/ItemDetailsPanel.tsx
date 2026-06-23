"use client";
import { useState } from "react";
import { B } from "@/lib/types";

export default function ItemDetailsPanel({ itemDetails }: { itemDetails: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(itemDetails); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background: B.navy, borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.azureMid, textTransform: "uppercase", letterSpacing: "0.08em" }}>Item Details — Aaron&apos;s Format</div>
        <button onClick={copy} style={{ background: B.azure, border: "none", color: B.white, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", color: B.azureLight, lineHeight: 1.8 }}>
        {itemDetails || "— complete fields above to generate —"}
      </pre>
    </div>
  );
}
