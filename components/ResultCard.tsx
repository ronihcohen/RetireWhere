"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";
import { formatCurrency, formatPct, formatRatioPct } from "@/lib/format";

export interface RetireResult {
  currency: string;
  indexRatio: number;
  target: { name: string; level: string };
  anchor: { name: string; level: string };
  anchorMonthly: number;
  targetMonthly: number;
  targetAnnual: number;
  nestEggPreTax: number;
  nestEggAfterTax: number;
  swr: number;
  taxRate: number;
  confidence: string;
  notes: string[];
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between items-baseline gap-4 ${muted ? "text-slate-400" : "text-slate-600"}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${muted ? "font-normal" : ""}`}>{value}</span>
    </div>
  );
}

export default function ResultCard({ result }: { result: RetireResult }) {
  const {
    currency, target, anchor, indexRatio,
    anchorMonthly, targetMonthly, targetAnnual,
    nestEggPreTax, nestEggAfterTax,
    swr, taxRate, confidence, notes,
  } = result;

  const animatedAfterTax = useCountUp(Math.round(nestEggAfterTax));
  const cheaper = indexRatio < 1;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-md shadow-indigo-50 overflow-hidden">
      {/* Hero band */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-5 text-white">
        <p className="text-sm text-indigo-200 mb-1">
          To retire in <span className="font-medium text-white">{target.name}</span>
        </p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {formatCurrency(animatedAfterTax, currency)}
        </p>
        <p className="text-sm text-indigo-300 mt-1.5">
          after-tax nest egg &nbsp;·&nbsp;{" "}
          <span className="text-indigo-100">{formatCurrency(nestEggPreTax, currency)} pre-tax</span>
        </p>
      </div>

      {/* Breakdown */}
      <div className="px-6 py-4 flex flex-col gap-2 border-b border-slate-100">
        <Row
          label={`Monthly spend in ${target.name}`}
          value={`${formatCurrency(targetMonthly, currency)}/mo`}
        />
        <Row
          label="Annual spend"
          value={formatCurrency(targetAnnual, currency)}
        />
        <Row
          label={`Cost of living vs ${anchor.name}`}
          value={`${formatRatioPct(indexRatio)} — ${cheaper ? "cheaper" : "more expensive"}`}
          muted
        />
        <Row
          label="Your anchor spend"
          value={`${formatCurrency(anchorMonthly, currency)}/mo`}
          muted
        />
      </div>

      {/* Formula */}
      <div className="px-6 py-3 bg-slate-50 flex flex-col gap-1.5">
        <Row
          label="Formula"
          value="annual ÷ (SWR × (1 − tax))"
          muted
        />
        <Row
          label="SWR · Tax"
          value={`${formatPct(swr)} · ${formatPct(taxRate, 0)}`}
          muted
        />
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-sm text-slate-400">Data confidence</span>
          <span className={`text-sm font-medium ${confidence === "city" ? "text-emerald-600" : "text-amber-500"}`}>
            {confidence}-level
          </span>
        </div>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <ul className="px-6 py-3 border-t border-amber-100 bg-amber-50 flex flex-col gap-1">
          {notes.map((n, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-1.5">
              <span className="shrink-0">·</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
