"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { B } from "@/lib/types";

const INVITE_CODE = process.env.NEXT_PUBLIC_INVITE_CODE || "AZURE2026";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box" as const,
    border: `1px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: B.dark,
  };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: B.muted, display: "block" as const, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.inviteCode.toUpperCase() !== INVITE_CODE) { setError("Invalid invite code. Please contact your administrator."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Sign up failed."); return; }
    router.push("/login?registered=1");
  };

  return (
    <AuthLayout title="Create account" subtitle="You'll need an invite code from your administrator">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: B.redLight, border: `1px solid ${B.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: B.red, marginBottom: 20 }}>
            {error}
          </div>
        )}
        <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
          {[
            { key: "name", label: "Full name", type: "text", placeholder: "Aaron Herbert", autocomplete: "name" },
            { key: "email", label: "Email address", type: "email", placeholder: "you@azurecomm.ie", autocomplete: "email" },
            { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters", autocomplete: "new-password" },
            { key: "confirm", label: "Confirm password", type: "password", placeholder: "Re-enter password", autocomplete: "new-password" },
            { key: "inviteCode", label: "Invite code", type: "text", placeholder: "Provided by your admin", autocomplete: "off" },
          ].map(({ key, label, type, placeholder, autocomplete }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input type={type} required autoComplete={autocomplete} style={inputStyle}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
          background: loading ? B.grey : B.navy, color: loading ? B.muted : B.white,
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
