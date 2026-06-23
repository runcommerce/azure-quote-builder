"use client";
import { B } from "@/lib/types";

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0c1e16 0%, #183230 60%, #1a3a2a 100%)", display: "flex", flexDirection: "column", fontFamily: "Roboto, sans-serif" }}>

      {/* Top bar with wordmark */}
      <div style={{ padding: "20px 32px" }}>
        <img
          src="/azure-logo.png"
          alt="Azure Communications"
          style={{ height: 28, width: "auto", display: "block" }}
        />
      </div>

      {/* Centred card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ marginBottom: 28, paddingLeft: 4 }}>
            <h1 style={{ margin: 0, color: B.white, fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
            {subtitle && <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>}
          </div>

          <div style={{ background: B.white, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ padding: "32px" }}>{children}</div>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} Azure Communications · Powered by Standfast AI
          </p>
        </div>
      </div>
    </div>
  );
}
