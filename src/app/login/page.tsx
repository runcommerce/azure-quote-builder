"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box" as const,
    border: `1px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif",
    color: B.dark, outline: "none",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: B.muted, display: "block" as const, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Incorrect email or password. Please try again."); return; }
    router.push("/");
  };

  return (
    <AuthLayout title="Sign in" subtitle="Enter your credentials to access the Quote Builder">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email address</label>
          <input type="email" required autoComplete="email" style={inputStyle}
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@azurecomm.ie" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" required autoComplete="current-password" style={inputStyle}
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••" />
        </div>
        <div style={{ textAlign: "right", marginBottom: 24 }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: B.azure, textDecoration: "none" }}>
            Forgot your password?
          </Link>
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
          background: loading ? B.grey : B.navy, color: loading ? B.muted : B.white,
          fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "Roboto, sans-serif",
        }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: B.muted }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: B.azure, fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
