"use client";

import { MapView } from "@/components/map/map-view";

export function PlaceMap({ lat, lng, name, pending }: { lat: number; lng: number; name: string; pending: boolean }) {
  return <MapView center={{ lat, lng }} zoom={13} markers={[{ id: "p", lat, lng, label: name, kind: pending ? "pending" : "curated" }]} label={`Map showing ${name}`} className="h-full w-full" cluster={false} />;
}
