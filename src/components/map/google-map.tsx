"use client";

import { useEffect, useMemo, useState } from "react";
import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { clusterMarkers, isCluster, MARKER_STYLE, type MapViewProps } from "./types";

/** Google Maps JavaScript API (rendered with Google's own attribution). */
export default function GoogleMapView(props: MapViewProps & { apiKey: string; mapId?: string }) {
  const [zoom, setZoom] = useState(props.zoom);
  const items = useMemo(() => ((props.cluster ?? true) ? clusterMarkers(props.markers, zoom) : props.markers), [props.markers, props.cluster, zoom]);
  return (
    <APIProvider apiKey={props.apiKey}>
      <div className={props.className} role="application" aria-label={props.label}>
        <Map
          defaultCenter={props.center}
          defaultZoom={props.zoom}
          mapId={props.mapId ?? "DEMO_MAP_ID"}
          gestureHandling="greedy"
          clickableIcons={false}
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
          onCameraChanged={(e) => {
            setZoom(e.detail.zoom);
            const b = e.detail.bounds;
            props.onBoundsChange?.(b, e.detail.zoom);
          }}
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll) props.onMapClick?.({ lat: ll.lat, lng: ll.lng });
          }}
        >
          {items.map((it) =>
            isCluster(it) ? (
              <AdvancedMarker key={it.id} position={it} title={`${it.count} places — zoom in`}>
                <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 999, background: "#1F5145", color: "#F5F0E6", border: "3px solid #F5F0E6", font: "600 13px system-ui" }}>{it.count}</span>
              </AdvancedMarker>
            ) : (
              <AdvancedMarker key={it.id} position={it} title={it.label} onClick={() => props.onSelect?.(it.id)} zIndex={it.id === props.selectedId ? 1000 : 1}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: it.id === props.selectedId ? 38 : 30,
                    height: it.id === props.selectedId ? 38 : 30,
                    borderRadius: 999,
                    background: MARKER_STYLE[it.kind].bg,
                    color: MARKER_STYLE[it.kind].text,
                    border: `3px ${it.kind === "pending" ? "dashed" : "solid"} ${MARKER_STYLE[it.kind].ring}`,
                    font: "600 12px system-ui",
                  }}
                >
                  {it.order ? it.order : it.kind === "sponsored" ? "Ad" : it.kind === "private" ? "★" : ""}
                </span>
              </AdvancedMarker>
            ),
          )}
          <Route route={props.route} />
        </Map>
      </div>
    </APIProvider>
  );
}

function Route({ route }: { route?: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !route || route.length < 2 || typeof google === "undefined") return;
    const line = new google.maps.Polyline({ path: route, strokeColor: "#D96C4A", strokeWeight: 3, strokeOpacity: 0.9, map });
    const b = new google.maps.LatLngBounds();
    route.forEach((p) => b.extend(p));
    map.fitBounds(b, 40);
    return () => line.setMap(null);
  }, [map, route]);
  return null;
}
