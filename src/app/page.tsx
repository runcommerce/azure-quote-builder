"use client";
import { useState } from "react";
import { DEFAULT_ADMIN, DEFAULT_API_CONFIG } from "@/lib/defaults";
import type { AdminConfig, ApiConfig, ExtractedSpec } from "@/lib/types";
import { buildPrompt, callExtractAPI, lookupMaterial, getJobDefaults, getDeliveryRule, generateItemDetails } from "@/lib/extract";
import Header from "@/components/Header";
import StepBar from "@/components/StepBar";
import UploadCard from "@/components/UploadCard";
import FlagsBar from "@/components/FlagsBar";
import PrintLogicPanel from "@/components/PrintLogicPanel";
import FieldGroups from "@/components/FieldGroups";
import ItemDetailsPanel from "@/components/ItemDetailsPanel";
import ActionBar from "@/components/ActionBar";
import ApprovedChecklist from "@/components/ApprovedChecklist";
import AdminPanel from "@/components/AdminPanel";

type Status = "idle" | "loading" | "done" | "approved";

export default function Home() {
  const [admin, setAdmin] = useState<AdminConfig>(DEFAULT_ADMIN);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [edited, setEdited] = useState<Partial<ExtractedSpec> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepIndex: Record<Status, number> = { idle: 0, loading: 1, done: 2, approved: 3 };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setEdited(null); setError(null); setStatus("idle");
  };

  const parseSpec = async () => {
    if (!file) return;
    setStatus("loading"); setError(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const cfg = apiConfig[apiConfig.provider as keyof ApiConfig] as { model: string; apiKey: string };
      const text = await callExtractAPI(base64, "application/pdf", apiConfig.provider, cfg.model, buildPrompt(admin), cfg.apiKey || "");
      const parsed: ExtractedSpec = JSON.parse(text.replace(/```json|```/g, "").trim());
      setEdited(parsed);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
      setStatus("idle");
    }
  };

  const updateField = (key: string, value: string) =>
    setEdited(prev => prev ? { ...prev, [key]: value } : prev);

  const flags = (edited as ExtractedSpec | null)?.confidence_flags || [];
  const plMaterial = lookupMaterial(edited, admin);
  const jobDefaults = getJobDefaults(edited, admin);
  const deliveryRule = getDeliveryRule(edited, admin);
  const itemDetails = generateItemDetails(edited);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F7", fontFamily: "Roboto, sans-serif" }}>
      {showAdmin && (
        <AdminPanel
          admin={admin} setAdmin={setAdmin}
          apiConfig={apiConfig} setApiConfig={setApiConfig}
          onClose={() => setShowAdmin(false)}
        />
      )}
      <Header onAdminClick={() => setShowAdmin(true)} />
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px" }}>
        <StepBar current={stepIndex[status]} />
        <UploadCard
          file={file} status={status} error={error}
          admin={admin} onFile={handleFile} onParse={parseSpec}
        />
        {(status === "done" || status === "approved") && edited && (
          <>
            {flags.length > 0 && <FlagsBar flags={flags} />}
            <PrintLogicPanel
              spec={edited} admin={admin}
              plMaterial={plMaterial} jobDefaults={jobDefaults} deliveryRule={deliveryRule}
            />
            <FieldGroups spec={edited} flags={flags} onUpdate={updateField} />
            <ItemDetailsPanel itemDetails={itemDetails} />
            <ActionBar
              status={status}
              onApprove={() => setStatus("approved")}
              onReset={() => { setFile(null); setEdited(null); setStatus("idle"); setError(null); }}
              jsonData={edited}
            />
            {status === "approved" && (
              <ApprovedChecklist
                spec={edited} admin={admin}
                plMaterial={plMaterial} jobDefaults={jobDefaults} deliveryRule={deliveryRule}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
