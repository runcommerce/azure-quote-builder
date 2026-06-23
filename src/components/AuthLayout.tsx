"use client";
import { B } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2320 0%, #183230 50%, #1a3a36 100%)", display: "flex", flexDirection: "column", fontFamily: "Roboto, sans-serif" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 36, width: 36, borderRadius: 6, objectFit: "cover" }} />
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Quote Builder</span>
      </div>

      {/* Centred card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {/* Title above card */}
          <div style={{ marginBottom: 28, paddingLeft: 4 }}>
            <h1 style={{ margin: 0, color: B.white, fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
            {subtitle && <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>}
          </div>

          {/* Card */}
          <div style={{ background: B.white, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", overflow: "hidden" }}>
            <div style={{ padding: "32px" }}>{children}</div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Azure Communications · Powered by Standfast AI
          </p>
        </div>
      </div>
    </div>
  );
}
