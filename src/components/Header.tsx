"use client";
import { B } from "@/lib/types";

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <header style={{ background: B.navy, padding: "0 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 17, fontStyle: "italic" }}>a</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>azure</div>
            <div style={{ color: B.azureMid, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>communications</div>
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>AI Quote Builder</span>
        </div>
        <button onClick={onAdminClick} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>
          ⚙ Admin
        </button>
      </div>
    </header>
  );
}
