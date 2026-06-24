"use client";
import { signOut, useSession } from "next-auth/react";
import { C, View } from "./tokens";

const NAV = [
  { id: "dashboard",      label: "Dashboard",          icon: "⊞",  group: null     },
  { id: "email-quote",    label: "Email Quote",         icon: "✉",  group: "Quote"  },
  { id: "upload-quote",   label: "Upload RFQ",          icon: "↑",  group: "Quote"  },
  { id: "new-quote",      label: "New Quote",           icon: "+",  group: "Quote"  },
  { id: "quotes",         label: "Quotes",              icon: "≡",  group: "Manage" },
  { id: "customers",      label: "Customers",           icon: "◎",  group: "Manage" },
  { id: "client-portals", label: "Client Portals",      icon: "◈",  group: "Manage" },
  { id: "pricing",        label: "Pricing Data",        icon: "€",  group: "Intel"  },
  { id: "intelligence",   label: "Intelligence",        icon: "◑",  group: "Intel"  },
  { id: "admin-settings", label: "Admin Settings",      icon: "⚙",  group: null     },
] as const;

const GROUPS = ["Quote", "Manage", "Intel"];

export default function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const btn = (n: typeof NAV[number]) => {
    if (n.id === "admin-settings" && !isAdmin) return null;
    const active = view === n.id;
    return (
      <button key={n.id} onClick={() => setView(n.id as View)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 16px", border: "none", textAlign: "left",
          background: active ? "rgba(20,153,214,0.12)" : "transparent",
          borderLeft: `3px solid ${active ? "var(--az-blue)" : "transparent"}`,
          color: active ? "var(--az-blue)" : "rgba(255,255,255,0.62)",
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          borderRadius: "0 6px 6px 0", cursor: "pointer",
          transition: "all 0.15s",
          marginRight: 8,
        }}>
        <span style={{ fontSize: 13, width: 18, textAlign: "center", opacity: 0.9, flexShrink: 0 }}>{n.icon}</span>
        <span>{n.label}</span>
      </button>
    );
  };

  return (
    <aside style={{
      width: 220, background: "var(--az-navy)",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Logo block */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img src="/azure-logo.png" alt="Azure Communications"
          style={{ height: 38, width: "auto", display: "block" }} />
        <div style={{
          marginTop: 12, display: "flex", alignItems: "center", gap: 8,
          paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--az-green)", flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            IQ · Quote Builder
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0 8px", overflowY: "auto" }}>
        {/* Dashboard */}
        {NAV.filter(n => !n.group && n.id === "dashboard").map(n => btn(n))}

        {/* Grouped */}
        {GROUPS.map(g => (
          <div key={g} style={{ marginTop: 4 }}>
            <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {g === "Quote" ? "Create" : g === "Manage" ? "Manage" : "Intelligence"}
            </div>
            {NAV.filter(n => n.group === g).map(n => btn(n))}
          </div>
        ))}

        {/* Admin Settings */}
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 8 }}>
          {NAV.filter(n => !n.group && n.id !== "dashboard").map(n => btn(n))}
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--az-blue), var(--az-green))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13,
          }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name?.split(" ")[0] || "User"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11 }}>{session?.user?.role || "user"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)", background: "transparent", color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
