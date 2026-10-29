import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Location search for "Add a place". With a Google key: Places API (New)
 * Text Search, minimal field mask, results returned transiently (not stored)
 * except the place ID the user chooses to attach. Without a key: 404 so the
 * client falls back to dropping a pin.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 3) return NextResponse.json({ results: [] });
  if (!config.maps.serverKey) return NextResponse.json({ error: "maps_not_configured", results: [] }, { status: 404 });
  if (!(await rateLimit(`places-search:${user.id}`, 60, 3600))) return NextResponse.json({ error: "rate_limited", results: [] }, { status: 429 });

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": config.maps.serverKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: q, maxResultCount: 6 }),
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "maps_unavailable", results: [] }, { status: 502 });
  const body = (await res.json()) as { places?: { id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number } }[] };
  return NextResponse.json({
    attribution: "Google",
    results: (body.places ?? []).map((p) => ({
      googlePlaceId: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      lat: p.location?.latitude,
      lng: p.location?.longitude,
    })),
  });
}
