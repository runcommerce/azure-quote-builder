"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header style={{ background: "var(--az-navy)", padding: "0 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>

        {/* Wordmark logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img
            src="/azure-logo.png"
            alt="Azure Communications"
            style={{ height: 34, width: "auto", display: "block" }}
          />
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
            AI Quote Builder
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session?.user?.name && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#007EBB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {session.user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500 }}>
                {session.user.name.split(" ")[0]}
              </span>
            </div>
          )}
          {isAdmin && (
            <button onClick={() => router.push("/admin")}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 13, fontFamily: "var(--az-font)" }}>
              👥 Users
            </button>
          )}
          <button onClick={onAdminClick}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "7px 15px", cursor: "pointer", fontSize: 13, fontFamily: "var(--az-font)", fontWeight: 600 }}>
            ⚙ Admin
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 13, fontFamily: "var(--az-font)" }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
