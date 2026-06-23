"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: B.dark,
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: B.muted, display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    if (!res.ok) { setError(data.error || "Reset failed. The link may have expired."); return; }
    setDone(true);
    setTimeout(() => router.push("/login?reset=1"), 3000);
  };

  if (!token) return (
    <AuthLayout title="Invalid link" subtitle="This reset link is missing or malformed">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 14, color: B.muted, marginBottom: 24 }}>Please request a new password reset link.</p>
        <Link href="/forgot-password" style={{ display: "inline-block", padding: "11px 24px", borderRadius: 8, background: B.navy, color: B.white, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
          Request new link
        </Link>
      </div>
    </AuthLayout>
  );

  if (done) return (
    <AuthLayout title="Password updated" subtitle="You can now sign in with your new password">
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#E9F5F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
          ✅
        </div>
        <p style={{ fontSize: 15, color: B.greyDark, marginBottom: 8 }}>Password updated successfully.</p>
        <p style={{ fontSize: 13, color: B.muted }}>Redirecting to sign in…</p>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20, display: "flex", gap: 8 }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}
        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={lbl}>New password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} required
                style={{ ...inp, paddingRight: 44 }}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: B.muted, fontSize: 16, padding: 0 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div>
            <label style={lbl}>Confirm new password</label>
            <input type="password" required autoComplete="new-password"
              style={{ ...inp, borderColor: form.confirm && form.confirm !== form.password ? B.red : B.grey }}
              value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter password" />
            {form.confirm && form.confirm !== form.password && (
              <p style={{ fontSize: 12, color: B.red, marginTop: 4 }}>Passwords do not match</p>
            )}
          </div>
        </div>
        <button type="submit" disabled={loading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
            background: loading ? B.grey : B.navy, color: loading ? B.muted : B.white,
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Roboto, sans-serif",
          }}>
          {loading ? "Updating…" : "Set new password"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}
