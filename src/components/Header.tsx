"use client";
import { B } from "@/lib/types";

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <header style={{ background: B.navy, padding: "0 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 58 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/azure-logo.png" alt="Azure Communications"
            style={{ height: 40, width: 40, borderRadius: 6, objectFit: "cover" }} />
          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>AI Quote Builder</span>
        </div>
        {/* Admin button */}
        <button onClick={onAdminClick}
          style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: B.white, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
          ⚙ Admin
        </button>
      </div>
    </header>
  );
}
