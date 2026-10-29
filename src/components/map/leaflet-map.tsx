"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { clusterMarkers, isCluster, MARKER_STYLE, type MapViewProps } from "./types";

function pinHtml(kind: keyof typeof MARKER_STYLE, text: string, selected: boolean) {
  const s = MARKER_STYLE[kind];
  const size = selected ? 38 : 30;
  return `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${s.bg};color:${s.text};border:3px solid ${s.ring};box-shadow:0 6px 14px -6px rgba(0,0,0,.45);font:600 12px/1 'DM Sans Variable',system-ui;${kind === "pending" ? "border-style:dashed;" : ""}">${text}</span>`;
}

/** Preview map: Leaflet + OpenStreetMap tiles (used when no Google Maps key is configured). */
export default function LeafletMap(props: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const cbs = useRef(props);
  cbs.current = props;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: true }).setView([props.center.lat, props.center.lng], props.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const emit = () => {
      const b = m.getBounds();
      cbs.current.onBoundsChange?.({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }, m.getZoom());
      draw();
    };
    m.on("moveend", emit);
    m.on("click", (e: L.LeafletMouseEvent) => cbs.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    emit();
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const m = map.current;
    const lg = layer.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const { markers, selectedId, cluster = true } = cbs.current;
    const items = cluster ? clusterMarkers(markers, m.getZoom()) : markers;
    for (const it of items) {
      if (isCluster(it)) {
        const mk = L.marker([it.lat, it.lng], {
          icon: L.divIcon({ html: pinHtml("curated", String(it.count), false).replace("30px;height:30px", "40px;height:40px"), className: "", iconSize: [40, 40] }),
          keyboard: true,
          title: `${it.count} places — zoom in`,
          alt: `${it.count} places`,
        });
        mk.on("click", () => m.setView([it.lat, it.lng], Math.min(m.getZoom() + 3, 16)));
        mk.addTo(lg);
      } else {
        const sel = it.id === selectedId;
        const text = it.order ? String(it.order) : it.kind === "sponsored" ? "Ad" : it.kind === "private" ? "★" : "";
        const mk = L.marker([it.lat, it.lng], {
          icon: L.divIcon({ html: pinHtml(it.kind, text, sel), className: "", iconSize: sel ? [38, 38] : [30, 30] }),
          keyboard: true,
          title: it.label,
          alt: it.label,
          zIndexOffset: sel ? 1000 : it.kind === "sponsored" ? -100 : 0,
        });
        mk.on("click", () => cbs.current.onSelect?.(it.id));
        mk.addTo(lg);
      }
    }
  }

  useEffect(() => {
    draw();
     
  }, [props.markers, props.selectedId]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    routeLayer.current?.remove();
    if (props.route && props.route.length > 1) {
      routeLayer.current = L.polyline(
        props.route.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#D96C4A", weight: 3, dashArray: "6 8", opacity: 0.9 },
      ).addTo(m);
      m.fitBounds(routeLayer.current.getBounds(), { padding: [40, 40], maxZoom: 13 });
    }
  }, [props.route]);

  useEffect(() => {
    map.current?.setView([props.center.lat, props.center.lng], props.zoom);
  }, [props.center.lat, props.center.lng, props.zoom]);

  return <div ref={el} className={props.className} role="application" aria-label={props.label} />;
}
