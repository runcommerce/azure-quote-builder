"use client";
import { useState } from "react";
import { C } from "./tokens";
import AdminPanel from "@/components/AdminPanel";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import type { AdminConfig, ApiConfig } from "@/lib/types";

export default function AdminSettingsView() {
  const [admin, setAdmin] = useState<AdminConfig>(DEFAULT_ADMIN);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700 }}>
      {showPanel && <AdminPanel admin={admin} setAdmin={setAdmin} apiConfig={apiConfig} setApiConfig={setApiConfig} onClose={() => setShowPanel(false)} />}
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.dark }}>Admin Settings</h1>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: C.muted }}>Configure API keys, portal customers, job types, material lookup and follow-up rules.</p>

      {[
        { title: "API Provider", desc: "Connect Claude (Anthropic), OpenAI or a custom LLM for PDF extraction and quote intelligence.", icon: "🤖", action: "Configure" },
        { title: "Portal Customers", desc: "Toggle HH Global, Custodian, Konica and set how their RFQs arrive (PDF, email, API).", icon: "🏢", action: "Configure" },
        { title: "Job Type Defaults", desc: "Set default stock, sides and delivery per job type. Aaron to validate stock selections.", icon: "📋", action: "Configure" },
        { title: "Material Lookup", desc: "Map plain-English spec terms to exact PrintLogic stock names.", icon: "🗂", action: "Configure" },
        { title: "Delivery Rules", desc: "Activate and tune courier rules — Dublin, Nationwide, Pallet, Truck.", icon: "🚚", action: "Configure" },
        { title: "Follow-up Automation", desc: "Configure Day 2 email and Day 5 rep alert triggers.", icon: "📤", action: "Configure" },
        { title: "User Management", desc: "View, promote or remove users. Generate invite codes.", icon: "👥", action: () => window.location.href = "/admin" },
      ].map(item => (
        <div key={item.title} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.grey}`, padding: "18px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          </div>
          <button onClick={() => typeof item.action === "function" ? item.action() : setShowPanel(true)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.grey}`, background: C.white, color: C.dark, fontSize: 13, cursor: "pointer", fontFamily: "Roboto, sans-serif", flexShrink: 0, marginLeft: 20 }}>
            {typeof item.action === "string" ? item.action : "Open →"}
          </button>
        </div>
      ))}
    </div>
  );
}
