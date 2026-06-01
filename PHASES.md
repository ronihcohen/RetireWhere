# RetireWhere — Implementation Phases

---

## Phase 1 — Foundation & Core Math

**Goal:** Working calculation engine with a live API endpoint. No UI polish.

### Tasks

- [ ] Scaffold Next.js project with TypeScript and Tailwind
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-turbopack
  ```
- [ ] Create `lib/calc.ts` — pure `computeNestEgg()` function
- [ ] Create `lib/index-source.ts` — `IndexSource` interface + `PlaceIndex` type
- [ ] Create `lib/sources/whereNext.ts` — WhereNext implementation
  - Verify API endpoint shape and CC BY 4.0 coverage
  - Implement `resolve(query)` and `list()`
- [ ] Create `lib/sources/worldBank.ts` — stub returning `null` (wired but unimplemented)
- [ ] Create `app/api/retire/route.ts` — POST handler
  - Validate inputs (422 on bad data)
  - Call `IndexSource.resolve()` for both target and anchor
  - Run `computeNestEgg()`
  - Return full response payload
- [ ] Create `app/page.tsx` — minimal form (no styling)
  - Target city text input
  - Anchor city + monthly spend
  - Submit → display raw JSON result
- [ ] Write unit tests for `lib/calc.ts` (edge cases: SWR=0, tax=100, ratio=1)

### Acceptance Criteria

- POST `/api/retire` returns correct nest egg numbers for the worked example (₪15k anchor, Lisbon target → ₪3.9M after-tax)
- WhereNext integration confirmed live with real city queries
- `calc.ts` tests pass

---

## Phase 2 — Inputs, Defaults & FX

**Goal:** All user-configurable inputs wired up; ILS-default currency with FX conversion.

### Tasks

- [ ] Create `lib/fx.ts` — Frankfurter.app helper
  - `convertAmount(amount, from, to)` async function
  - Confirm ILS coverage; add fallback error state
- [ ] Update `/api/retire` to accept and apply `currency`, `swr`, `taxRate`
  - Call `fx.ts` when anchor currency ≠ display currency
  - Clamp SWR to [0.01, 0.10], taxRate to [0, 0.99]
- [ ] Create `components/Controls.tsx`
  - SWR slider (2–6%, step 0.5%)
  - Tax slider (0–50%, step 1%)
  - Currency selector (ILS default, USD, EUR, GBP)
- [ ] Create `components/AnchorInput.tsx`
  - Toggle: "Use my monthly spend" vs "Use baseline"
  - In "own spend" mode: anchor city autocomplete + amount input
  - Baseline mode: show the reference figure and its source label
- [ ] Define baseline reference value (documented source) in `lib/baseline.ts`
- [ ] Wire Controls and AnchorInput into `app/page.tsx`

### Acceptance Criteria

- Currency conversion works end-to-end (enter spend in ILS, view result in EUR)
- Sliders update the result live (client-side re-POST on change)
- Baseline mode shows a labeled estimate without requiring spend input
- FX failure shows a clear error, not a crash

---

## Phase 3 — Autocomplete & City Resolution

**Goal:** Instant fuzzy-search autocomplete from a prebuilt local list; graceful fallbacks for unknown cities.

### Tasks

- [ ] Create `scripts/fetch-places.ts`
  - Calls `WhereNextSource.list()`
  - Writes `data/places.json` (`id`, `name`, `level`)
  - Run once manually; add to `package.json` as `npm run fetch-places`
- [ ] Add `data/places.json` to the repo (committed, regenerated in CI)
- [ ] Create `app/api/cities/route.ts` — optional: serve the list (or import JSON directly in the component)
- [ ] Install `fuse.js`; create `components/CityAutocomplete.tsx`
  - Loads `places.json` on mount
  - Fuzzy search on keypress (no API calls per keystroke)
  - Shows "City, Country" to disambiguate duplicates
  - On select: stores `{ id, name }` for the POST payload
- [ ] Handle unknown city in `CityAutocomplete.tsx`
  - Show: "No data for that city — try a nearby larger city or the country name"
- [ ] Implement city→country fallback in `/api/retire`
  - If city not found, resolve to country index
  - Set `confidence: "country"` + note in response
  - Return result anyway; client labels it coarser
- [ ] Replace text inputs in `app/page.tsx` with `CityAutocomplete`

### Acceptance Criteria

- Autocomplete works offline (no external calls per keystroke)
- Petah Tikva → falls back to Israel country index, labeled correctly
- Lisbon resolves at city level, confidence = "city"
- Unknown free-text shows the friendly error state

---

## Phase 4 — UI Polish

**Goal:** Visually complete, RTL-aware, mobile-first UI with animated results.

### Tasks

- [ ] Design system: choose a calm/aspirational Tailwind palette (slate/indigo/emerald base)
- [ ] Lay out `app/page.tsx` — single centered column, mobile-first
  1. Headline + target city autocomplete
  2. AnchorInput block
  3. Controls row (currency, SWR, tax)
  4. ResultCard
  5. Disclaimer footer
- [ ] Create `components/ResultCard.tsx`
  - Lead: "You'd need **₪3.9M** to retire in [City]" (after-tax, bold)
  - Secondary: pre-tax number beside it
  - Compact breakdown: monthly → ×12 → ÷ (SWR × (1−tax))
  - Show index ratio and confidence badge
- [ ] Create `components/Disclaimer.tsx`
  - "Not financial advice — estimates only"
  - WhereNext CC BY 4.0 attribution link
  - Caveats from Section 2.4 of CLAUDE.md (collapsed by default on mobile)
- [ ] Animated number count-up on result change (CSS/framer-motion or plain `requestAnimationFrame`)
- [ ] `lib/format.ts` — `formatCurrency(amount, currency)` via `Intl.NumberFormat`
- [ ] RTL layout support: use `dir="auto"` on text inputs; test with Hebrew city names
- [ ] Apply `Intl.NumberFormat` throughout — no raw `.toFixed()` in UI

### Acceptance Criteria

- Loads and is usable on a 375px mobile screen
- Hebrew label input doesn't break layout (RTL-aware)
- Number count-up plays on first result and on subsequent changes
- WhereNext attribution visible in footer

---

## Phase 5 — Resilience & Caching

**Goal:** Production-ready error handling, caching, and source redundancy.

### Tasks

- [ ] Add `Cache-Control: s-maxage=86400, stale-while-revalidate` to `/api/retire` responses
- [ ] Evaluate Vercel KV for resolved index caching by place id (add if traffic warrants)
- [ ] Implement `WorldBankSource` in `lib/sources/worldBank.ts`
  - Pull from World Bank ICP/PPP + OECD + Eurostat open data
  - Route `/api/retire` to try WhereNext first, WorldBank on failure
- [ ] Error states in UI
  - Index source down → "Data temporarily unavailable — please retry"
  - FX failure + anchor already in display currency → skip conversion, proceed
  - Place not found (422) → inline error below the autocomplete
- [ ] Input validation hardening
  - Client-side: disable Submit while inputs invalid
  - Server-side: zod schema on POST body (or equivalent)
- [ ] Verify and document Frankfurter uptime; pick fallback FX source if needed
- [ ] Add `npm run fetch-places` to Vercel build command (`postinstall` or `prebuild`)

### Acceptance Criteria

- Second index source resolves a city the first cannot
- WhereNext outage shows a friendly retry state, not a 500
- Response for a known city is served from cache on second hit
- All 422/4xx cases have a human-readable `message` field

---

## Phase 6 — Deploy & CI

**Goal:** Live on Vercel with env vars, build-time data fetch, and clean CI.

### Tasks

- [ ] Create `vercel.ts` (or `vercel.json`) with framework `nextjs`
- [ ] Add env vars in Vercel dashboard
  - `WHERENEXT_API_KEY` (if required)
  - `FRANKFURTER_BASE_URL` (optional override)
- [ ] Confirm `fetch-places` runs at build time and `data/places.json` is up-to-date in the deploy artifact
- [ ] Set up GitHub Actions (or Vercel CI) with:
  - `npm run lint`
  - `npm run test`
  - `npm run build` (includes fetch-places)
- [ ] Add `robots.txt` and `og:image` / `<meta>` social tags in `app/layout.tsx`
- [ ] Smoke-test the Vercel preview URL end-to-end:
  - Tel Aviv → Lisbon
  - Unknown city fallback
  - Currency conversion
  - Slider changes

### Acceptance Criteria

- Production URL resolves and returns results
- `places.json` in the deploy reflects the latest WhereNext list
- No secrets in client bundle (verify with `next build` output)
- CI passes on `main`

---

## Open Questions (resolve before/during Phase 1)

1. **WhereNext API** — exact endpoint, response shape, rate limits, CC BY 4.0 covers programmatic use?
2. **Frankfurter** — confirm ILS in the supported currencies list; identify a fallback FX source.
3. **Baseline reference value** — what is the documented "typical family-of-four monthly spend" figure and its source?
4. **Side-by-side comparison** — out of scope for Phase 1–6; revisit post-launch.
