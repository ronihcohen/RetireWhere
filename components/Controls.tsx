const CURRENCIES = ["ILS", "USD", "EUR", "GBP"] as const;
export type SupportedCurrency = (typeof CURRENCIES)[number];

interface Props {
  currency: SupportedCurrency;
  swr: number;
  taxRate: number;
  onChange: (patch: Partial<{ currency: SupportedCurrency; swr: number; taxRate: number }>) => void;
}

export default function Controls({ currency, swr, taxRate, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-sm font-medium text-slate-600">Currency</label>
          <select
            value={currency}
            onChange={(e) => onChange({ currency: e.target.value as SupportedCurrency })}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-slate-600">
            Safe withdrawal rate:{" "}
            <span className="font-semibold text-slate-800">{(swr * 100).toFixed(1)}%</span>
          </label>
          <input
            type="range"
            min={2}
            max={6}
            step={0.5}
            value={swr * 100}
            onChange={(e) => onChange({ swr: Number(e.target.value) / 100 })}
            className="accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>2%</span><span>6%</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-slate-600">
            Tax on withdrawals:{" "}
            <span className="font-semibold text-slate-800">{Math.round(taxRate * 100)}%</span>
          </label>
          <p className="text-xs text-slate-400 -mt-1">The 4% rule is pre-tax — set your expected rate on withdrawals.</p>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={Math.round(taxRate * 100)}
            onChange={(e) => onChange({ taxRate: Number(e.target.value) / 100 })}
            className="accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0%</span><span>50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
