import type { IndexSource, PlaceIndex } from "../index-source";

// ICP 2020 benchmark year — best available coverage (~200 countries).
// PLI (Price Level Index) = (PPP / official_exchange_rate) × 100, where US ≈ 100.
// Ratios between countries are consistent with WhereNext cost_index ratios.
const WB_BASE = "https://api.worldbank.org/v2/country/all/indicator";
const YEAR = "2020";
const FETCH_OPTS = { next: { revalidate: 86400 * 30 } } as const; // 30-day cache — static data

interface WBRecord {
  country: { id: string; value: string };
  value: number | null;
}

interface CountryEntry {
  id: string;   // 2-letter ISO
  name: string;
  pli: number;  // Price Level Index (US ≈ 100)
}

let cachedData: CountryEntry[] | null = null;

async function fetchWB(indicator: string): Promise<WBRecord[]> {
  const url = `${WB_BASE}/${indicator}?format=json&per_page=300&date=${YEAR}`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`WorldBank ${indicator} fetch failed: ${res.status}`);
  const json = await res.json() as [unknown, WBRecord[]];
  return json[1];
}

async function loadData(): Promise<CountryEntry[]> {
  if (cachedData) return cachedData;

  const [pppRecords, erRecords] = await Promise.all([
    fetchWB("PA.NUS.PRVT.PP"), // PPP conversion factor (LCU per international $)
    fetchWB("PA.NUS.FCRF"),    // Official exchange rate (LCU per USD)
  ]);

  const erMap = new Map<string, number>();
  for (const r of erRecords) {
    if (r.value !== null && r.value > 0) erMap.set(r.country.id, r.value);
  }

  const entries: CountryEntry[] = [];
  for (const r of pppRecords) {
    const id = r.country.id;
    if (id.length !== 2) continue; // skip World Bank aggregate regions
    if (r.value === null || r.value <= 0) continue;
    const er = erMap.get(id);
    if (!er) continue;
    const pli = (r.value / er) * 100;
    if (pli > 0 && pli < 500) {
      entries.push({ id, name: r.country.value, pli });
    }
  }

  cachedData = entries;
  return entries;
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchEntry(query: string, data: CountryEntry[]): CountryEntry | null {
  const q = normalize(query);
  return (
    data.find((c) => normalize(c.name) === q) ??
    data.find((c) => normalize(c.id) === q) ??
    data.find((c) => q.includes(normalize(c.name))) ??
    data.find((c) => normalize(c.name).includes(q)) ??
    null
  );
}

function toPlaceIndex(entry: CountryEntry, displayName?: string): PlaceIndex {
  return { id: entry.id, name: displayName ?? entry.name, index: entry.pli, level: "country" };
}

export class WorldBankSource implements IndexSource {
  async resolve(query: string): Promise<PlaceIndex | null> {
    const data = await loadData();
    let entry = matchEntry(query, data);
    if (entry) return toPlaceIndex(entry);

    // "City, Country" format
    const commaIdx = query.lastIndexOf(",");
    if (commaIdx > 0) {
      entry = matchEntry(query.slice(commaIdx + 1).trim(), data);
      if (entry) return toPlaceIndex(entry, query.trim());
    }

    return null;
  }

  async list(): Promise<Array<Pick<PlaceIndex, "id" | "name" | "level">>> {
    const data = await loadData();
    return data.map((c) => ({ id: c.id, name: c.name, level: "country" as const }));
  }
}
