"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${"var(--az-line)"}`, fontSize: 14, fontFamily: "var(--az-font)", color: "var(--az-ink)",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--az-muted)", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <AuthLayout title="Check your inbox" subtitle="A reset link is on its way">
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#E9F5F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
          📧
        </div>
        <p style={{ fontSize: 15, color: "var(--az-muted)", lineHeight: 1.7, marginBottom: 8 }}>
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link within a few minutes.
        </p>
        <p style={{ fontSize: 13, color: "var(--az-muted)", marginBottom: 28 }}>
          Check your spam folder if you don&apos;t see it.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => { setSent(false); setEmail(""); }}
            style={{ padding: "11px 0", borderRadius: 8, border: `1.5px solid ${"var(--az-line)"}`, background: "#ffffff", color: "var(--az-ink)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--az-font)" }}>
            Try a different email
          </button>
          <Link href="/login" style={{ display: "block", padding: "11px 0", borderRadius: 8, border: "none", background: "var(--az-navy)", color: "#ffffff", fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center", fontFamily: "var(--az-font)" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send a reset link">
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div style={{ background: "var(--az-red-light)", border: `1px solid ${"var(--az-red)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--az-red)", marginBottom: 20 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Email address</label>
          <input type="email" required style={inp} value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@azurecomm.ie"
            autoComplete="email" />
        </div>
        <button type="submit" disabled={loading || !email}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
            background: loading || !email ? "var(--az-line)" : "var(--az-navy)",
            color: loading || !email ? "var(--az-muted)" : "#ffffff",
            fontSize: 15, fontWeight: 700, cursor: loading || !email ? "not-allowed" : "pointer",
            fontFamily: "var(--az-font)",
          }}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--az-muted)" }}>
          <Link href="/login" style={{ color: "var(--az-blue)", fontWeight: 700, textDecoration: "none" }}>← Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
