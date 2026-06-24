/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Link from "next/link";
import PortalShell, { PortalConfig } from "./PortalShell";

export default function PortalAccount({ portal }: { portal: PortalConfig }) {
  const pc = portal.primary_color || "#1a3a2e";
  const ac = portal.accent_color || "#c8e63c";
  const base = `/portal/${portal.slug}`;
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: portal.company_name });
  const [saved, setSaved] = useState(false);

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 8,
    border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "inherit",
    color: "#111", boxSizing: "border-box" as const, background: "#fff",
  };

  return (
    <PortalShell portal={portal} activePage="ACCOUNT">
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 40px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 4, letterSpacing: "-0.02em" }}>My Account</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>{portal.company_name} · portal account settings</p>

        {/* Account manager card */}
        <div style={{ background: pc, borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👤</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 3 }}>Your Account Manager</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{portal.account_manager_name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              {portal.account_manager_email} · {portal.account_manager_phone}
            </div>
          </div>
          <a href={"mailto:" + portal.account_manager_email}
            style={{ marginLeft: "auto", padding: "9px 18px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
            Get in touch
          </a>
        </div>

        {/* Profile form */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 16 }}>Profile details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Full name", key: "name", placeholder: "Your name" },
              { label: "Email address", key: "email", placeholder: "you@company.ie" },
              { label: "Phone", key: "phone", placeholder: "+353..." },
              { label: "Company", key: "company", placeholder: portal.company_name },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{f.label}</label>
                <input style={inp} value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
              style={{ padding: "9px 22px", borderRadius: 999, border: "none", background: pc, color: ac, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Save changes
            </button>
            {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>

        {/* Change password */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4 }}>Change password</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Contact {portal.account_manager_name} to reset your portal access.</div>
          <a href={"mailto:" + portal.account_manager_email + "?subject=Portal access reset - " + portal.company_name}
            style={{ padding: "9px 20px", borderRadius: 999, border: "1.5px solid #e5e7eb", color: "#111", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
            Request password reset
          </a>
        </div>
      </div>
    </PortalShell>
  );
}
