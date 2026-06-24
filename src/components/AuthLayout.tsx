"use client";

export default function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode; title: string; subtitle?: string;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 8% 5%, rgba(20,153,214,0.14), transparent 28rem), radial-gradient(circle at 92% 8%, rgba(123,192,67,0.11), transparent 22rem), var(--az-navy)",
      display: "flex", flexDirection: "column", fontFamily: "var(--az-font)",
    }}>
      {/* Header */}
      <div style={{ padding: "22px 32px" }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 32, width: "auto" }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ marginBottom: 24, paddingLeft: 2 }}>
            <h1 style={{ margin: "0 0 6px", color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h1>
            {subtitle && <p style={{ margin: 0, color: "rgba(255,255,255,0.48)", fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>}
          </div>
          <div style={{
            background: "var(--az-surface)", borderRadius: 20,
            boxShadow: "0 24px 70px rgba(16,42,67,0.35)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "30px 28px" }}>{children}</div>
          </div>
          <p style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: "rgba(255,255,255,0.22)" }}>
            © {new Date().getFullYear()} Azure Communications · Standfast AI
          </p>
        </div>
      </div>
    </div>
  );
}
