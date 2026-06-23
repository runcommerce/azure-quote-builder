"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif",
  color: B.dark, outline: "none",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: B.muted, display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      {checks.map(c => (
        <span key={c.label} style={{ fontSize: 11, color: c.ok ? B.green : B.muted, display: "flex", gap: 4, alignItems: "center" }}>
          <span>{c.ok ? "✓" : "○"}</span>{c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const validCode = process.env.NEXT_PUBLIC_INVITE_CODE || "AZURE2026";
    if (form.inviteCode.toUpperCase().trim() !== validCode) {
      setError("Invalid invite code. Contact your administrator to get access.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Sign up failed. Please try again."); return; }
    router.push("/login?registered=1");
  };

  return (
    <AuthLayout title="Create your account" subtitle="You'll need an invite code from your administrator">
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20, display: "flex", gap: 8 }}>
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Full name</label>
            <input type="text" required autoComplete="name" style={inp}
              value={form.name} onChange={set("name")} placeholder="Aaron Herbert" />
          </div>
          <div>
            <label style={lbl}>Email address</label>
            <input type="email" required autoComplete="email" style={inp}
              value={form.email} onChange={set("email")} placeholder="you@azurecomm.ie" />
          </div>
          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} required autoComplete="new-password"
                style={{ ...inp, paddingRight: 44 }}
                value={form.password} onChange={set("password")} placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: B.muted, fontSize: 16, padding: 0 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>
          <div>
            <label style={lbl}>Confirm password</label>
            <input type="password" required autoComplete="new-password" style={{
              ...inp,
              borderColor: form.confirm && form.confirm !== form.password ? B.red : B.grey,
            }}
              value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" />
            {form.confirm && form.confirm !== form.password && (
              <p style={{ fontSize: 12, color: B.red, marginTop: 4 }}>Passwords do not match</p>
            )}
          </div>
          <div>
            <label style={lbl}>Invite code</label>
            <input type="text" required autoComplete="off" style={inp}
              value={form.inviteCode} onChange={set("inviteCode")} placeholder="Provided by your admin" />
            <p style={{ fontSize: 12, color: B.muted, marginTop: 4 }}>
              Don&apos;t have one? <Link href="mailto:eamonn@standfast.partners" style={{ color: B.azure }}>Contact Standfast</Link>
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
            background: loading ? B.grey : B.navy,
            color: loading ? B.muted : B.white,
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Roboto, sans-serif",
          }}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: B.muted }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: B.azure, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
