"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { status } = useSession();

  useEffect(() => setMounted(true), []);

  // Redirect to login if not authenticated (client-side, no SSR conflict)
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [mounted, status]);

  if (!mounted || status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#183230", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 32, width: "auto", opacity: 0.6, marginBottom: 20, display: "block", margin: "0 auto 20px" }} />
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>Loading…</div>
      </div>
    </div>
  );

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
