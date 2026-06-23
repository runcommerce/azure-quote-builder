"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box" as const,
    border: `1px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: B.dark,
  };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: B.muted, display: "block" as const, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { setError("Something went wrong. Please try again."); return; }
    setSent(true);
  };

  if (sent) return (
    <AuthLayout title="Check your email" subtitle="A reset link is on its way">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <p style={{ fontSize: 15, color: B.greyDark, lineHeight: 1.6, marginBottom: 24 }}>
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link within a few minutes.
        </p>
        <p style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Didn&apos;t get it? Check your spam folder or try again.</p>
        <Link href="/login" style={{ color: B.azure, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>← Back to sign in</Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send a reset link">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20 }}>{error}</div>
        )}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Email address</label>
          <input type="email" required style={inputStyle} value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@azurecomm.ie" />
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
          background: loading ? B.grey : B.navy, color: loading ? B.muted : B.white,
          fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "Roboto, sans-serif",
        }}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: B.muted }}>
          <Link href="/login" style={{ color: B.azure, fontWeight: 700, textDecoration: "none" }}>← Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
