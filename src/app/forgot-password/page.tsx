"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

const forest = "#1a3a2e";
const line = "rgba(26,58,46,0.12)";

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${line}`, fontSize: 14, color: forest, outline: "none",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#5a7066", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const btn = (disabled?: boolean): React.CSSProperties => ({
  width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
  background: disabled ? line : forest,
  color: disabled ? "#5a7066" : "#c8e63c",
  fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
});

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [sent, setSent]         = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
      setEmailSent(!!data.sent);
      if (data.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <AuthLayout title="Check your inbox" subtitle={emailSent ? "A reset link is on its way" : "Email not configured — copy the link below"}>
      <div style={{ textAlign: "center", padding: "4px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: emailSent ? "#E9F5F0" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28 }}>
          {emailSent ? "📧" : "🔗"}
        </div>
        {emailSent ? (
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 8 }}>
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link within a few minutes.
            Check your spam folder if you don&apos;t see it.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.7, marginBottom: 12, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px" }}>
              No email provider is configured. Copy and share this reset link manually:
            </p>
            {resetLink && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input readOnly value={resetLink} style={{ ...inp, flex: 1, fontSize: 11, fontFamily: "monospace", background: "#f9fafb" }} />
                  <button onClick={() => { navigator.clipboard.writeText(resetLink); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                    style={{ padding: "0 16px", borderRadius: 8, border: "none", background: forest, color: "#c8e63c", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "left" }}>Link expires in 1 hour. Send to {email} via email or WhatsApp.</p>
              </div>
            )}
          </>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <button onClick={() => { setSent(false); setEmail(""); setResetLink(""); setCopied(false); }}
            style={{ padding: "11px 0", borderRadius: 8, border: `1.5px solid ${line}`, background: "#fff", color: forest, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Try a different email
          </button>
          <Link href="/login" style={{ display: "block", padding: "11px 0", borderRadius: 8, background: forest, color: "#c8e63c", fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
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
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 20 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Email address</label>
          <input type="email" required style={inp} value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@azurecomm.ie"
            autoComplete="email" />
        </div>
        <button type="submit" disabled={loading || !email} style={btn(loading || !email)}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6b7280" }}>
          <Link href="/login" style={{ color: forest, fontWeight: 700, textDecoration: "none" }}>← Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
