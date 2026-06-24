"use client";
import { useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div style={{ minHeight: "100vh", background: "#183230", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 32, width: "auto", opacity: 0.7, marginBottom: 20 }} />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>Loading…</div>
      </div>
    </div>
  );
  return <>{children}</>;
}
