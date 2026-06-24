"use client";
import { signOut, useSession } from "next-auth/react";

const NAV = [
  { id: "dashboard",      label: "Dashboard",       icon: "⊞", group: null     },
  { id: "email-quote",    label: "Email Quote",      icon: "✉", group: "Create" },
  { id: "upload-quote",   label: "Upload RFQ",       icon: "↑", group: "Create" },
  { id: "new-quote",      label: "New Quote",        icon: "+", group: "Create" },
  { id: "quotes",         label: "Quotes",           icon: "≡", group: "Manage" },
  { id: "customers",      label: "Customers",        icon: "◎", group: "Manage" },
  { id: "client-portals", label: "Client Portals",   icon: "◈", group: "Manage" },
  { id: "pricing",        label: "Pricing Data",     icon: "€", group: "Intel"  },
  { id: "intelligence",   label: "Intelligence",     icon: "◑", group: "Intel"  },
  { id: "admin-settings", label: "Admin Settings",   icon: "⚙", group: null     },
] as const;

type View = typeof NAV[number]["id"];

// Dot grid pattern — signature Azure Communications motif
const DotGrid = () => (
  <div style={{ position: "absolute", bottom: 90, right: -4, opacity: 0.18, pointerEvents: "none" }}>
    {Array.from({ length: 6 }).map((_, row) => (
      <div key={row} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--az-lime)" }} />
        ))}
      </div>
    ))}
  </div>
);

export default function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const NavBtn = ({ n }: { n: typeof NAV[number] }) => {
    if (n.id === "admin-settings" && !isAdmin) return null;
    const active = view === n.id;
    return (
      <button onClick={() => setView(n.id as View)}
        style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%",
          padding: "9px 14px 9px 16px",
          border: "none", textAlign: "left",
          background: active ? "rgba(200,230,60,0.14)" : "transparent",
          borderLeft: `3px solid ${active ? "var(--az-lime)" : "transparent"}`,
          color: active ? "var(--az-lime)" : "rgba(255,255,255,0.58)",
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          cursor: "pointer", transition: "all 0.14s",
          marginRight: 6, borderRadius: "0 8px 8px 0",
        }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.58)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}}>
        <span style={{ fontSize: 12, width: 16, textAlign: "center", flexShrink: 0, opacity: 0.85 }}>{n.icon}</span>
        {n.label}
      </button>
    );
  };

  return (
    <aside style={{
      width: 218,
      background: "linear-gradient(180deg, #1a3a2e 0%, #122a21 100%)",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "relative" as any, top: 0, flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}>
      <DotGrid />

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img src="/azure-logo.png" alt="Azure Communications"
          style={{ height: 36, width: "auto", display: "block" }} />
        <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--az-lime)", flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            IQ · Quote Builder
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0 6px", overflowY: "auto" }}>
        {NAV.filter(n => !n.group && n.id === "dashboard").map(n => <NavBtn key={n.id} n={n} />)}

        {["Create", "Manage", "Intel"].map(g => (
          <div key={g} style={{ marginTop: 6 }}>
            <div style={{ padding: "8px 16px 3px", fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.20)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {g === "Create" ? "Create" : g === "Manage" ? "Manage" : "Intelligence"}
            </div>
            {NAV.filter(n => n.group === g).map(n => <NavBtn key={n.id} n={n} />)}
          </div>
        ))}

        <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 6 }}>
          {NAV.filter(n => !n.group && n.id !== "dashboard").map(n => <NavBtn key={n.id} n={n} />)}
        </div>
      </nav>

      {/* User footer */}
      <div style={{ padding: "10px 12px 12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #c8e63c, #8ab02e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3a2e", fontWeight: 800, fontSize: 12 }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
    </aside>
  );
}
