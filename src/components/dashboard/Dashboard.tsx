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
  "dashboard": "Dashboard", "upload-quote": "Upload RFQ",
  "new-quote": "New Quote", "email-quote": "Email Quote",
  "quotes": "Quotes", "customers": "Customers",
  "client-portals": "Client Portals", "pricing": "Pricing Data",
  "intelligence": "Intelligence", "admin-settings": "Admin Settings",
};

const pill = (primary: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 999,
  border: primary ? "none" : "1.5px solid rgba(26,58,46,0.18)",
  background: primary ? "#1a3a2e" : "#fff",
  color: primary ? "#c8e63c" : "#1a3a2e",
  fontSize: 12.5, fontWeight: primary ? 700 : 600, cursor: "pointer",
  fontFamily: "var(--az-font)",
  boxShadow: primary ? "0 3px 12px rgba(26,58,46,0.20)" : "none",
});

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--az-off-white)", fontFamily: "var(--az-font)" }}>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar — single, no duplicate */}
        <div style={{ background: "#fff", borderBottom: "1px solid rgba(26,58,46,0.09)", padding: "0 22px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 6px rgba(14,31,24,0.05)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--az-muted)", letterSpacing: "0.13em", textTransform: "uppercase" }}>Azure IQ</span>
            <span style={{ color: "rgba(26,58,46,0.20)", fontSize: 13 }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--az-ink)", letterSpacing: "-0.01em" }}>{TITLES[view]}</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {view !== "email-quote"  && <button onClick={() => setView("email-quote")}  style={pill(false)}>✉ Email</button>}
            {view !== "upload-quote" && <button onClick={() => setView("upload-quote")} style={pill(false)}>↑ Upload</button>}
            {view !== "new-quote"    && <button onClick={() => setView("new-quote")}    style={pill(true)}>+ New quote →</button>}
          </div>
        </div>

        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
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
            <div style={{ padding: "16px 24px" }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--az-ink)", marginBottom: 14 }}>Pricing Data</h1>
              <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid var(--az-red-light)", padding: "16px 18px", maxWidth: 560 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--az-red)", marginBottom: 6 }}>⚠ Pricing data has never been synced from PrintLogic</div>
                <div style={{ fontSize: 13, color: "var(--az-muted)", marginBottom: 14 }}>Paper stock: <strong>never</strong> · Finishing: <strong>never</strong></div>
                <button style={pill(true)}>Refresh now →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
