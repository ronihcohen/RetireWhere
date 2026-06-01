export interface NestEggResult {
  targetMonthly: number;
  targetAnnual: number;
  nestEggPreTax: number;
  nestEggAfterTax: number;
}

export function computeNestEgg(args: {
  anchorMonthly: number;
  indexRatio: number;
  swr: number;
  taxRate: number;
}): NestEggResult {
  const { anchorMonthly, indexRatio, swr, taxRate } = args;
  const targetMonthly = anchorMonthly * indexRatio;
  const targetAnnual = targetMonthly * 12;
  return {
    targetMonthly,
    targetAnnual,
    nestEggPreTax: targetAnnual / swr,
    nestEggAfterTax: targetAnnual / (swr * (1 - taxRate)),
  };
}
