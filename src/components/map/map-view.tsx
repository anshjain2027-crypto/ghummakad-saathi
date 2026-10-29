"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./types";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false, loading: () => <MapLoading /> });
const GoogleMapView = dynamic(() => import("./google-map"), { ssr: false, loading: () => <MapLoading /> });

function MapLoading() {
  return <div className="grid h-full w-full place-items-center bg-[#e8e2d4] text-[14px] text-ink-soft">Loading map…</div>;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

export const mapProvider: "google" | "preview" = GOOGLE_KEY ? "google" : "preview";

export function MapView(props: MapViewProps) {
  return (
    <div className="relative h-full w-full">
      {GOOGLE_KEY ? <GoogleMapView {...props} apiKey={GOOGLE_KEY} mapId={GOOGLE_MAP_ID} /> : <LeafletMap {...props} />}
      {!GOOGLE_KEY ? (
        <span className="pointer-events-none absolute left-2 top-2 z-[500] rounded-[6px] bg-cream/95 px-2 py-1 text-[12px] font-medium text-ink-soft shadow">
          Preview map (OpenStreetMap) · Google Maps not configured
        </span>
      ) : null}
    </div>
  );
}
