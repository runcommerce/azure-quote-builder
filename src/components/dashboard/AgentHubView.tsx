"use client";
import { useState } from "react";


// ── Types ──────────────────────────────────────────────────────────────────
interface AgentToggle {
  id: string;
  label: string;
  desc: string;
  icon: string;
  enabled: boolean;
  mode: "auto" | "supervised"; // auto = fires immediately, supervised = queues for approval
  confidence: number; // minimum confidence % to act
  lastRun?: string;
  runCount?: number;
  category: "email" | "quote" | "pricing" | "crm" | "portal";
}

// ── Small components ───────────────────────────────────────────────────────
function Toggle({ value, onChange, size = "md" }: { value: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" | "lg" }) {
  const w = size === "lg" ? 52 : size === "sm" ? 32 : 42;
  const h = size === "lg" ? 28 : size === "sm" ? 18 : 23;
  const d = size === "lg" ? 22 : size === "sm" ? 13 : 18;
  return (
    <div onClick={() => onChange(!value)} style={{ width: w, height: h, borderRadius: h, background: value ? "#1a3a2e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: (h - d) / 2, left: value ? w - d - (h - d) / 2 : (h - d) / 2, width: d, height: d, borderRadius: "50%", background: value ? "#c8e63c" : "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function ConfidenceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="range" min={50} max={99} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#1a3a2e", height: 4, cursor: "pointer" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a3a2e", minWidth: 36 }}>{value}%</span>
    </div>
  );
}

const STATUS_PILL = (enabled: boolean, mode: "auto" | "supervised") => {
  if (!enabled) return { bg: "#f3f4f6", color: "#9ca3af", label: "Off" };
  if (mode === "supervised") return { bg: "#fef3c7", color: "#92400e", label: "Supervised" };
  return { bg: "#dcfce7", color: "#166534", label: "Autonomous" };
};

// ── Agent card ─────────────────────────────────────────────────────────────
function AgentCard({ agent, onUpdate }: { agent: AgentToggle; onUpdate: (a: AgentToggle) => void }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_PILL(agent.enabled, agent.mode);
  const CATEGORY_COLORS: Record<string, string> = {
    email: "#dbeafe", quote: "#e0f2fe", pricing: "#d1fae5", crm: "#ede9fe", portal: "#fce7f3",
  };
  const CATEGORY_TEXT: Record<string, string> = {
    email: "#1e40af", quote: "#0369a1", pricing: "#065f46", crm: "#5b21b6", portal: "#9d174d",
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${agent.enabled ? "#1a3a2e" : "rgba(26,58,46,0.09)"}`, overflow: "hidden", transition: "border-color 0.2s", boxShadow: agent.enabled ? "0 2px 16px rgba(26,58,46,0.10)" : "0 1px 6px rgba(14,31,24,0.05)" }}>
      {/* Header row */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: agent.enabled ? "linear-gradient(135deg, #1a3a2e, #2a5a46)" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          {agent.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0e1f18" }}>{agent.label}</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: CATEGORY_COLORS[agent.category] || "#f3f4f6", color: CATEGORY_TEXT[agent.category] || "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{agent.category}</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, marginLeft: "auto" }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#5a7066", lineHeight: 1.5 }}>{agent.desc}</div>
          {agent.runCount !== undefined && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {agent.runCount} actions · last run {agent.lastRun || "never"}
            </div>
          )}
        </div>
        <Toggle value={agent.enabled} onChange={v => onUpdate({ ...agent, enabled: v })} />
      </div>

      {/* Expand / collapse settings */}
      {agent.enabled && (
        <>
          <div style={{ borderTop: "1px solid rgba(26,58,46,0.08)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "rgba(26,58,46,0.02)" }} onClick={() => setExpanded(v => !v)}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5a7066" }}>Agent settings</span>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
          </div>

          {expanded && (
            <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(26,58,46,0.06)", display: "grid", gap: 16 }}>
              {/* Mode */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Automation mode</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { id: "supervised", label: "Supervised", desc: "Queues for human approval before any action", icon: "👤" },
                    { id: "auto",       label: "Autonomous",  desc: "Acts immediately above confidence threshold", icon: "⚡" },
                  ].map(m => (
                    <button key={m.id} onClick={() => onUpdate({ ...agent, mode: m.id as "auto" | "supervised" })}
                      style={{ padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${agent.mode === m.id ? "#1a3a2e" : "rgba(26,58,46,0.14)"}`, background: agent.mode === m.id ? "rgba(26,58,46,0.06)" : "#fff", textAlign: "left" as const, cursor: "pointer" }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>{m.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18" }}>{m.label}</div>
                      <div style={{ fontSize: 11.5, color: "#5a7066", lineHeight: 1.4, marginTop: 2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
                {agent.mode === "auto" && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fcd34d", fontSize: 12, color: "#92400e" }}>
                    ⚠ Autonomous mode will act without human review. Ensure guardrails are configured.
                  </div>
                )}
              </div>

              {/* Confidence threshold */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
                  Confidence threshold — below this, always escalate to human
                </div>
                <ConfidenceSlider value={agent.confidence} onChange={v => onUpdate({ ...agent, confidence: v })} />
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}>
                  {agent.confidence >= 90 ? "Very strict — AI acts only when very certain" : agent.confidence >= 75 ? "Balanced — good for most tasks" : "Permissive — AI acts more often, review output carefully"}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────
const INITIAL_AGENTS: AgentToggle[] = [
  {
    id: "email-parse",       category: "email",   icon: "✉",  enabled: false, mode: "supervised", confidence: 85, runCount: 0,
    label: "Email RFQ Parser",
    desc: "Automatically detects incoming quote requests in quotes@azurecomm.ie, extracts spec fields using Claude, and creates a draft quote entry ready for review.",
  },
  {
    id: "email-ack",         category: "email",   icon: "📤", enabled: false, mode: "supervised", confidence: 90, runCount: 0,
    label: "Quote Acknowledgement",
    desc: "Sends a personalised acknowledgement email when an RFQ arrives, confirming receipt and setting a response expectation (8 hours). Draft shown for approval before sending.",
  },
  {
    id: "email-followup",    category: "email",   icon: "⏰", enabled: false, mode: "supervised", confidence: 88, runCount: 0,
    label: "Quote Follow-up",
    desc: "Day 2: AI drafts a personalised follow-up for unanswered quotes. Day 5: flags for rep call. High-value quotes (above threshold) always escalate to human.",
  },
  {
    id: "quote-draft",       category: "quote",   icon: "📋", enabled: false, mode: "supervised", confidence: 80, runCount: 0,
    label: "Auto Quote Draft",
    desc: "From a parsed email or portal spec, AI builds a complete draft quote: product type, substrate, quantity breaks, finishing, delivery — applying all Aaron's rules from the Knowledge Base.",
  },
  {
    id: "quote-pricing",     category: "pricing", icon: "💶", enabled: false, mode: "supervised", confidence: 85, runCount: 0,
    label: "AI Pricing Suggestion",
    desc: "Suggests a price for each quote line using historical won quotes, stock costs from the Knowledge Base, and the configured markup %. Always requires human sign-off.",
  },
  {
    id: "spec-clarify",      category: "quote",   icon: "❓", enabled: false, mode: "supervised", confidence: 75, runCount: 0,
    label: "Missing Spec Clarification",
    desc: "When a quote request is missing critical fields (size, quantity, stock weight), AI drafts a targeted clarification email — only asks for what's actually missing.",
  },
  {
    id: "portal-response",   category: "portal",  icon: "🏢", enabled: false, mode: "supervised", confidence: 85, runCount: 0,
    label: "Portal Request Handler",
    desc: "When a client portal request arrives, AI extracts the spec, checks the product catalogue, and drafts a response or quote. Routed to the assigned account manager.",
  },
  {
    id: "lapsed-customer",   category: "crm",     icon: "🔄", enabled: false, mode: "supervised", confidence: 80, runCount: 0,
    label: "Lapsed Customer Re-engagement",
    desc: "Weekly: identifies customers with no order in 8+ weeks matching seasonal patterns. Drafts a personalised outreach email for Lisa's review. Never sends autonomously.",
  },
  {
    id: "post-delivery",     category: "crm",     icon: "✅", enabled: false, mode: "supervised", confidence: 88, runCount: 0,
    label: "Post-Delivery Follow-up",
    desc: "1–2 days after a job delivers, AI drafts a brief check-in email ('your job went out — what's next?'). Links to the portal for easy reordering.",
  },
  {
    id: "tender-draft",      category: "quote",   icon: "📄", enabled: false, mode: "supervised", confidence: 70, runCount: 0,
    label: "Tender Writing Assistant",
    desc: "When Jenny flags a tender opportunity, AI drafts a first-pass response using the Knowledge Base (Azure capabilities, accreditations, past wins). Always human-reviewed.",
  },
];

export default function AgentHubView({ setView }: { setView: (v: string) => void }) {
  const [agents, setAgents] = useState<AgentToggle[]>(INITIAL_AGENTS);
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [filter, setFilter] = useState<"all" | "email" | "quote" | "pricing" | "crm" | "portal">("all");
  const [showQueue, setShowQueue] = useState(false);

  const updateAgent = (updated: AgentToggle) => setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
  const enabledCount = agents.filter(a => a.enabled).length;
  const filteredAgents = filter === "all" ? agents : agents.filter(a => a.category === filter);

  const CATEGORIES = [
    { id: "all",     label: "All agents",   count: agents.length },
    { id: "email",   label: "Email",        count: agents.filter(a => a.category === "email").length },
    { id: "quote",   label: "Quoting",      count: agents.filter(a => a.category === "quote").length },
    { id: "pricing", label: "Pricing",      count: agents.filter(a => a.category === "pricing").length },
    { id: "crm",     label: "CRM",          count: agents.filter(a => a.category === "crm").length },
    { id: "portal",  label: "Portals",      count: agents.filter(a => a.category === "portal").length },
  ];

  return (
    <div style={{ padding: "16px 24px 32px", maxWidth: 1000 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5a7066", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 3 }}>Azure IQ · Agentic Layer</div>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>Agent Hub</h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "#5a7066", lineHeight: 1.6, maxWidth: 600 }}>
              Automation with a human in the loop. Every agent queues its work for your approval before acting — unless you explicitly enable autonomous mode.
            </p>
          </div>
          {/* Master kill switch */}
          <div style={{ background: masterEnabled ? "rgba(26,58,46,0.07)" : "#fff", border: `1.5px solid ${masterEnabled ? "#1a3a2e" : "rgba(26,58,46,0.14)"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, minWidth: 200 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18" }}>Agents {masterEnabled ? "active" : "paused"}</div>
              <div style={{ fontSize: 11.5, color: "#5a7066" }}>{enabledCount} of {agents.length} enabled</div>
            </div>
            <Toggle value={masterEnabled} onChange={setMasterEnabled} size="lg" />
          </div>
        </div>

        {/* Status bar */}
        {!masterEnabled && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f3f4f6", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⏸</span>
            <span>All agents are paused. Enable the master switch and individual agents to start automation.</span>
          </div>
        )}
        {masterEnabled && enabledCount === 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fcd34d", fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠</span>
            <span>Master switch is on but no individual agents are enabled. Toggle individual agents below.</span>
          </div>
        )}
        {masterEnabled && enabledCount > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#dcfce7", borderRadius: 8, border: "1px solid #86efac", fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <span>✓ {enabledCount} agent{enabledCount !== 1 ? "s" : ""} active — check the <button onClick={() => setView("agent-queue")} style={{ color: "#166534", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: 13 }}>Agent Queue</button> for items awaiting your approval.</span>
            <button onClick={() => setView("agent-queue")}
              style={{ padding: "5px 14px", borderRadius: 999, border: "none", background: "#166534", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              View queue →
            </button>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Knowledge Base",  desc: "Print rules, pricing, customer data", icon: "📚", view: "knowledge-base" },
          { label: "Guardrails",      desc: "What AI can/cannot do autonomously",  icon: "🛡",  view: "guardrails" },
          { label: "Agent Queue",     desc: "Items awaiting your approval",        icon: "📥", view: "agent-queue" },
          { label: "MCP Connections", desc: "Email, PrintLogic, portal APIs",      icon: "🔌", view: "admin-settings" },
        ].map(q => (
          <button key={q.label} onClick={() => setView(q.view as string)}
            style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(26,58,46,0.09)", padding: "12px 14px", textAlign: "left" as const, cursor: "pointer", boxShadow: "0 1px 6px rgba(14,31,24,0.05)", transition: "border-color 0.12s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#c8e63c"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,58,46,0.09)"}>
            <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{q.icon}</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1f18", marginBottom: 2 }}>{q.label}</div>
            <div style={{ fontSize: 11.5, color: "#5a7066", lineHeight: 1.4 }}>{q.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Category filter ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id as typeof filter)}
            style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${filter === cat.id ? "#1a3a2e" : "rgba(26,58,46,0.14)"}`, background: filter === cat.id ? "#1a3a2e" : "#fff", color: filter === cat.id ? "#c8e63c" : "#5a7066", fontSize: 12.5, fontWeight: filter === cat.id ? 700 : 500, cursor: "pointer", fontFamily: "var(--az-font)" }}>
            {cat.label} <span style={{ opacity: 0.6, fontSize: 11 }}>({cat.count})</span>
          </button>
        ))}
      </div>

      {/* ── Agent cards ── */}
      <div style={{ display: "grid", gap: 10 }}>
        {filteredAgents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onUpdate={updateAgent} />
        ))}
      </div>
    </div>
  );
}
