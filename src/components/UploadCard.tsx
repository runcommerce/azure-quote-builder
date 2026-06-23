"use client";
import { useCallback } from "react";
import { B } from "@/lib/types";
import type { AdminConfig } from "@/lib/types";

interface Props {
  file: File | null;
  status: string;
  error: string | null;
  admin: AdminConfig;
  onFile: (f: File) => void;
  onParse: () => void;
}

export default function UploadCard({ file, status, error, admin, onFile, onParse }: Props) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const loading = status === "loading";
  const activePortals = admin.portalCustomers.filter(c => c.active).map(c => c.name).join(" · ");

  return (
    <div style={{ background: B.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Upload RFQ Spec</div>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById("pdf-input")?.click()}
        style={{ border: `2px dashed ${B.grey}`, borderRadius: 8, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: B.offWhite }}
      >
        <input id="pdf-input" type="file" accept="application/pdf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
        {file ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 14, color: B.dark }}>{file.name}</div>
            <div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · click to change</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 500, fontSize: 14, color: B.greyDark }}>Drop a spec PDF here or click to browse</div>
            <div style={{ fontSize: 12, color: B.muted, marginTop: 4 }}>Active portals: {activePortals}</div>
          </>
        )}
      </div>
      {error && (
        <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 7, padding: "10px 14px", fontSize: 13, color: B.red, marginTop: 12 }}>{error}</div>
      )}
      <button onClick={onParse} disabled={!file || loading} style={{
        width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 8, border: "none",
        background: !file || loading ? B.grey : B.navy, color: !file || loading ? B.muted : B.white,
        fontSize: 14, fontWeight: 700, cursor: !file || loading ? "not-allowed" : "pointer",
      }}>
        {loading ? "Extracting fields…" : "Extract quote fields →"}
      </button>
    </div>
  );
}
