/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Link from "next/link";

export interface PortalConfig {
  id: string; slug: string; name: string; company_name: string;
  logo_url?: string; primary_color: string; accent_color: string;
  welcome_msg: string;
  account_manager_name: string; account_manager_email: string;
  account_manager_phone: string; account_manager_photo?: string;
  categories: string[];
}

interface Props {
  portal: PortalConfig;
  children: React.ReactNode;
  activePage?: string;
}

export default function PortalShell({ portal, children, activePage }: Props) {
  const base = `/portal/${portal.slug}`;
  const pc = portal.primary_color || "#183230";
  const ac = portal.accent_color || "#c8e63c";

  const nav = [
    { label: "CATALOGUE",         href: `${base}/catalogue`     },
    { label: "MY QUOTES & ORDERS", href: `${base}/my-quotes`     },
    { label: "ACCOUNT",           href: `${base}/account`       },
    { label: "ADMIN",             href: `${base}/admin`         },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Topnav */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 32 }}>
          {/* Dual logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 28, width: "auto" }} />
            <div style={{ width: 1, height: 28, background: "#e5e7eb" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: pc }}>{portal.company_name}</div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 28, flex: 1 }}>
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: activePage === n.label ? pc : "#6b7280", textDecoration: "none", borderBottom: activePage === n.label ? `2px solid ${ac}` : "2px solid transparent", paddingBottom: 2, transition: "color 0.12s" }}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <Link href={`${base}/request-quote`}
            style={{ padding: "10px 22px", borderRadius: 24, background: pc, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.12s" }}>
            Request a Quote →
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
// Type helper for DB rows
export type AnyPortalConfig = Record<string, any>;
