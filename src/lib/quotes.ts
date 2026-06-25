// Re-exports from QuotesView so other components can save quotes
// without importing the full React component
import type { QuoteRecord, QuoteStatus } from "./types";
export type { QuoteRecord, QuoteStatus };

const STORE_KEY = "azure_iq_quotes";

export function loadQuotes(): QuoteRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}

export function saveQuote(q: QuoteRecord): void {
  const all = loadQuotes();
  const idx = all.findIndex(r => r.id === q.id);
  if (idx >= 0) all[idx] = q; else all.unshift(q);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function deleteQuote(id: string): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(loadQuotes().filter(q => q.id !== id)));
}

export function newQuoteId(): string {
  return "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}
