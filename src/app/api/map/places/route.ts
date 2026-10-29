import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BoundsSchema, myPins, placesInBounds } from "@/lib/data/community";
import { PLACE_CATEGORIES } from "@/lib/domain";

/** Viewport query for the community map. Signed-in only; results filtered by RLS. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const bounds = BoundsSchema.safeParse({ south: sp.get("s"), west: sp.get("w"), north: sp.get("n"), east: sp.get("e") });
  if (!bounds.success) return NextResponse.json({ error: "bad_bounds" }, { status: 400 });
  const cat = sp.get("cat");
  const category = PLACE_CATEGORIES.some((c) => c.id === cat) ? cat! : undefined;
  try {
    const [places, pins] = await Promise.all([placesInBounds(user.id, bounds.data, category, sp.get("q") ?? undefined), myPins(user.id)]);
    return NextResponse.json({ places, pins: pins.filter((p) => !p.placeId) });
  } catch (e) {
    console.error("map places", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
