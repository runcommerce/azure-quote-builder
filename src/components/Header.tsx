"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { B } from "@/lib/types";

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header style={{ background: B.navy, padding: "0 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 58 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/azure-logo.png" alt="Azure Communications"
            style={{ height: 40, width: 40, borderRadius: 6, objectFit: "cover" }} />
          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>AI Quote Builder</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session?.user?.name && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: B.azure, display: "inline-flex", alignItems: "center", justifyContent: "center", color: B.white, fontWeight: 700, fontSize: 12 }}>
                {session.user.name.charAt(0).toUpperCase()}
              </span>
              {session.user.name.split(" ")[0]}
            </span>
          )}

          {isAdmin && (
            <button onClick={() => router.push("/admin")}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "Roboto, sans-serif" }}>
              👥 Users
            </button>
          )}

          <button onClick={onAdminClick}
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: B.white, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
            ⚙ Admin
          </button>

          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "Roboto, sans-serif" }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
