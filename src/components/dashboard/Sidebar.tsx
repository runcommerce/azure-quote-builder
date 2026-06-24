"use client";
import { signOut, useSession } from "next-auth/react";
import { C, View } from "./tokens";

const NAV = [
  { id: "dashboard",      label: "Dashboard",           icon: "⊞",  group: null     },
  { id: "email-quote",    label: "Email Quote Parser",   icon: "✉️",  group: "Quote"  },
  { id: "upload-quote",   label: "Upload RFQ Spec",      icon: "📄",  group: "Quote"  },
  { id: "new-quote",      label: "New Quote",            icon: "✚",   group: "Quote"  },
  { id: "quotes",         label: "Quotes",               icon: "📋",  group: "Manage" },
  { id: "customers",      label: "Customers",            icon: "👥",  group: "Manage" },
  { id: "client-portals", label: "Client Portals",       icon: "🏢",  group: "Manage" },
  { id: "pricing",        label: "Pricing Data",         icon: "💶",  group: "Intel"  },
  { id: "intelligence",   label: "Intelligence",         icon: "🔍",  group: "Intel"  },
  { id: "admin-settings", label: "Admin Settings",       icon: "⚙",   group: null     },
] as const;

const GROUPS: { id: string | null; label: string }[] = [
  { id: null,     label: "" },
  { id: "Quote",  label: "Create a Quote" },
  { id: "Manage", label: "Manage" },
  { id: "Intel",  label: "Intelligence" },
  { id: null,     label: "" },
];

interface Props {
  view: View;
  setView: (v: View) => void;
}

export default function Sidebar({ view, setView }: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const navGroups = ["Quote", "Manage", "Intel"];
  const ungrouped = NAV.filter(n => !n.group);
  const grouped = navGroups.map(g => ({ group: g, items: NAV.filter(n => n.group === g) }));

  const NavBtn = ({ n }: { n: typeof NAV[number] }) => {
    if (n.id === "admin-settings" && !isAdmin) return null;
    const active = view === n.id;
    return (
      <button key={n.id} onClick={() => setView(n.id as View)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 20px", border: "none", textAlign: "left", cursor: "pointer",
          background: active ? "rgba(200,230,60,0.15)" : "transparent",
          borderLeft: active ? `3px solid ${C.lime}` : "3px solid transparent",
          color: active ? C.lime : "rgba(255,255,255,0.6)",
          fontSize: 13, fontFamily: "Roboto, sans-serif", fontWeight: active ? 700 : 400,
          transition: "all 0.12s",
        }}>
        <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
        {n.label}
      </button>
    );
  };

  return (
    <aside style={{ width: 230, background: C.navy, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>

      {/* ── PROMINENT LOGO ─────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <img src="/azure-logo.png" alt="Azure Communications"
          style={{ height: 42, width: "auto", display: "block" }} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            AI Quote Builder
          </div>
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {/* Dashboard first, ungrouped */}
        {NAV.filter(n => !n.group && n.id === "dashboard").map(n => <NavBtn key={n.id} n={n} />)}

        {/* Grouped sections */}
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <div style={{ padding: "14px 20px 5px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {group}
            </div>
            {items.map(n => <NavBtn key={n.id} n={n} />)}
          </div>
        ))}

        {/* Admin Settings at bottom of nav */}
        <div style={{ paddingTop: 8 }}>
          {NAV.filter(n => !n.group && n.id !== "dashboard").map(n => <NavBtn key={n.id} n={n} />)}
        </div>
      </nav>

      {/* ── User footer ─────────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.azure, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ color: C.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{session?.user?.role || "user"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", padding: "7px 0", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
