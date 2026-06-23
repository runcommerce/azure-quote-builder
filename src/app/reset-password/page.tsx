"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box" as const,
    border: `1px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: B.dark,
  };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: B.muted, display: "block" as const, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Reset failed."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  };

  if (!token) return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: B.red, marginBottom: 16 }}>Invalid or missing reset token.</p>
      <Link href="/forgot-password" style={{ color: B.azure, fontWeight: 700, textDecoration: "none" }}>Request a new link</Link>
    </div>
  );

  if (done) return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <p style={{ fontSize: 15, color: B.greyDark, marginBottom: 8 }}>Password updated successfully.</p>
      <p style={{ fontSize: 13, color: B.muted }}>Redirecting to sign in…</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20 }}>{error}</div>}
      <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>New password</label>
          <input type="password" required style={inputStyle} value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
        </div>
        <div>
          <label style={labelStyle}>Confirm new password</label>
          <input type="password" required style={inputStyle} value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter password" />
        </div>
      </div>
      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
        background: loading ? B.grey : B.navy, color: loading ? B.muted : B.white,
        fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "Roboto, sans-serif",
      }}>
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <Suspense fallback={<div>Loading…</div>}><ResetForm /></Suspense>
    </AuthLayout>
  );
}
