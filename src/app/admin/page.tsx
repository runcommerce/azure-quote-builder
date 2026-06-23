"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { B } from "@/lib/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  created_at: string;
}

const ROLES = ["user", "admin"];

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
      background: isAdmin ? "#183230" : B.azureLight,
      color: isAdmin ? B.white : B.azure,
    }}>
      {isAdmin ? "⚙ Admin" : "○ User"}
    </span>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const code = process.env.NEXT_PUBLIC_INVITE_CODE || "AZURE2026";
  const url = typeof window !== "undefined" ? `${window.location.origin}/signup` : "/signup";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,50,48,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: B.white, borderRadius: 14, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        <div style={{ background: B.navy, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: B.white, fontWeight: 700, fontSize: 16 }}>Invite a new user</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: B.white, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: B.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Share both the signup link and the invite code with the person you want to add. They&apos;ll need both to create an account.
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Signup link</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "9px 12px", background: B.offWhite, borderRadius: 8, fontSize: 13, color: B.dark, fontFamily: "monospace", border: `1px solid ${B.grey}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url}
              </div>
              <button onClick={() => copy(url)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif", whiteSpace: "nowrap" }}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Invite code</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "9px 12px", background: "#183230", borderRadius: 8, fontSize: 16, color: B.white, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", textAlign: "center" }}>
                {code}
              </div>
              <button onClick={() => copy(code)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif", whiteSpace: "nowrap" }}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: B.amber, marginTop: 16, background: B.amberLight, padding: "8px 12px", borderRadius: 6 }}>
            ⚠ Change the invite code in Vercel environment variables (NEXT_PUBLIC_INVITE_CODE) if it has been shared too widely.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/");
  }, [status, session, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (status === "authenticated") fetchUsers(); }, [status, fetchUsers]);

  const updateRole = async (id: string, role: string) => {
    setActionLoading(id + "-role");
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (id: string) => {
    setActionLoading(id + "-delete");
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeleteConfirm(null);
    await fetchUsers();
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "admin")) return null;

  return (
    <div style={{ minHeight: "100vh", background: B.offWhite, fontFamily: "Roboto, sans-serif" }}>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,50,48,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: B.white, borderRadius: 14, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: B.dark, marginBottom: 8 }}>Delete this user?</div>
            <div style={{ fontSize: 14, color: B.muted, marginBottom: 24 }}>This action cannot be undone. The user will lose access immediately.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${B.grey}`, background: B.white, cursor: "pointer", fontSize: 14, fontFamily: "Roboto, sans-serif" }}>Cancel</button>
              <button onClick={() => deleteUser(deleteConfirm)} disabled={!!actionLoading}
                style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: B.red, color: B.white, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Roboto, sans-serif" }}>
                {actionLoading ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: B.navy, padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/azure-logo.png" alt="Azure" style={{ height: 32, width: 32, borderRadius: 5, objectFit: "cover" }} />
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>User Management</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{session?.user?.name}</span>
            <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: B.white, borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Roboto, sans-serif" }}>
              ← Back to app
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
        {/* Page heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: B.dark }}>User Management</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: B.muted }}>{users.length} user{users.length !== 1 ? "s" : ""} · admin access only</p>
          </div>
          <button onClick={() => setShowInvite(true)} style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: B.navy, color: B.white, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", gap: 6, alignItems: "center",
          }}>
            + Invite user
          </button>
        </div>

        {/* Search */}
        <div style={{ background: B.white, borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 16 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width: "100%", padding: "9px 14px", borderRadius: 8, border: `1px solid ${B.grey}`, fontSize: 14, fontFamily: "Roboto, sans-serif", color: B.dark, boxSizing: "border-box" as const }}
          />
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total users", value: users.length },
            { label: "Admins", value: users.filter(u => u.role === "admin").length },
            { label: "Regular users", value: users.filter(u => u.role === "user").length },
          ].map(s => (
            <div key={s.label} style={{ background: B.white, borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: B.navy }}>{s.value}</div>
              <div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div style={{ background: B.white, borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {error && (
            <div style={{ padding: "14px 20px", background: B.redLight, color: B.red, fontSize: 13 }}>{error}</div>
          )}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: B.muted, fontSize: 14 }}>Loading users…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: B.muted, fontSize: 14 }}>
              {search ? "No users match your search." : "No users yet. Invite someone to get started."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: B.offWhite, borderBottom: `1px solid ${B.grey}` }}>
                  {["User", "Role", "Joined", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const isSelf = u.email === session?.user?.email;
                  return (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${B.grey}` : "none", background: isSelf ? "#FAFFF9" : B.white }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: B.navy, display: "flex", alignItems: "center", justifyContent: "center", color: B.white, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: B.dark }}>
                              {u.name} {isSelf && <span style={{ fontSize: 11, color: B.muted, fontWeight: 400 }}>(you)</span>}
                            </div>
                            <div style={{ fontSize: 12, color: B.muted }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {isSelf ? <RoleBadge role={u.role} /> : (
                          <select
                            value={u.role}
                            disabled={!!actionLoading}
                            onChange={e => updateRole(u.id, e.target.value)}
                            style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${B.grey}`, fontSize: 13, fontFamily: "Roboto, sans-serif", cursor: "pointer", background: B.white, color: B.dark }}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: B.muted }}>
                        {new Date(u.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {!isSelf && (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            disabled={!!actionLoading}
                            style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${B.red}`, background: B.white, color: B.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
