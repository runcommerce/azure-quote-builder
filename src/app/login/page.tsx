"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif",
  color: B.dark, outline: "none", transition: "border-color 0.15s",
  background: B.white,
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: B.muted, display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (params.get("registered")) setInfo("Account created — you can sign in now.");
    if (params.get("reset")) setInfo("Password updated — please sign in with your new password.");
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const result = await signIn("credentials", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) { setError("Incorrect email or password."); return; }
    router.push("/");
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Azure Quote Builder account">
      <form onSubmit={handleSubmit} noValidate>
        {info && (
          <div style={{ background: "#E9F5F0", border: "1px solid #9FE1CB", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.green, marginBottom: 20, display: "flex", gap: 8 }}>
            <span>✓</span><span>{info}</span>
          </div>
        )}
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20, display: "flex", gap: 8 }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Email address</label>
          <input type="email" required autoComplete="email" style={inp}
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@azurecomm.ie" />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} required autoComplete="current-password"
              style={{ ...inp, paddingRight: 44 }}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: B.muted, fontSize: 16, padding: 0 }}>
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: 24 }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: B.azure, textDecoration: "none", fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading || !form.email || !form.password}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
            background: loading || !form.email || !form.password ? B.grey : B.navy,
            color: loading || !form.email || !form.password ? B.muted : B.white,
            fontSize: 15, fontWeight: 700, cursor: loading || !form.email || !form.password ? "not-allowed" : "pointer",
            fontFamily: "Roboto, sans-serif", transition: "background 0.15s",
          }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: B.grey }} />
          <span style={{ fontSize: 12, color: B.muted }}>New to the platform?</span>
          <div style={{ flex: 1, height: 1, background: B.grey }} />
        </div>

        <Link href="/signup" style={{
          display: "block", textAlign: "center", padding: "11px 0", borderRadius: 8,
          border: `1.5px solid ${B.navy}`, color: B.navy, fontWeight: 700, fontSize: 14,
          textDecoration: "none", transition: "background 0.15s",
        }}>
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
