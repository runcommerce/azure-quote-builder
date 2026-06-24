"use client";
import { useState } from "react";
import { View } from "./tokens";
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

// Pill button styles matching azurecomm.ie
const pillBtn = (primary: boolean): React.CSSProperties => ({
  padding: "7px 18px",
  borderRadius: 999,
  border: primary ? "none" : "1.5px solid rgba(26,58,46,0.20)",
  background: primary ? "#1a3a2e" : "#ffffff",
  color: primary ? "var(--az-lime)" : "#1a3a2e",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: "var(--az-font)",
  boxShadow: primary ? "0 3px 14px rgba(26,58,46,0.22)" : "none",
  transition: "all 0.14s",
  letterSpacing: "0.01em",
});

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--az-off-white)", fontFamily: "var(--az-font)" }}>
      <Sidebar view={view} setView={setView} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
        {/* White topbar — matches azurecomm.ie header style */}
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(26,58,46,0.10)",
          padding: "0 28px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
          boxShadow: "0 1px 8px rgba(14,31,24,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--az-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Azure IQ
            </span>
            <span style={{ color: "rgba(26,58,46,0.20)" }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>
              {TITLES[view]}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view !== "email-quote" && (
              <button onClick={() => setView("email-quote")} style={{ ...pillBtn(false), padding: "6px 14px", fontSize: 12.5 }}>
                ✉ Email quote
              </button>
            )}
            {view !== "upload-quote" && (
              <button onClick={() => setView("upload-quote")} style={{ ...pillBtn(false), padding: "6px 14px", fontSize: 12.5 }}>
                ↑ Upload spec
              </button>
            )}
            {view !== "new-quote" && (
              <button onClick={() => setView("new-quote")} style={pillBtn(true)}>
                + New quote →
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
          {view === "pricing" && (
            <div style={{ padding: "28px 32px", maxWidth: 680 }}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--az-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pricing</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--az-ink)", marginBottom: 20, letterSpacing: "-0.02em" }}>Pricing Data</h1>
              <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid var(--az-red-light)", padding: "20px 22px", marginBottom: 12, boxShadow: "var(--az-shadow)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--az-red)", marginBottom: 6 }}>⚠ Pricing data has never been synced from PrintLogic</div>
                <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--az-muted)", marginBottom: 16 }}>
                  <span>Paper stock: <strong>never</strong></span>
                  <span>Finishing: <strong>never</strong></span>
                </div>
                <button style={pillBtn(true)}>Refresh now →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
