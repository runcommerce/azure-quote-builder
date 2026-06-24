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

export default function Dashboard() {
  const [view, setView] = useState<View>("dashboard");

  const headerTitles: Record<View, string> = {
    "dashboard":      "Dashboard",
    "upload-quote":   "Upload RFQ Spec",
    "new-quote":      "New Quote",
    "quotes":         "Quotes",
    "customers":      "Customers",
    "pricing":        "Pricing Data",
    "intelligence":   "Intelligence",
    "admin-settings": "Admin Settings",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.offWhite, fontFamily: "Roboto, sans-serif" }}>
      <Sidebar view={view} setView={setView} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "auto" }}>
        {/* Top bar */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.grey}`, padding: "0 32px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{headerTitles[view]}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {view !== "upload-quote" && (
              <button onClick={() => setView("upload-quote")}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.grey}`, background: C.white, color: C.greyDark, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                📄 Upload spec
              </button>
            )}
            {view !== "new-quote" && (
              <button onClick={() => setView("new-quote")}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: C.navy, color: C.white, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                ✚ New quote
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {view === "dashboard"      && <HomeView setView={setView} recentQuotes={[]} />}
          {view === "upload-quote"   && <UploadQuoteView />}
          {view === "new-quote"      && <NewQuoteView setView={setView} />}
          {view === "quotes"         && <QuotesView setView={setView} />}
          {view === "customers"      && <CustomersView setView={setView} />}
          {view === "intelligence"   && <IntelligenceView />}
          {view === "admin-settings" && <AdminSettingsView />}
          {view === "pricing"        && (
            <div style={{ padding: "28px 32px", maxWidth: 700 }}>
              <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.dark }}>Pricing Data</h1>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: C.muted }}>PrintLogic data sync status and pricing configuration.</p>
              <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.redBorder}`, padding: "20px", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠ Pricing data has never been synced from PrintLogic</div>
                <div style={{ display: "flex", gap: 20, fontSize: 13, color: C.muted, marginBottom: 14 }}>
                  <span>Paper stock: <strong>never</strong></span>
                  <span>Finishing: <strong>never</strong></span>
                  <span>Click charges: <strong>never</strong></span>
                </div>
                <button style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  Refresh now
                </button>
              </div>
              <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>PrintLogic Integration</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  Connect PrintLogic via API to enable automatic pricing. Contact David O'Neill to confirm API access. Until then, quotes will show estimated ranges based on historical data.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
