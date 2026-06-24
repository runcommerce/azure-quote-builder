"use client";
import { signOut, useSession } from "next-auth/react";
import { C, View } from "./tokens";

const NAV = [
  { id: "dashboard",      label: "Dashboard",       icon: "⊞" },
  { id: "upload-quote",   label: "Upload RFQ Spec", icon: "📄" },
  { id: "new-quote",      label: "New Quote",        icon: "✚" },
  { id: "quotes",         label: "Quotes",           icon: "📋" },
  { id: "customers",      label: "Customers",        icon: "👥" },
  { id: "pricing",        label: "Pricing Data",     icon: "💶" },
  { id: "intelligence",   label: "Intelligence",     icon: "🔍" },
  { id: "admin-settings", label: "Admin Settings",   icon: "⚙" },
] as const;

interface Props {
  view: View;
  setView: (v: View) => void;
}

export default function Sidebar({ view, setView }: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside style={{
      width: 220, background: C.navy, display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 28, width: "auto" }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {NAV.filter(n => n.id !== "admin-settings" || isAdmin).map(n => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id as View)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 20px", border: "none", textAlign: "left", cursor: "pointer",
                background: active ? "rgba(200,230,60,0.12)" : "transparent",
                borderLeft: active ? `3px solid ${C.lime}` : "3px solid transparent",
                color: active ? C.lime : "rgba(255,255,255,0.65)",
                fontSize: 14, fontFamily: "Roboto, sans-serif", fontWeight: active ? 600 : 400,
                transition: "all 0.12s",
              }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.azure, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: C.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name || "User"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{session?.user?.role || "user"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", padding: "7px 0", borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
