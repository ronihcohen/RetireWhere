# RetireWhere — Complete Build Plan

**One-line concept:** Tell RetireWhere a city, and it tells you how much money you need invested to retire there — by scaling your own (or a baseline) monthly spend with a free cost-of-living index, then applying the 4% rule grossed up for tax.

**Stack:** Next.js (App Router) + TypeScript + Tailwind, deployed to Vercel.
**Defaults:** currency **ILS**, safe withdrawal rate **4%**, tax on withdrawals **25%**.

---

## 1. Why the index-and-anchor design

There is no free data source that gives Numbeo-quality *absolute* per-city prices (a dollar figure for "family-of-four monthly cost" and "3BR outside centre") for any city on earth. Free sources are index-only, country-level, US-only, or stale snapshots with murky licensing.

So RetireWhere never fetches absolute prices. The only external number it needs is a **cost-of-living index ratio** between two places:

```
targetMonthly = anchorMonthly × (index[targetCity] / index[anchorCity])
```

`anchorMonthly` is ground truth supplied by the user (their real current monthly spend) or a transparent baseline. Because the index is unitless, whatever currency the anchor is entered in flows straight through to the result — no FX needed in the common case. This is arguably *more* honest than a generic basket, since retirement spending is personal.

---

## 2. Core methodology & math

### 2.1 Scaling

```
indexRatio    = index[target] / index[anchor]
targetMonthly = anchorMonthly × indexRatio
targetAnnual  = targetMonthly × 12
```

### 2.2 Retirement number — with tax gross-up

The 4% rule produces a **gross** withdrawal, and tax comes out of that. To actually *spend* `targetAnnual` after tax, you must withdraw more, so you need a bigger portfolio:

```
grossWithdrawal = targetAnnual / (1 − taxRate)
nestEggPreTax   = targetAnnual / SWR
nestEggAfterTax = targetAnnual / (SWR × (1 − taxRate))
```

- `SWR` (safe withdrawal rate): default **0.04**, user-adjustable.
- `taxRate`: default **0.25**, user-adjustable. (25% also matches Israel's capital-gains rate, a sensible default for an ILS-first audience.)
- With the defaults, the multiplier on annual spend is `1 / (0.04 × 0.75) ≈ 33.3×` (vs 25× untaxed).

### 2.3 Worked example (ILS)

Anchor ₪15,000/mo; target city ~35% cheaper (ratio 0.65):

```
targetMonthly   = 15,000 × 0.65            = ₪9,750
targetAnnual    = 9,750 × 12               = ₪117,000
nestEggPreTax   = 117,000 / 0.04           = ₪2,925,000
nestEggAfterTax = 117,000 / (0.04 × 0.75)  = ₪3,900,000
```

Show both numbers side by side so the ~₪975k tax impact is visible.

### 2.4 Honest caveats (put in the UI footer)

- The 4% rule is a simplified heuristic; it ignores sequence-of-returns risk, inflation specifics, and one-off shocks (healthcare, visas, relocation).
- The tax model is a **flat rate on the whole withdrawal**, which is conservative — in a taxable account usually only the *gains* portion is taxed, and the real rate depends on account type and jurisdiction.
- The index is a ratio of typical baskets; your personal spend may scale differently.
- "A ballpark to start from," not financial advice.

---

## 3. Data sources

| Need | Source | Cost | Notes |
|---|---|---|---|
| Cost-of-living index (primary) | **WhereNext** (`getwherenext.com`) free JSON API | Free, CC BY 4.0 | ~380 cities / 95 countries; built on World Bank PPP, OECD, Eurostat. Index only, no absolute prices. |
| Index (fallback / independence) | Assembled from **World Bank ICP/PPP + OECD + Eurostat** | Free / open | More work; removes single-vendor dependence. |
| FX (only when needed) | **Frankfurter.app** (ECB reference rates) | Free, no key | Covers ILS + majors. |

**Verify before committing:** WhereNext's exact endpoint shape and that CC BY 4.0 genuinely covers API use; confirm Frankfurter returns ILS.

### 3.1 Swappable index adapter

Never hard-couple to one small vendor. Put every source behind one interface:

```ts
// lib/index-source.ts
export interface PlaceIndex {
  id: string;
  name: string;          // "Lisbon, Portugal"
  index: number;         // cost-of-living index (unitless)
  level: "city" | "country";
}

export interface IndexSource {
  /** Returns null if the place can't be resolved at city or country level. */
  resolve(query: string): Promise<PlaceIndex | null>;
  /** For autocomplete: the full list of resolvable places. */
  list(): Promise<Array<Pick<PlaceIndex, "id" | "name" | "level">>>;
}
```

Implementations: `WhereNextSource`, `WorldBankSource` (stub initially). The route depends on the interface, not the vendor.

---

## 4. Architecture

### 4.1 Project structure

```
app/
  page.tsx                  # main search + result UI
  api/
    retire/route.ts         # server: inputs -> computed result (calls index source + FX)
    cities/route.ts         # optional: serves the prebuilt place list (or import JSON directly)
lib/
  index-source.ts           # IndexSource interface
  sources/whereNext.ts      # WhereNext implementation
  sources/worldBank.ts      # fallback stub
  fx.ts                     # Frankfurter helper
  calc.ts                   # pure retirement math (unit-tested)
  format.ts                 # currency/number formatting (Intl)
data/
  places.json               # prebuilt at build time (id, name, level)
scripts/
  fetch-places.ts           # populates places.json from the index source
components/
  CityAutocomplete.tsx
  AnchorInput.tsx           # current city + monthly spend (or "use baseline")
  Controls.tsx              # SWR slider, tax slider, currency selector
  ResultCard.tsx            # pre-tax vs after-tax side by side
  Disclaimer.tsx
```

### 4.2 Data flow

1. Client loads `places.json` (prebuilt) for instant autocomplete — no API calls per keystroke.
2. User picks **target city**, sets **anchor** (own city + monthly spend, or baseline), and adjusts SWR / tax / currency.
3. Client POSTs to `/api/retire`.
4. Route resolves both places via `IndexSource`, computes `indexRatio`, runs `calc.ts`, optionally calls `fx.ts`, returns the payload.
5. `ResultCard` renders the number(s).

### 4.3 Secrets & caching

- Any API key (if WhereNext requires one) lives **only** in a server route via env var; never shipped to the client.
- Index data changes slowly: set `Cache-Control: s-maxage=86400, stale-while-revalidate` on `/api/retire`, and optionally cache resolved indices in **Vercel KV** keyed by place id.
- `places.json` is static, regenerated at build time by `scripts/fetch-places.ts`.

---

## 5. Inputs & defaults

| Input | Default | Control |
|---|---|---|
| Target city | — (required) | Autocomplete |
| Anchor mode | "Use my spend" | Toggle: own spend ⟷ baseline |
| Anchor city | user's current city | Autocomplete (only in "own spend" mode) |
| Anchor monthly spend | — | Number input, in selected currency |
| Safe withdrawal rate | 4% | Slider 2–6% |
| Tax on withdrawals | 25% | Slider 0–50% |
| Currency | **ILS** | Select: ILS, USD, EUR, GBP, + extras |

**Baseline mode:** if the user doesn't know their spend, seed the anchor from one transparent reference value (e.g. a documented typical family-of-four monthly figure for a base country) stored in a base currency and converted via FX. Label it clearly as an assumption.

---

## 6. API contract — `POST /api/retire`

**Request**
```json
{
  "targetQuery": "Lisbon, Portugal",
  "anchorQuery": "Tel Aviv, Israel",
  "anchorMonthly": 15000,
  "currency": "ILS",
  "swr": 0.04,
  "taxRate": 0.25
}
```

**Response**
```json
{
  "currency": "ILS",
  "indexRatio": 0.65,
  "target": { "name": "Lisbon, Portugal", "level": "city" },
  "anchor": { "name": "Tel Aviv, Israel", "level": "city" },
  "anchorMonthly": 15000,
  "targetMonthly": 9750,
  "targetAnnual": 117000,
  "swr": 0.04,
  "taxRate": 0.25,
  "nestEggPreTax": 2925000,
  "nestEggAfterTax": 3900000,
  "confidence": "city",        // "city" if both resolved at city level, else "country"
  "notes": []                   // e.g. "Anchor resolved at country level"
}
```

**Core function (pure, testable):**
```ts
// lib/calc.ts
export function computeNestEgg(args: {
  anchorMonthly: number; indexRatio: number; swr: number; taxRate: number;
}) {
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
```

---

## 7. Autocomplete & city validation

- **Build-time:** `scripts/fetch-places.ts` writes `data/places.json` (`{ id, name, level }`) so keystrokes never hit the paid/external API.
- **Client:** fuzzy search (e.g. `fuse.js`) over the local list; show "City, Country" to disambiguate duplicates.
- **On select:** send the resolved place id/name to the backend.
- **Unknown city:** if free text matches nothing, show a friendly "We don't have data for that city — try a nearby larger city or the country" state.
- **City→country fallback:** if a place isn't in the ~380-city set (likely for smaller Israeli cities like Petah Tikva), resolve to the **country** index and set `confidence: "country"` + a note. The app still works; it's just labeled as coarser.

---

## 8. UI / UX

**Layout:** single centered column, mobile-first.

1. Big headline + target-city autocomplete.
2. Anchor block (toggle: "Use my monthly spend" vs "Use a baseline"); when "own," show anchor-city autocomplete + spend input.
3. Controls row: currency selector (ILS default), SWR slider, tax slider with the note *"The 4% rule is pre-tax — set your expected tax on withdrawals."*
4. **ResultCard:** leads with the after-tax number ("You'd need **₪3.9M** to retire in Lisbon"), with the pre-tax number shown smaller beside it and a compact breakdown (monthly → ×12 → ÷ (SWR × (1−tax))). Show `confidence` and the index ratio.
5. Disclaimer footer.

**Polish:** Tailwind, calm/aspirational palette, animated number count-up on result, RTL-aware layout (Hebrew audience), `Intl.NumberFormat` for currency display.

---

## 9. Edge cases & errors

- **Place not found** (target or anchor) → 422 with a clear message; don't crash.
- **Country-level fallback** → compute anyway, label confidence.
- **FX failure** → if anchor is already in the display currency, skip FX entirely; otherwise show last-known/clear error.
- **Index source down** → try fallback source; if both fail, friendly retry state.
- **Absurd inputs** (tax ≥ 100%, SWR = 0) → clamp/validate client- and server-side.
- **Mixed-level ratio** (anchor city-level, target country-level) → allowed, but noted.

---

## 10. Build milestones

1. **MVP (no UI polish):** `calc.ts` + tests, `WhereNextSource`, `/api/retire`, minimal form, ILS-only. Verify WhereNext live.
2. **Inputs & defaults:** SWR + tax sliders, currency selector + Frankfurter FX, baseline mode.
3. **Autocomplete:** build-time `places.json`, fuzzy search, unknown/country-fallback handling.
4. **Polish:** ResultCard with pre/after-tax, RTL, formatting, animation, disclaimer.
5. **Resilience:** caching (`s-maxage` / KV), WorldBank fallback source, error states.
6. **Deploy:** Vercel, env vars, build-time fetch in CI.

---

## 11. Open questions to confirm

- WhereNext API: exact endpoints, response shape, rate limits, and that CC BY 4.0 covers programmatic use (attribution requirement → add a credit line in the footer).
- Frankfurter: confirm ILS coverage and uptime; pick a fallback FX source if needed.
- Baseline reference value(s) and their documented source, for "I don't know my spend" mode.
- Whether to let users compare two cities side by side (likely a fast follow).

---

## 12. Attribution & legal

- If using WhereNext under CC BY 4.0, include visible attribution (footer credit + link).
- Add a persistent "Not financial advice — estimates only" line.
- Respect each data source's terms; prefer official/free APIs over scraping.