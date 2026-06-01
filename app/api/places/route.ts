import { NextResponse } from "next/server";
import places from "@/data/places.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(places, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate",
    },
  });
}
