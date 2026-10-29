import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { sponsoredFor } from "@/lib/sponsors";
import { MapExplorer } from "./map-explorer";

export const metadata: Metadata = { title: "Community map" };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ lat?: string; lng?: string; z?: string; cat?: string }> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  // Sign-in is required for all map access; after sign-in we return to this exact view.
  await requireUser(`/map${qs ? `?${qs}` : ""}`);
  const lat = clamp(Number(sp.lat), -85, 85, 22.5);
  const lng = clamp(Number(sp.lng), -180, 180, 79);
  const zoom = clamp(Number(sp.z), 2, 18, 5);
  const sponsored = await sponsoredFor({ placement: "map_pin", limit: 2 });
  return (
    <MapExplorer
      initial={{ lat, lng, zoom, category: sp.cat ?? null }}
      sponsored={sponsored.filter((s) => s.lat !== null && s.lng !== null).map((s) => ({ ...s, lat: s.lat!, lng: s.lng! }))}
    />
  );
}

function clamp(n: number, min: number, max: number, fallback: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
