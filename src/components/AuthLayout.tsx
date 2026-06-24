"use client";

// Dot grid pattern — signature Azure motif
const DotGrid = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7, ...style }}>
    {Array.from({ length: 8 }).map((_, r) => (
      <div key={r} style={{ display: "flex", gap: 7 }}>
        {Array.from({ length: 8 }).map((_, c) => (
          <div key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: "#c8e63c", opacity: 0.55 }} />
        ))}
      </div>
    ))}
  </div>
);

export default function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode; title: string; subtitle?: string;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1a3a2e 0%, #122a21 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--az-font)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Dot grid decorative — bottom right like azurecomm.ie */}
      <div style={{ position: "absolute", bottom: 32, right: 40, opacity: 1, pointerEvents: "none" }}>
        <DotGrid />
      </div>
      {/* Subtle dot grid top left */}
      <div style={{ position: "absolute", top: 80, left: -20, opacity: 0.35, pointerEvents: "none" }}>
        <DotGrid />
      </div>

      {/* Header */}
      <div style={{ padding: "20px 36px", position: "relative", zIndex: 1 }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 30, width: "auto" }} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 20px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Label */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(200,230,60,0.7)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Azure Communications
            </span>
          </div>
          <h1 style={{ margin: "0 0 4px", color: "#ffffff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>
          )}

          {/* Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 24px 80px rgba(10,24,18,0.40)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "28px 26px" }}>{children}</div>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 11.5, color: "rgba(255,255,255,0.18)" }}>
            © {new Date().getFullYear()} Azure Communications · Powered by Standfast AI
          </p>
        </div>
      </div>
    </div>
  );
}
