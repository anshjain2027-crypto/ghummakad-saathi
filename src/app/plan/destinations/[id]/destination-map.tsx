"use client";

import { MapView } from "@/components/map/map-view";
import type { MapMarker } from "@/components/map/types";

export function DestinationMap({ center, markers, name }: { center: { lat: number; lng: number }; markers: MapMarker[]; name: string }) {
  return <MapView center={center} zoom={10} markers={markers} label={`Map of places around ${name}`} className="h-full w-full" />;
}
