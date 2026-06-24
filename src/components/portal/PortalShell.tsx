/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";

export interface PortalConfig {
  id: string; slug: string; name: string; company_name: string;
  logo_url?: string; primary_color: string; accent_color: string;
  welcome_msg: string;
  account_manager_name: string; account_manager_email: string;
  account_manager_phone: string; account_manager_photo?: string;
  categories?: string[];
}

interface Props { portal: PortalConfig; children: React.ReactNode; activePage?: string; }

export default function PortalShell({ portal, children, activePage }: Props) {
  const base = `/portal/${portal.slug}`;
  const pc = portal.primary_color || "#1a3a2e";
  const ac = portal.accent_color || "#c8e63c";

  const nav = [
    { label: "CATALOGUE",          href: `${base}/catalogue` },
    { label: "FAQS",               href: `${base}/faqs`      },
    { label: "MY QUOTES & ORDERS", href: `${base}/my-quotes` },
    { label: "ACCOUNT",            href: `${base}/account`   },
    { label: "ADMIN",              href: `${base}/admin`     },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 36px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 28 }}>
          {/* Dual logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 26, width: "auto" }} />
            <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: pc, letterSpacing: "-0.01em" }}>{portal.company_name}</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 24, flex: 1 }}>
            {nav.map(n => {
              const active = activePage === n.label;
              return (
                <Link key={n.href} href={n.href} style={{
                  fontSize: 11.5, fontWeight: 700, letterSpacing: "0.07em",
                  color: active ? pc : "#9ca3af", textDecoration: "none",
                  borderBottom: active ? `2px solid ${ac}` : "2px solid transparent",
                  paddingBottom: 2, transition: "color 0.12s",
                }}>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <Link href={`${base}/request-quote`}
            style={{ padding: "9px 20px", borderRadius: 999, background: pc, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0, letterSpacing: "0.01em" }}>
            Request a Quote →
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
