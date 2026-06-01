import { describe, it, expect } from "vitest";
import { computeNestEgg } from "../calc";

describe("computeNestEgg", () => {
  it("produces the worked example from CLAUDE.md", () => {
    const result = computeNestEgg({
      anchorMonthly: 15000,
      indexRatio: 0.65,
      swr: 0.04,
      taxRate: 0.25,
    });
    expect(result.targetMonthly).toBe(9750);
    expect(result.targetAnnual).toBe(117000);
    expect(result.nestEggPreTax).toBe(2925000);
    expect(result.nestEggAfterTax).toBe(3900000);
  });

  it("ratio of 1 means same spend", () => {
    const result = computeNestEgg({
      anchorMonthly: 10000,
      indexRatio: 1,
      swr: 0.04,
      taxRate: 0.25,
    });
    expect(result.targetMonthly).toBe(10000);
    expect(result.targetAnnual).toBe(120000);
  });

  it("zero tax: nestEggAfterTax equals nestEggPreTax", () => {
    const result = computeNestEgg({
      anchorMonthly: 10000,
      indexRatio: 1,
      swr: 0.04,
      taxRate: 0,
    });
    expect(result.nestEggPreTax).toBe(result.nestEggAfterTax);
  });

  it("higher SWR means smaller nest egg", () => {
    const low = computeNestEgg({ anchorMonthly: 10000, indexRatio: 1, swr: 0.03, taxRate: 0.25 });
    const high = computeNestEgg({ anchorMonthly: 10000, indexRatio: 1, swr: 0.06, taxRate: 0.25 });
    expect(low.nestEggAfterTax).toBeGreaterThan(high.nestEggAfterTax);
  });

  it("higher indexRatio means higher nest egg", () => {
    const cheap = computeNestEgg({ anchorMonthly: 10000, indexRatio: 0.5, swr: 0.04, taxRate: 0.25 });
    const expensive = computeNestEgg({ anchorMonthly: 10000, indexRatio: 1.5, swr: 0.04, taxRate: 0.25 });
    expect(expensive.nestEggAfterTax).toBeGreaterThan(cheap.nestEggAfterTax);
  });

  it("multiplier is ~33.3x annual spend with default 4% SWR and 25% tax", () => {
    const result = computeNestEgg({
      anchorMonthly: 10000,
      indexRatio: 1,
      swr: 0.04,
      taxRate: 0.25,
    });
    const multiplier = result.nestEggAfterTax / result.targetAnnual;
    expect(multiplier).toBeCloseTo(33.33, 1);
  });
});
