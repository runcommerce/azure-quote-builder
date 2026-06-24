"use client";
import { useState } from "react";
import { C, View } from "./tokens";
import Sidebar from "./Sidebar";
import HomeView from "./HomeView";
import UploadQuoteView from "./UploadQuoteView";
import NewQuoteView from "./NewQuoteView";
import QuotesView from "./QuotesView";
import CustomersView from "./CustomersView";
import IntelligenceView from "./IntelligenceView";
import AdminSettingsView from "./AdminSettingsView";
import ClientPortalsView from "./ClientPortalsView";
import EmailQuoteView from "./EmailQuoteView";

const TITLES: Record<View, string> = {
  "dashboard":      "Dashboard",
  "upload-quote":   "Upload RFQ Spec",
  "new-quote":      "New Quote",
  "email-quote":    "Email Quote Parser",
  "quotes":         "Quotes",
  "customers":      "Customers",
  "client-portals": "Client Portals",
  "pricing":        "Pricing Data",
  "intelligence":   "Intelligence",
  "admin-settings": "Admin Settings",
};

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--az-bg)", fontFamily: "var(--az-font)" }}>
      <Sidebar view={view} setView={setView} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
        {/* Topbar */}
        <div style={{
          background: "rgba(245,249,252,0.88)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--az-line)",
          padding: "0 28px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>
            {TITLES[view]}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {view !== "email-quote" && (
              <button onClick={() => setView("email-quote")}
                style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--az-line)", background: "var(--az-surface)", color: "var(--az-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✉ Email quote
              </button>
            )}
            {view !== "upload-quote" && (
              <button onClick={() => setView("upload-quote")}
                style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid var(--az-line)", background: "var(--az-surface)", color: "var(--az-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↑ Upload spec
              </button>
            )}
            {view !== "new-quote" && (
              <button onClick={() => setView("new-quote")}
                style={{ padding: "6px 14px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, var(--az-blue), var(--az-blue-dark))", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(20,153,214,0.28)" }}>
                + New quote
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {view === "dashboard"      && <HomeView setView={setView} recentQuotes={[]} />}
          {view === "upload-quote"   && <UploadQuoteView />}
          {view === "new-quote"      && <NewQuoteView setView={setView} />}
          {view === "email-quote"    && <EmailQuoteView />}
          {view === "quotes"         && <QuotesView setView={setView} />}
          {view === "customers"      && <CustomersView setView={setView} />}
          {view === "client-portals" && <ClientPortalsView />}
          {view === "intelligence"   && <IntelligenceView />}
          {view === "admin-settings" && <AdminSettingsView />}
          {view === "pricing"        && (
            <div style={{ padding: "28px 32px", maxWidth: 700 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--az-ink)", marginBottom: 6, letterSpacing: "-0.02em" }}>Pricing Data</h1>
              <p style={{ fontSize: 14, color: "var(--az-muted)", marginBottom: 24 }}>PrintLogic data sync status and pricing configuration.</p>
              <div style={{ background: "var(--az-surface)", borderRadius: "var(--az-radius-md)", border: "1px solid var(--az-red-light)", padding: "20px", marginBottom: 14, boxShadow: "var(--az-shadow)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-red)", marginBottom: 8 }}>⚠ Pricing data has never been synced from PrintLogic</div>
                <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--az-muted)", marginBottom: 14 }}>
                  <span>Paper stock: <strong>never</strong></span>
                  <span>Finishing: <strong>never</strong></span>
                </div>
                <button style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, var(--az-blue), var(--az-blue-dark))", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(20,153,214,0.25)" }}>
                  Refresh now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
