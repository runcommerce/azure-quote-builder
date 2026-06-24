/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Link from "next/link";
import PortalShell, { PortalConfig } from "./PortalShell";

interface Product {
  id: string; sku?: string; name: string; description?: string;
  category?: string; image_url?: string; base_price?: number;
}

interface Props { portal: PortalConfig; products: Product[]; }

const CATEGORY_ICONS: Record<string, string> = {
  Accessories: "🗂", Boards: "🪧", Misc: "📦",
  PVC: "🔲", Signs: "🚦", "Window Sticker": "🪟",
  Leaflets: "📰", Brochures: "📕", Posters: "🖼",
  Stationery: "📝", Banners: "🎌", Other: "📋",
};

export default function PortalHome({ portal, products }: Props) {
  const pc = portal.primary_color || "#1a3a2e";
  const ac = portal.accent_color || "var(--az-lime)";
  const base = `/portal/${portal.slug}`;

  const categories = portal.categories?.length ? portal.categories :
    Array.from(new Set(products.map((p: any) => p.category || "Other")));

  return (
    <PortalShell portal={portal} activePage="CATALOGUE">
      {/* Hero */}
      <div style={{ background: pc, padding: "56px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40%", background: `radial-gradient(circle at right, rgba(255,255,255,0.04), transparent)` }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ac, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
              {portal.company_name} · Online Ordering Portal
            </div>
            <h1 style={{ margin: "0 0 20px", color: "#fff", fontSize: 42, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              {portal.welcome_msg}
            </h1>
            <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.7 }}>
              Hi, I&apos;m <strong style={{ color: ac }}>{portal.account_manager_name}</strong>, your account manager at Azure Communications.
              This portal lets the {portal.company_name} team browse approved print items, request quotes and place orders in just a few clicks.
            </p>
            <div style={{ display: "flex", gap: 20, marginBottom: 28, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              <span>✉ {portal.account_manager_email}</span>
              <span>📞 {portal.account_manager_phone}</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href={`${base}/request-quote`}
                style={{ padding: "13px 26px", borderRadius: 28, background: ac, color: pc, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                Request a quote →
              </Link>
              <Link href={`${base}/my-quotes`}
                style={{ padding: "13px 26px", borderRadius: 28, border: "2px solid rgba(255,255,255,0.35)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                My quotes
              </Link>
            </div>
          </div>

          {/* Account manager card */}
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", border: `2px solid ${ac}`, textAlign: "center" }}>
            {portal.account_manager_photo ? (
              <img src={portal.account_manager_photo} alt={portal.account_manager_name}
                style={{ width: "100%", height: 200, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 200, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>
                👤
              </div>
            )}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{portal.account_manager_name}</div>
              <div style={{ color: ac, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>Account Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category tabs + product grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "2px solid #e5e7eb", marginBottom: 28 }}>
          <button style={{ padding: "8px 0", fontSize: 13, fontWeight: 700, color: pc, border: "none", background: "none", cursor: "pointer", borderBottom: `2px solid ${ac}`, marginBottom: -2 }}>
            ALL PRODUCTS
          </button>
          {categories.map(cat => (
            <button key={cat} style={{ padding: "8px 0", fontSize: 13, fontWeight: 500, color: "#6b7280", border: "none", background: "none", cursor: "pointer" }}>
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Category cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {categories.map((cat, i) => (
            <div key={cat} style={{ background: pc, borderRadius: 16, padding: "28px 24px", cursor: "pointer", position: "relative", overflow: "hidden", minHeight: 140 }}>
              <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.15 }}>{CATEGORY_ICONS[cat] || "📦"}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Category →</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{cat}</div>
            </div>
          ))}
        </div>

        {/* Products grid or empty */}
        {products.length > 0 ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111" }}>Popular picks</h2>
              <Link href={`${base}/catalogue`} style={{ fontSize: 13, fontWeight: 600, color: pc, textDecoration: "none" }}>BROWSE ALL →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {products.slice(0, 6).map(p => (
                <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                  <div style={{ height: 160, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ maxHeight: 140, maxWidth: "90%", objectFit: "contain" }} /> : "📦"}
                  </div>
                  <div style={{ padding: "16px" }}>
                    {p.sku && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{p.sku}</div>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>{p.name}</div>
                    {p.base_price && <div style={{ fontSize: 14, fontWeight: 700, color: pc }}>€{p.base_price.toFixed(2)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No products yet</div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>Products will appear here once added by your Azure account manager.</div>
            <Link href={`${base}/request-quote`}
              style={{ padding: "12px 24px", borderRadius: 24, background: pc, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Request a custom quote →
            </Link>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
