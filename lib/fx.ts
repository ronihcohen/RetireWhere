// frankfurter.app now redirects to frankfurter.dev — use the canonical URL directly
const FX_URL = "https://api.frankfurter.dev/v1/latest";

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  const res = await fetch(`${FX_URL}?from=${from}&to=${to}&amount=${amount}`, {
    next: { revalidate: 3600 },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const data: FrankfurterResponse = await res.json();
  const rate = data.rates[to];
  if (rate == null) throw new Error(`No rate for ${to} from ${from}`);
  return rate;
}
