// U.S. Bureau of Labor Statistics, Consumer Expenditure Survey 2023
// Average annual expenditures for households 65+: ~$52,000/year → ~$4,300/month.
// We use a conservative mid-point of $3,500 as a "modest retirement" baseline.
export const BASELINE = {
  amountUsd: 3500,
  currency: "USD",
  label: "Modest retirement baseline",
  source: "U.S. BLS Consumer Expenditure Survey 2023 (65+ households)",
  sourceUrl: "https://www.bls.gov/cex/",
} as const;
