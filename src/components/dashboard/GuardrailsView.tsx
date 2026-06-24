"use client";
import { useState } from "react";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 42, height: 23, borderRadius: 12, background: value ? "#1a3a2e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.18s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2.5, left: value ? 21 : 2.5, width: 18, height: 18, borderRadius: "50%", background: value ? "#c8e63c" : "#fff", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

interface GuardrailRule {
  id: string; group: string; label: string; desc: string;
  enabled: boolean; value?: string | number; type: "toggle" | "number" | "text" | "select";
  options?: string[]; min?: number; max?: number; unit?: string; severity: "critical" | "high" | "medium";
}

const SEV_STYLES = {
  critical: { bg: "#fee2e2", color: "#991b1b", label: "Critical" },
  high:     { bg: "#fef3c7", color: "#92400e", label: "High"     },
  medium:   { bg: "#e0f2fe", color: "#0369a1", label: "Medium"   },
};

const INITIAL: GuardrailRule[] = [
  // What AI cannot do
  { id: "no-send-email",   group: "Hard limits",    severity: "critical", type: "toggle", enabled: true,  label: "Never send email without human approval",       desc: "The AI cannot dispatch any email to a customer without explicit human confirmation. Drafts are always shown first." },
  { id: "no-commit-price", group: "Hard limits",    severity: "critical", type: "toggle", enabled: true,  label: "Never commit to a price without Aaron sign-off", desc: "AI-suggested prices are estimates only. Any quote sent to a customer must be approved by a human with pricing authority." },
  { id: "no-accept-order", group: "Hard limits",    severity: "critical", type: "toggle", enabled: true,  label: "Never accept or confirm an order",                desc: "Order acceptance requires human action in PrintLogic. The AI can never confirm a job is in production." },
  { id: "no-pii-store",    group: "Hard limits",    severity: "critical", type: "toggle", enabled: true,  label: "Never store customer PII beyond session",         desc: "Customer names, emails and addresses are used for quote generation only. Not retained in AI memory between sessions." },
  // Financial limits
  { id: "max-quote-value", group: "Financial limits", severity: "high",   type: "number", enabled: true,  value: 5000, min: 500, max: 50000, unit: "€", label: "Max quote value for autonomous action", desc: "Quotes above this value always require human review regardless of agent mode or confidence level." },
  { id: "min-margin",      group: "Financial limits", severity: "high",   type: "number", enabled: true,  value: 25,   min: 10,  max: 60,    unit: "%", label: "Minimum acceptable margin",             desc: "AI will not suggest pricing below this margin. If the spec forces it below, escalate to Jenny." },
  { id: "discount-limit",  group: "Financial limits", severity: "high",   type: "number", enabled: true,  value: 10,   min: 0,   max: 25,    unit: "%", label: "Maximum AI-suggested discount",         desc: "AI can suggest promotional discounts up to this % on repeat business. Beyond this, always escalate." },
  // Communication rules
  { id: "tone-check",      group: "Communication",   severity: "medium",  type: "toggle", enabled: true,  label: "Tone review on all outbound drafts",              desc: "All AI-drafted emails are checked for appropriate tone (professional, not robotic, not overly casual) before showing to user." },
  { id: "ack-hours",       group: "Communication",   severity: "medium",  type: "number", enabled: true,  value: 8,    min: 1,   max: 24,    unit: "hrs", label: "Acknowledgement SLA commitment",     desc: "The stated response time in auto-acknowledgements. AI will not promise faster than this." },
  { id: "no-competitor",   group: "Communication",   severity: "medium",  type: "toggle", enabled: true,  label: "Never mention competitor names",                  desc: "AI responses may not reference, compare to, or name any competitor print companies." },
  { id: "escalate-angry",  group: "Communication",   severity: "high",    type: "toggle", enabled: true,  label: "Escalate unhappy customer signals immediately",    desc: "If AI detects frustration, complaint language or urgency in an email, immediately flag to the assigned account manager rather than auto-responding." },
  // Data
  { id: "use-kb-only",     group: "Data & Sources",  severity: "high",    type: "toggle", enabled: true,  label: "Only use confirmed Knowledge Base for pricing",   desc: "AI pricing suggestions must be grounded in confirmed Knowledge Base entries. It cannot make up prices from general knowledge." },
  { id: "cite-rules",      group: "Data & Sources",  severity: "medium",  type: "toggle", enabled: true,  label: "Cite Knowledge Base rules in agent reasoning",     desc: "Every agent action includes a reasoning trail showing which KB entries it used. Visible in the Agent Queue." },
  { id: "no-web-browse",   group: "Data & Sources",  severity: "critical", type: "toggle", enabled: true, label: "No web browsing for pricing data",                desc: "Agent must not look up competitor prices, stock costs or delivery rates from the web. Only internal data sources." },
];

const GROUPS = ["Hard limits", "Financial limits", "Communication", "Data & Sources"];

const inp: React.CSSProperties = { padding: "6px 10px", borderRadius: 7, border: "1.5px solid rgba(26,58,46,0.14)", fontSize: 13.5, fontFamily: "var(--az-font)", color: "#0e1f18", background: "#fff" };

export default function GuardrailsView() {
  const [rules, setRules] = useState<GuardrailRule[]>(INITIAL);
  const update = (id: string, patch: Partial<GuardrailRule>) => setRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const criticalOff = rules.filter(r => r.severity === "critical" && !r.enabled);

  return (
    <div style={{ padding: "16px 24px 32px", maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5a7066", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 3 }}>Agent Safety</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0e1f18", letterSpacing: "-0.02em" }}>Guardrails</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#5a7066" }}>
          Hard and soft limits on what the AI can do. Critical guardrails cannot be disabled in supervised mode.
        </p>
      </div>

      {criticalOff.length > 0 && (
        <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 14 }}>{criticalOff.length} critical guardrail{criticalOff.length > 1 ? "s" : ""} disabled</div>
            <div style={{ fontSize: 13, color: "#991b1b" }}>Re-enable these before activating any agents. Critical guardrails protect customer data and financial commitments.</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "All active", val: rules.filter(r => r.enabled).length + "/" + rules.length, good: true },
          { label: "Critical on", val: rules.filter(r => r.severity === "critical" && r.enabled).length + "/" + rules.filter(r => r.severity === "critical").length, good: criticalOff.length === 0 },
          { label: "High on", val: rules.filter(r => r.severity === "high" && r.enabled).length + "/" + rules.filter(r => r.severity === "high").length, good: true },
          { label: "Custom rules", val: "0", good: true },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(26,58,46,0.09)", padding: "10px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.good ? "#1a3a2e" : "#991b1b" }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rules by group */}
      {GROUPS.map(group => (
        <div key={group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7066", textTransform: "uppercase" as const, letterSpacing: "0.10em", marginBottom: 10 }}>{group}</div>
          <div style={{ display: "grid", gap: 8 }}>
            {rules.filter(r => r.group === group).map(rule => {
              const sev = SEV_STYLES[rule.severity];
              return (
                <div key={rule.id} style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${!rule.enabled && rule.severity === "critical" ? "#fca5a5" : "rgba(26,58,46,0.09)"}`, padding: "13px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0e1f18" }}>{rule.label}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: sev.bg, color: sev.color }}>{sev.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#5a7066", lineHeight: 1.55, marginBottom: rule.type !== "toggle" ? 10 : 0 }}>{rule.desc}</div>
                    {/* Value input for non-toggle rules */}
                    {rule.type === "number" && rule.enabled && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <input type="number" value={rule.value as number} min={rule.min} max={rule.max}
                          onChange={e => update(rule.id, { value: Number(e.target.value) })}
                          style={{ ...inp, width: 80 }} />
                        <span style={{ fontSize: 13, color: "#5a7066", fontWeight: 600 }}>{rule.unit}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>min {rule.min}{rule.unit} · max {rule.max}{rule.unit}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <Toggle value={rule.enabled} onChange={v => update(rule.id, { enabled: v })} />
                    {rule.severity === "critical" && !rule.enabled && (
                      <span style={{ fontSize: 10.5, color: "#991b1b", fontWeight: 700 }}>⚠ Unsafe</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Custom rule add */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1.5px dashed rgba(26,58,46,0.20)", padding: "16px", textAlign: "center" as const }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0e1f18", marginBottom: 4 }}>Add a custom guardrail</div>
        <div style={{ fontSize: 13, color: "#5a7066", marginBottom: 12 }}>Define specific rules for your business — e.g. "Never quote Winthrop without checking contract rates first"</div>
        <button style={{ padding: "8px 18px", borderRadius: 999, border: "1.5px solid rgba(26,58,46,0.18)", background: "#fff", color: "#1a3a2e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add custom rule
        </button>
      </div>
    </div>
  );
}
