import { writeFileSync } from "fs";
import { join } from "path";

const COL_URL = "https://getwherenext.com/api/data/cost-of-living";
const CITY_URL = "https://getwherenext.com/api/data/city-prices";

interface ColRecord {
  country_code: string;
  country: string;
}

interface CityRecord {
  city_key: string;
  city_name: string;
  country_code: string;
}

export interface Place {
  id: string;
  name: string;
  level: "city" | "country";
  countryName?: string; // city entries only
}

async function main() {
  const [colRes, cityRes] = await Promise.all([
    fetch(COL_URL),
    fetch(CITY_URL),
  ]);

  if (!colRes.ok) throw new Error(`COL fetch failed: ${colRes.status}`);
  if (!cityRes.ok) throw new Error(`City fetch failed: ${cityRes.status}`);

  const colJson = (await colRes.json()) as { data: ColRecord[] };
  const cityJson = (await cityRes.json()) as { data: CityRecord[] };

  // Build country lookup: uppercase code → name
  const countryByCode = new Map<string, string>();
  for (const r of colJson.data) {
    countryByCode.set(r.country_code.toUpperCase(), r.country);
  }

  const places: Place[] = [];

  // Countries first
  for (const r of colJson.data) {
    places.push({
      id: r.country_code.toUpperCase(),
      name: r.country,
      level: "country",
    });
  }

  // Cities — only include if their country is in the index
  for (const c of cityJson.data) {
    const code = c.country_code.toUpperCase();
    const countryName = countryByCode.get(code);
    if (!countryName) continue; // skip cities whose country isn't indexed
    places.push({
      id: c.city_key,
      name: `${c.city_name}, ${countryName}`,
      level: "city",
      countryName,
    });
  }

  const outPath = join(process.cwd(), "data", "places.json");
  writeFileSync(outPath, JSON.stringify(places, null, 2));
  console.log(`✓ Wrote ${places.length} places (${colJson.data.length} countries + ${cityJson.data.length} cities) to ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
