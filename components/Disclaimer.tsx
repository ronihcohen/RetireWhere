export default function Disclaimer() {
  return (
    <details className="group text-xs text-slate-400">
      <summary className="cursor-pointer list-none flex items-center gap-1.5 select-none hover:text-slate-600 transition-colors w-fit">
        <svg
          className="w-3 h-3 transition-transform group-open:rotate-90 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Caveats &amp; attribution
      </summary>

      <div className="mt-3 pl-4 border-l-2 border-slate-100 flex flex-col gap-3">
        <ul className="flex flex-col gap-1.5 text-slate-500">
          <li>
            The 4% rule is a simplified heuristic. It ignores sequence-of-returns
            risk, inflation specifics, and one-off shocks (healthcare, visas, relocation costs).
          </li>
          <li>
            The tax model applies a flat rate to the entire withdrawal — this is
            conservative. In practice only the gains portion may be taxed, and the
            real rate depends on account type and jurisdiction.
          </li>
          <li>
            The cost-of-living index compares typical consumption baskets. Your
            personal spending may scale differently (e.g. housing costs often matter more).
          </li>
          <li>These are ballpark numbers to start from, not financial advice.</li>
        </ul>

        <p className="text-slate-400">
          Cost-of-living data:{" "}
          <a
            href="https://getwherenext.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            WhereNext
          </a>{" "}
          (CC BY 4.0) · Exchange rates:{" "}
          <a
            href="https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            ECB via Frankfurter
          </a>
        </p>
      </div>
    </details>
  );
}
