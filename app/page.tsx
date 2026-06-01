"use client";

import { useState, useEffect, useCallback } from "react";
import Controls, { type SupportedCurrency } from "@/components/Controls";
import AnchorInput, { type AnchorMode } from "@/components/AnchorInput";
import ResultCard, { type RetireResult } from "@/components/ResultCard";
import CityAutocomplete from "@/components/CityAutocomplete";
import Disclaimer from "@/components/Disclaimer";

interface FormState {
  targetQuery: string;
  anchorQuery: string;
  anchorMode: AnchorMode;
  anchorMonthly: number;
  currency: SupportedCurrency;
  swr: number;
  taxRate: number;
}

const DEFAULT: FormState = {
  targetQuery: "",
  anchorQuery: "Israel",
  anchorMode: "own",
  anchorMonthly: 15000,
  currency: "ILS",
  swr: 0.04,
  taxRate: 0.25,
};

export default function Home() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [result, setResult] = useState<RetireResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const patch = useCallback(
    (update: Partial<FormState>) => setForm((f) => ({ ...f, ...update })),
    []
  );

  const isSamePlace =
    form.anchorMode === "own" &&
    form.targetQuery.trim().length > 0 &&
    form.anchorQuery.trim().length > 0 &&
    form.targetQuery.trim().toLowerCase() === form.anchorQuery.trim().toLowerCase();

  const canSubmit =
    form.targetQuery.trim().length > 0 &&
    !isSamePlace &&
    (form.anchorMode === "baseline" ||
      (form.anchorQuery.trim().length > 0 && form.anchorMonthly > 0));

  const fetchResult = useCallback(async (f: FormState) => {
    if (!f.targetQuery.trim()) return;
    if (f.anchorMode === "own" && (!f.anchorQuery.trim() || f.anchorMonthly <= 0)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/retire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetQuery: f.targetQuery,
          anchorQuery: f.anchorMode === "baseline" ? "United States" : f.anchorQuery,
          anchorMode: f.anchorMode,
          anchorMonthly: f.anchorMonthly,
          currency: f.currency,
          swr: f.swr,
          taxRate: f.taxRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong");
        setResult(null);
      } else {
        setResult(data as RetireResult);
      }
    } catch {
      setError("Network error — please try again");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch on slider/currency/mode change when a result is already showing
  useEffect(() => {
    if (!result && !error) return;
    const timer = setTimeout(() => fetchResult(form), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.swr, form.taxRate, form.currency, form.anchorMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetchResult(form);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "RetireWhere",
    url: "https://retirewhere.vercel.app",
    description:
      "Calculate how much you need to retire in any city or country, scaled by cost of living with a tax-adjusted 4% rule.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <div className="pt-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RetireWhere</h1>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
          Enter where you want to retire and your current spend — we&apos;ll tell you
          the nest egg you need, scaled by cost of living.
        </p>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100"
      >
        {/* Section: Target */}
        <div className="px-5 py-4">
          <CityAutocomplete
            label="Where do you want to retire?"
            value={form.targetQuery}
            onChange={(v) => patch({ targetQuery: v })}
            placeholder="e.g. Portugal, Bangkok, Spain"
            required
          />
        </div>

        {/* Section: Anchor */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Your current situation
          </p>
          <AnchorInput
            mode={form.anchorMode}
            currency={form.currency}
            anchorQuery={form.anchorQuery}
            anchorMonthly={form.anchorMonthly}
            onChange={(p) => patch(p as Partial<FormState>)}
          />
        </div>

        {/* Section: Assumptions */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Assumptions
          </p>
          <Controls
            currency={form.currency}
            swr={form.swr}
            taxRate={form.taxRate}
            onChange={(p) => patch(p as Partial<FormState>)}
          />
        </div>

        {/* Submit */}
        <div className="px-5 py-4 bg-slate-50 rounded-b-2xl">
          {isSamePlace && (
            <p className="text-xs text-amber-600 mb-2">
              Destination and current location can&apos;t be the same place.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
          <span>{error}</span>
          {error.includes("unavailable") && (
            <button
              onClick={() => fetchResult(form)}
              className="shrink-0 text-xs font-medium underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && <ResultCard result={result} />}

      {/* Disclaimer */}
      <footer className="pb-6">
        <Disclaimer />
      </footer>
    </main>
  );
}
