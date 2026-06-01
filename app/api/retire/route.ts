import { NextRequest, NextResponse } from "next/server";
import { WhereNextSource } from "@/lib/sources/whereNext";
import { WorldBankSource } from "@/lib/sources/worldBank";
import { computeNestEgg } from "@/lib/calc";
import { convertAmount } from "@/lib/fx";
import { BASELINE } from "@/lib/baseline";
import type { IndexSource, PlaceIndex } from "@/lib/index-source";

const SUPPORTED_CURRENCIES = ["ILS", "USD", "EUR", "GBP"];

// Sources in priority order. Pair resolution ensures both places use the
// same source so their indices are on the same scale.
const sources: IndexSource[] = [new WhereNextSource(), new WorldBankSource()];

interface PairResult {
  target: PlaceIndex;
  anchor: PlaceIndex;
  mixedSources: boolean;
}

async function resolvePair(targetQ: string, anchorQ: string): Promise<PairResult | null> {
  // Try each source for BOTH places — keeps indices on the same scale
  for (const source of sources) {
    try {
      const [t, a] = await Promise.all([source.resolve(targetQ), source.resolve(anchorQ)]);
      if (t && a) return { target: t, anchor: a, mixedSources: false };
    } catch {
      // source down — try next
    }
  }

  // Last resort: resolve independently, may mix sources
  const results = await Promise.allSettled(
    sources.flatMap((s) => [s.resolve(targetQ), s.resolve(anchorQ)])
  );
  const anyTarget = results
    .filter((_, i) => i % 2 === 0)
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .find(Boolean) ?? null;
  const anyAnchor = results
    .filter((_, i) => i % 2 === 1)
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .find(Boolean) ?? null;

  if (anyTarget && anyAnchor) {
    return { target: anyTarget, anchor: anyAnchor, mixedSources: true };
  }
  return null;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function err(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const {
    targetQuery,
    anchorQuery,
    anchorMode = "own",
    anchorMonthly: rawAnchorMonthly,
    currency = "ILS",
    swr: rawSwr = 0.04,
    taxRate: rawTaxRate = 0.25,
  } = body as Record<string, unknown>;

  if (typeof targetQuery !== "string" || !targetQuery.trim())
    return err("targetQuery is required", 422);
  if (typeof anchorQuery !== "string" || !anchorQuery.trim())
    return err("anchorQuery is required", 422);
  if (!SUPPORTED_CURRENCIES.includes(String(currency)))
    return err(`currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`, 422);

  const swr = clamp(Number(rawSwr), 0.01, 0.1);
  const taxRate = clamp(Number(rawTaxRate), 0, 0.99);
  const cur = String(currency);

  // Resolve anchor monthly spend
  let anchorMonthly: number;
  let baselineNote: string | null = null;

  if (anchorMode === "baseline") {
    try {
      anchorMonthly = await convertAmount(BASELINE.amountUsd, BASELINE.currency, cur);
      baselineNote = `Using ${BASELINE.label}: $${BASELINE.amountUsd.toLocaleString()} USD converted to ${cur}`;
    } catch {
      return err("FX service unavailable — could not convert baseline amount. Try again shortly.", 503);
    }
  } else {
    const parsed = Number(rawAnchorMonthly);
    if (!Number.isFinite(parsed) || parsed <= 0)
      return err("anchorMonthly must be a positive number", 422);
    anchorMonthly = parsed;
  }

  // Resolve both places from the same source where possible
  let pair: PairResult | null;
  try {
    pair = await resolvePair(String(targetQuery), String(anchorQuery));
  } catch {
    return err("Cost-of-living data service unavailable. Please try again shortly.", 503);
  }

  if (!pair) {
    // Determine which one failed for a clearer message
    const [t, a] = await Promise.all([
      sources[0].resolve(String(targetQuery)).catch(() => null),
      sources[0].resolve(String(anchorQuery)).catch(() => null),
    ]);
    if (!t && !a)
      return err(`Could not find data for "${targetQuery}" or "${anchorQuery}". Try a country name.`, 422);
    if (!t)
      return err(`Could not find cost-of-living data for: ${targetQuery}. Try the country name.`, 422);
    return err(`Could not find cost-of-living data for: ${anchorQuery}. Try the country name.`, 422);
  }

  const { target, anchor, mixedSources } = pair;

  if (target.id === anchor.id)
    return err("Destination and current location can't be the same place.", 422);

  const indexRatio = target.index / anchor.index;
  const calc = computeNestEgg({ anchorMonthly, indexRatio, swr, taxRate });

  const notes: string[] = [];
  if (baselineNote) notes.push(baselineNote);
  if (target.level === "country") notes.push(`${target.name} resolved at country level`);
  if (anchor.level === "country") notes.push(`${anchor.name} resolved at country level`);
  if (mixedSources) notes.push("Index data from different sources — ratio is approximate");

  const confidence =
    target.level === "city" && anchor.level === "city" ? "city" : "country";

  return NextResponse.json(
    {
      currency: cur,
      indexRatio,
      target: { name: target.name, level: target.level },
      anchor: { name: anchor.name, level: anchor.level },
      anchorMonthly,
      ...calc,
      swr,
      taxRate,
      confidence,
      notes,
    },
    {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" },
    }
  );
}
