"use client";
import { useState, useEffect } from "react";
import { View } from "./tokens";
import HomeView from "./HomeView";
import UploadQuoteView from "./UploadQuoteView";
import NewQuoteView from "./NewQuoteView";
import QuotesView from "./QuotesView";
import CustomersView from "./CustomersView";
import IntelligenceView from "./IntelligenceView";
import AdminSettingsView from "./AdminSettingsView";
import ClientPortalsView from "./ClientPortalsView";
import EmailQuoteView from "./EmailQuoteView";
import AgentHubView from "./AgentHubView";
import KnowledgeBaseView from "./KnowledgeBaseView";
import GuardrailsView from "./GuardrailsView";
import AgentQueueView from "./AgentQueueView";
import SystemAdminView from "./SystemAdminView";
import { signOut, useSession } from "next-auth/react";

const TITLES: Record<string, string> = {
  "dashboard": "Dashboard", "upload-quote": "Upload RFQ",
  "new-quote": "New Quote", "email-quote": "Email Quote",
  "quotes": "Quotes", "customers": "Customers",
  "client-portals": "Client Portals", "pricing": "Pricing Data",
  "intelligence": "Intelligence", "admin-settings": "Admin Settings",
  "system-admin":   "System Administration",
  "agent-hub":      "Agent Hub",
  "knowledge-base": "Knowledge Base",
  "guardrails":     "Guardrails",
  "agent-queue":    "Agent Queue",
};

const NAV = [
  { id: "dashboard",      label: "Dashboard",      icon: "⊞", group: null     },
  { id: "email-quote",    label: "Email Quote",     icon: "✉", group: "Create" },
  { id: "upload-quote",   label: "Upload RFQ",      icon: "↑", group: "Create" },
  { id: "new-quote",      label: "New Quote",       icon: "+", group: "Create" },
  { id: "quotes",         label: "Quotes",          icon: "≡", group: "Manage" },
  { id: "customers",      label: "Customers",       icon: "◎", group: "Manage" },
  { id: "client-portals", label: "Client Portals",  icon: "◈", group: "Manage" },
  { id: "pricing",        label: "Pricing Data",    icon: "€", group: "Intel"  },
  { id: "intelligence",   label: "Intelligence",    icon: "◑", group: "Intel"  },
  { id: "agent-hub",      label: "Agent Hub",       icon: "🤖", group: "Agent"  },
  { id: "agent-queue",    label: "Queue",           icon: "📥", group: "Agent"  },
  { id: "knowledge-base", label: "Knowledge Base",  icon: "📚", group: "Agent"  },
  { id: "guardrails",     label: "Guardrails",      icon: "🛡", group: "Agent"  },
  { id: "admin-settings", label: "Admin Settings",  icon: "⚙", group: null     },
  { id: "system-admin",   label: "System Admin",     icon: "🔐", group: "Super"  },
] as const;

// Dot grid
const Dots = ({ rows = 4, cols = 5, opacity = 0.18 }: { rows?: number; cols?: number; opacity?: number }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity, pointerEvents: "none" }}>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: "#c8e63c" }} />
        ))}
      </div>
    ))}
  </div>
);

const pill = (primary: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999,
  border: primary ? "none" : "1.5px solid rgba(26,58,46,0.18)",
  background: primary ? "#1a3a2e" : "#fff",
  color: primary ? "#c8e63c" : "#1a3a2e",
  fontSize: 12.5, fontWeight: primary ? 700 : 600, cursor: "pointer",
  fontFamily: "var(--az-font)",
  boxShadow: primary ? "0 3px 12px rgba(26,58,46,0.20)" : "none",
  whiteSpace: "nowrap" as const,
});

export default function Dashboard() {
  const [view, setView] = useState<string>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const navigate = (v: string) => { setView(v as View); setMenuOpen(false); };

  // ── Sidebar content shared between desktop + mobile drawer ──
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 32, width: "auto", display: "block" }} />
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c8e63c", flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>IQ · Quote Builder</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {/* Dashboard */}
        {NAV.filter(n => !n.group && n.id === "dashboard").map(n => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => navigate(n.id as View)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", border: "none", textAlign: "left" as const, background: active ? "rgba(200,230,60,0.14)" : "transparent", borderLeft: `3px solid ${active ? "#c8e63c" : "transparent"}`, color: active ? "#c8e63c" : "rgba(255,255,255,0.58)", fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer", marginRight: 6, borderRadius: "0 8px 8px 0", transition: "all 0.12s" }}>
              <span style={{ fontSize: 12, width: 16, textAlign: "center" as const }}>{n.icon}</span>{n.label}
            </button>
          );
        })}

        {/* Grouped */}
        {(["Create", "Manage", "Intel", "Agent", "Super"] as const).map(g => (
          <div key={g} style={{ marginTop: 4 }}>
            <div style={{ padding: "7px 16px 3px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.20)", textTransform: "uppercase" as const, letterSpacing: "0.14em" }}>
              {g === "Create" ? "Create" : g === "Manage" ? "Manage" : "Intelligence"}
            </div>
            {NAV.filter(n => n.group === g).map(n => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => navigate(n.id as View)}
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", border: "none", textAlign: "left" as const, background: active ? "rgba(200,230,60,0.14)" : "transparent", borderLeft: `3px solid ${active ? "#c8e63c" : "transparent"}`, color: active ? "#c8e63c" : "rgba(255,255,255,0.58)", fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer", marginRight: 6, borderRadius: "0 8px 8px 0", transition: "all 0.12s" }}>
                  <span style={{ fontSize: 12, width: 16, textAlign: "center" as const }}>{n.icon}</span>{n.label}
                </button>
              );
            })}
          </div>
        ))}

        {/* Admin settings */}
        {isAdmin && (
          <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 6 }}>
            {NAV.filter(n => !n.group && n.id !== "dashboard").map(n => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => navigate(n.id as View)}
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", border: "none", textAlign: "left" as const, background: active ? "rgba(200,230,60,0.14)" : "transparent", borderLeft: `3px solid ${active ? "#c8e63c" : "transparent"}`, color: active ? "#c8e63c" : "rgba(255,255,255,0.58)", fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer", marginRight: 6, borderRadius: "0 8px 8px 0", transition: "all 0.12s" }}>
                  <span style={{ fontSize: 12, width: 16, textAlign: "center" as const }}>{n.icon}</span>{n.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: "10px 12px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #c8e63c, #8ab02e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3a2e", fontWeight: 800, fontSize: 12 }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name?.split(" ")[0] || "User"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10.5 }}>{session?.user?.role || "user"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)", background: "transparent", color: "rgba(255,255,255,0.32)", fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "var(--az-font)" }}>
          Sign out
        </button>
      </div>

      {/* Dot grid decoration */}
      <div style={{ position: "absolute", bottom: 80, right: -4 }}>
        <Dots rows={5} cols={5} opacity={0.12} />
      </div>
    </div>
  );

  const content = (
    <>
      {view === "dashboard"      && <HomeView setView={navigate} recentQuotes={[]} />}
      {view === "upload-quote"   && <UploadQuoteView />}
      {view === "new-quote"      && <NewQuoteView setView={navigate} />}
      {view === "email-quote"    && <EmailQuoteView />}
      {view === "quotes"         && <QuotesView setView={navigate} />}
      {view === "customers"      && <CustomersView setView={navigate} />}
      {view === "client-portals" && <ClientPortalsView />}
      {view === "intelligence"   && <IntelligenceView />}
      {view === "admin-settings" && <AdminSettingsView />}
          {view === "agent-hub"      && <AgentHubView setView={navigate} />}
          {view === "knowledge-base" && <KnowledgeBaseView />}
          {view === "guardrails"     && <GuardrailsView />}
          {view === "agent-queue"    && <AgentQueueView />}
          {view === "system-admin"   && <SystemAdminView />}
      {view === "pricing"        && (
        <div style={{ padding: "16px 24px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--az-ink)", marginBottom: 14 }}>Pricing Data</h1>
          <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--az-red-light)", padding: "16px 18px", maxWidth: 520 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--az-red)", marginBottom: 6 }}>⚠ Pricing data has never been synced from PrintLogic</div>
            <div style={{ fontSize: 13, color: "var(--az-muted)", marginBottom: 14 }}>Paper stock: <strong>never</strong> · Finishing: <strong>never</strong></div>
            <button style={pill(true)}>Refresh now →</button>
          </div>
        </div>
      )}
    </>
  );

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--az-off-white)", fontFamily: "var(--az-font)", position: "relative" }}>
        {/* Mobile topbar */}
        <div style={{ background: "#1a3a2e", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(14,31,24,0.25)" }}>
          <img src="/azure-logo.png" alt="Azure" style={{ height: 24, width: "auto" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Primary action — always + New quote */}
            <button onClick={() => navigate("new-quote")} style={{ padding: "6px 14px", borderRadius: 999, border: "none", background: "#c8e63c", color: "#1a3a2e", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              + Quote
            </button>
            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(10,20,15,0.6)" }} onClick={() => setMenuOpen(false)} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: "linear-gradient(180deg, #1a3a2e 0%, #122a21 100%)", overflow: "hidden" }}>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Mobile secondary actions bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid rgba(26,58,46,0.10)", padding: "8px 14px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--az-ink)", flex: 1 }}>{TITLES[view]}</span>
          <button onClick={() => navigate("email-quote")} style={{ ...pill(false), fontSize: 12, padding: "5px 11px" }}>✉ Email</button>
          <button onClick={() => navigate("upload-quote")} style={{ ...pill(false), fontSize: 12, padding: "5px 11px" }}>↑ Upload</button>
        </div>

        {/* Mobile content */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as any }}>
          {content}
        </div>

        {/* Mobile bottom tab bar */}
        <div style={{ background: "#fff", borderTop: "1px solid rgba(26,58,46,0.10)", display: "flex", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -2px 12px rgba(14,31,24,0.08)" }}>
          {[
            { id: "dashboard",      icon: "⊞", label: "Home"     },
            { id: "quotes",         icon: "≡", label: "Quotes"   },
            { id: "email-quote",    icon: "✉", label: "Email"    },
            { id: "customers",      icon: "◎", label: "Clients"  },
            { id: "client-portals", icon: "◈", label: "Portals"  },
            { id: "agent-queue",    icon: "📥", label: "Queue"    },
          ].map(t => {
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => navigate(t.id as View)}
                style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 18, color: active ? "#1a3a2e" : "#9ca3af", transition: "color 0.12s" }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "#1a3a2e" : "#9ca3af", letterSpacing: "0.03em" }}>{t.label}</span>
                {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c8e63c", marginTop: 1 }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--az-off-white)", fontFamily: "var(--az-font)" }}>
      {/* Desktop sidebar */}
      <aside style={{ width: 218, background: "linear-gradient(180deg, #1a3a2e 0%, #122a21 100%)", height: "100vh", position: "relative" as any, top: 0, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <SidebarContent />
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Desktop topbar — single source of truth for create actions */}
        <div style={{ background: "#fff", borderBottom: "1px solid rgba(26,58,46,0.09)", padding: "0 22px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 6px rgba(14,31,24,0.05)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--az-muted)", letterSpacing: "0.13em", textTransform: "uppercase" as const }}>Azure IQ</span>
            <span style={{ color: "rgba(26,58,46,0.20)", fontSize: 13 }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>{TITLES[view]}</span>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <button onClick={() => navigate("email-quote")}  style={pill(false)}>✉ Email</button>
            <button onClick={() => navigate("upload-quote")} style={pill(false)}>↑ Upload</button>
            <button onClick={() => navigate("new-quote")}    style={pill(true)}>+ New quote →</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {content}
        </div>
      </div>
    </div>
  );
}
