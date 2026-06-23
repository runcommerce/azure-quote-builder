"use client";
import { B } from "@/lib/types";

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", flexDirection: "column", fontFamily: "Roboto, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: B.navy, padding: "0 24px", height: 58, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 38, width: 38, borderRadius: 6, objectFit: "cover" }} />
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>AI Quote Builder</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 440, background: B.white, borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", overflow: "hidden" }}>
          {/* Card header */}
          <div style={{ background: B.navy, padding: "28px 32px" }}>
            <h1 style={{ margin: 0, color: B.white, fontSize: 22, fontWeight: 700 }}>{title}</h1>
            {subtitle && <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{subtitle}</p>}
          </div>
          <div style={{ padding: "32px" }}>{children}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#aaa" }}>
        © {new Date().getFullYear()} Azure Communications · Powered by Standfast AI
      </div>
    </div>
  );
}
