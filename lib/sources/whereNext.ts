import type { IndexSource, PlaceIndex } from "../index-source";

const COST_OF_LIVING_URL =
  "https://getwherenext.com/api/data/cost-of-living";

interface WhereNextRecord {
  rank: number;
  country_code: string;
  country: string;
  region: string;
  cost_index: number;
  monthly_estimate_usd: number;
}

interface WhereNextResponse {
  data: WhereNextRecord[];
}

let cachedData: WhereNextRecord[] | null = null;

async function fetchData(): Promise<WhereNextRecord[]> {
  if (cachedData) return cachedData;
  const res = await fetch(COST_OF_LIVING_URL, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`WhereNext fetch failed: ${res.status}`);
  const json: WhereNextResponse = await res.json();
  cachedData = json.data;
  return cachedData;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchRecord(
  query: string,
  records: WhereNextRecord[]
): WhereNextRecord | null {
  const q = normalize(query);
  // exact country name match
  let match = records.find((r) => normalize(r.country) === q);
  if (match) return match;
  // country code match (2-letter ISO)
  match = records.find((r) => normalize(r.country_code) === q);
  if (match) return match;
  // partial: query contains country name
  match = records.find((r) => q.includes(normalize(r.country)));
  if (match) return match;
  // partial: country name contains query
  match = records.find((r) => normalize(r.country).includes(q));
  return match ?? null;
}

function toPlaceIndex(record: WhereNextRecord, displayName?: string): PlaceIndex {
  return {
    id: record.country_code.toUpperCase(),
    name: displayName ?? record.country,
    index: record.cost_index,
    level: "country",
  };
}

export class WhereNextSource implements IndexSource {
  async resolve(query: string): Promise<PlaceIndex | null> {
    const records = await fetchData();

    // Direct match (country name / code)
    let record = matchRecord(query, records);
    if (record) return toPlaceIndex(record);

    // "City, Country" format — extract the part after the last comma
    const commaIdx = query.lastIndexOf(",");
    if (commaIdx > 0) {
      const countryPart = query.slice(commaIdx + 1).trim();
      record = matchRecord(countryPart, records);
      if (record) return toPlaceIndex(record, query.trim());
    }

    return null;
  }

  async list(): Promise<Array<Pick<PlaceIndex, "id" | "name" | "level">>> {
    const records = await fetchData();
    return records.map((r) => ({
      id: r.country_code.toUpperCase(),
      name: r.country,
      level: "country" as const,
    }));
  }
}
