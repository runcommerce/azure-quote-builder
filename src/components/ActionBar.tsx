"use client";
import { useState } from "react";
import { B } from "@/lib/types";

interface Props {
  status: string;
  onApprove: () => void;
  onReset: () => void;
  jsonData: unknown;
}

export default function ActionBar({ status, onApprove, onReset, jsonData }: Props) {
  const [copied, setCopied] = useState(false);
  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const [showJson, setShowJson] = useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {status === "done" && (
          <button onClick={onApprove} style={{ flex: 1, minWidth: 200, padding: "12px 0", borderRadius: 8, border: "none", background: B.navy, color: B.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            ✓ Approve — Ready for PrintLogic
          </button>
        )}
        <button onClick={copyJson} style={{ padding: "12px 18px", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, fontSize: 13, cursor: "pointer" }}>
          {copied ? "Copied ✓" : "Export JSON"}
        </button>
        <button onClick={() => setShowJson(!showJson)} style={{ padding: "12px 18px", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, fontSize: 13, cursor: "pointer" }}>
          {showJson ? "Hide JSON" : "View JSON"}
        </button>
        <button onClick={onReset} style={{ padding: "12px 18px", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, fontSize: 13, cursor: "pointer" }}>
          New spec
        </button>
      </div>
      {showJson && (
        <pre style={{ marginBottom: 16, padding: 14, background: B.dark, color: "#A8D8A8", borderRadius: 8, fontSize: 11, overflowX: "auto", lineHeight: 1.6 }}>
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )}
    </>
  );
}
