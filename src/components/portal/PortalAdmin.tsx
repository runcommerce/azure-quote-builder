/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import PortalShell, { PortalConfig } from "./PortalShell";

export default function PortalAdmin({ portal, requests }: { portal: PortalConfig; requests: any[] }) {
  const pc = portal.primary_color || "#183230";

  const exportCsv = () => {
    const header = "Reference,User,Email,Items,Status,PO,Submitted";
    const lines = [header];
    requests.forEach(r => {
      const cols = [
        r.reference,
        r.user_name,
        r.user_email,
        String(r.items?.length || 0) + " items",
        r.status,
        r.po_number || "",
        new Date(r.submitted_at).toLocaleDateString(),
      ];
      lines.push(cols.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","));
    });
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = portal.slug + "-requests.csv";
    a.click();
  };

  const STATUS: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FEF3C7", color: "#92400E" },
    reviewing: { bg: "#DBEAFE", color: "#1E40AF" },
    quoted:    { bg: "#D1FAE5", color: "#065F46" },
    approved:  { bg: "#EDE9FE", color: "#5B21B6" },
    completed: { bg: "#F0FDF4", color: "#166534" },
  };

  return (
    <PortalShell portal={portal} activePage="ADMIN">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 15, color: "#6b7280" }}>All quotes and orders across {portal.company_name}.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, cursor: "pointer" }}>
              Users &amp; Invitations
            </button>
            <button onClick={exportCsv} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: pc, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Export CSV
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f7f4", borderBottom: "1px solid #e5e7eb" }}>
                {["REFERENCE", "USER", "STATUS", "PO", "CREATED"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                    No requests yet.
                  </td>
                </tr>
              ) : requests.map((r: any, i: number) => {
                const s = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.reference || i} style={{ borderBottom: i < requests.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: pc, fontSize: 14 }}>{r.reference}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{r.user_name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{r.user_email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{r.po_number || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af" }}>
                      {new Date(r.submitted_at).toLocaleDateString("en-IE")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <button onClick={() => window.location.href = "/portal/" + portal.slug}
              style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              ← Back to catalog
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
