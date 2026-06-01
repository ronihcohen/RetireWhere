import { BASELINE } from "@/lib/baseline";
import type { SupportedCurrency } from "./Controls";
import CityAutocomplete from "./CityAutocomplete";

export type AnchorMode = "own" | "baseline";

interface Props {
  mode: AnchorMode;
  currency: SupportedCurrency;
  anchorQuery: string;
  anchorMonthly: number;
  onChange: (patch: Partial<{
    mode: AnchorMode;
    anchorQuery: string;
    anchorMonthly: number;
  }>) => void;
}

export default function AnchorInput({
  mode,
  currency,
  anchorQuery,
  anchorMonthly,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ mode: "own" })}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            mode === "own"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
          }`}
        >
          My monthly spend
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: "baseline" })}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            mode === "baseline"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
          }`}
        >
          Estimate for me
        </button>
      </div>

      {mode === "own" ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <CityAutocomplete
              label="Your current country"
              value={anchorQuery}
              onChange={(v) => onChange({ anchorQuery: v })}
              placeholder="e.g. Israel, France"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-44">
            <label className="text-sm font-medium text-slate-600">
              Monthly spend ({currency})
            </label>
            <input
              type="number"
              value={anchorMonthly}
              min={1}
              dir="auto"
              onChange={(e) => onChange({ anchorMonthly: Number(e.target.value) })}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
          <p>
            Using <strong>${BASELINE.amountUsd.toLocaleString()} USD/month</strong> as a modest
            retirement baseline, converted to {currency}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Source: {BASELINE.source}.{" "}
            <a
              href={BASELINE.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              Learn more
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
