"use client";
import { B } from "@/lib/types";
const STEPS = ["Upload", "Extract", "Review", "Ready"];
export default function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done || active ? B.navy : B.grey, color: done || active ? "#fff" : B.muted, fontSize: 12, fontWeight: 700 }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? B.navy : B.muted, whiteSpace: "nowrap" }}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? B.navy : B.grey, margin: "0 6px", marginBottom: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}
