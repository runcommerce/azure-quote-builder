"use client";
import { B } from "@/lib/types";
import { signOut, useSession } from "next-auth/react";

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { data: session } = useSession();
  const name = session?.user?.name || "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isAdmin = session?.user?.role === "admin";

  return (
    <header style={{ background: B.navy, padding: "0 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 66 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/azure-logo.png" alt="Azure Communications" style={{ height: 42, width: 42, borderRadius: 6, objectFit: "cover" }} />
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>AI Quote Builder</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* User avatar */}
          {session && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: B.azure, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                {initials}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ color: B.white, fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "capitalize" }}>{session.user?.role}</div>
              </div>
            </div>
          )}

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

          {/* Admin button — only for admin role */}
          {isAdmin && (
            <button onClick={onAdminClick} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
              ⚙ Admin
            </button>
          )}

          {/* Sign out */}
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
