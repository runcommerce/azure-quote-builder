/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell, { PortalConfig } from "./PortalShell";

const STATUS = {
  pending:    { bg: "#FEF3C7", color: "#92400E", label: "Pending"    },
  reviewing:  { bg: "#DBEAFE", color: "#1E40AF", label: "Reviewing"  },
  quoted:     { bg: "#D1FAE5", color: "#065F46", label: "Quoted"     },
  approved:   { bg: "#EDE9FE", color: "#5B21B6", label: "Approved"   },
  completed:  { bg: "#F0FDF4", color: "#166534", label: "Completed"  },
};

export default function PortalMyQuotes({ portal }: { portal: PortalConfig }) {
  const pc = portal.primary_color || "#1a3a2e";
  const [requests, setRequests] = useState<{ reference: string; status: string; submitted_at: string; items: { product: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/${portal.slug}/requests`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [portal.slug]);

  return (
    <PortalShell portal={portal} activePage="MY QUOTES & ORDERS">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", marginBottom: 4 }}>My Quotes & Orders</h1>
            <p style={{ fontSize: 15, color: "#6b7280" }}>{portal.company_name} · all submitted requests</p>
          </div>
          <Link href={`/portal/${portal.slug}/request-quote`}
            style={{ padding: "11px 22px", borderRadius: 24, background: pc, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            + New request
          </Link>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading…</div>
        : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 32px", border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 6 }}>No quotes yet</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Create a quote request and Azure Communications will respond shortly.</div>
            <Link href={`/portal/${portal.slug}/request-quote`}
              style={{ padding: "12px 24px", borderRadius: 24, background: pc, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Request a quote
            </Link>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Reference", "Items", "Status", "Submitted", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const s = STATUS[r.status as keyof typeof STATUS] || STATUS.pending;
                  return (
                    <tr key={r.reference} style={{ borderBottom: i < requests.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: pc, fontSize: 14 }}>{r.reference}</td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{r.items?.length || 0} item{(r.items?.length || 0) !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#9ca3af" }}>{new Date(r.submitted_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
