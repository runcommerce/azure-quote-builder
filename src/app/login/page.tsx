"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box" as const,
  border: "1.5px solid var(--az-line)", fontSize: 14, color: "var(--az-ink)",
  outline: "none", background: "var(--az-bg)", fontFamily: "var(--az-font)",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--az-muted)", display: "block",
  marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.06em",
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
    if (params.get("reset")) setInfo("Password updated — please sign in.");
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const result = await signIn("credentials", {
      email: form.email.trim().toLowerCase(), password: form.password, redirect: false,
    });
    setLoading(false);
    if (result?.error) { setError("Incorrect email or password."); return; }
    router.push("/");
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to Azure IQ · Quote Builder">
      <form onSubmit={handleSubmit} noValidate>
        {info && (
          <div style={{ background: "var(--az-green-light)", border: "1px solid #86efac", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "var(--az-green)", marginBottom: 18 }}>
            ✓ {info}
          </div>
        )}
        {error && (
          <div style={{ background: "var(--az-red-light)", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "var(--az-red)", marginBottom: 18 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Email address</label>
          <input type="email" required autoComplete="email" style={inp}
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@azurecomm.ie" />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label style={lbl}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} required autoComplete="current-password"
              style={{ ...inp, paddingRight: 40 }}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--az-muted)", fontSize: 15, padding: 0 }}>
              {showPw ? "○" : "●"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--az-blue)", fontWeight: 600 }}>Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading || !form.email || !form.password}
          style={{ width: "100%", padding: "12px 0", borderRadius: 999, border: "none", background: (!form.email || !form.password || loading) ? "var(--az-line)" : "linear-gradient(135deg, var(--az-blue), var(--az-blue-dark))", color: (!form.email || !form.password || loading) ? "var(--az-muted)" : "#fff", fontSize: 14, fontWeight: 700, cursor: (!form.email || !form.password || loading) ? "not-allowed" : "pointer", fontFamily: "var(--az-font)", boxShadow: (!form.email || !form.password || loading) ? "none" : "0 6px 20px rgba(20,153,214,0.3)" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--az-line)" }} />
          <span style={{ fontSize: 12, color: "var(--az-muted)" }}>New to the platform?</span>
          <div style={{ flex: 1, height: 1, background: "var(--az-line)" }} />
        </div>
        <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 999, border: "1.5px solid var(--az-line)", color: "var(--az-ink)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
