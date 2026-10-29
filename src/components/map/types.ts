export type MarkerKind = "curated" | "community" | "mine" | "pending" | "private" | "sponsored" | "stop" | "draft";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: MarkerKind;
  order?: number;
};

export type MapBounds = { south: number; west: number; north: number; east: number };

export type MapViewProps = {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  route?: { lat: number; lng: number }[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBoundsChange?: (b: MapBounds, zoom: number) => void;
  onMapClick?: (p: { lat: number; lng: number }) => void;
  className?: string;
  label: string;
  cluster?: boolean;
};

export type Cluster = { id: string; lat: number; lng: number; count: number; members: MapMarker[] };

/** Grid clustering in Web Mercator pixel space; independent of the map library. */
export function clusterMarkers(markers: MapMarker[], zoom: number, cellPx = 56): (MapMarker | Cluster)[] {
  if (zoom >= 13) return markers;
  const scale = 256 * 2 ** zoom;
  const cells = new Map<string, MapMarker[]>();
  const keep: MapMarker[] = [];
  for (const m of markers) {
    if (m.kind === "sponsored" || m.kind === "stop" || m.kind === "draft") {
      keep.push(m);
      continue;
    }
    const x = ((m.lng + 180) / 360) * scale;
    const s = Math.sin((m.lat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const arr = cells.get(key) ?? [];
    arr.push(m);
    cells.set(key, arr);
  }
  const out: (MapMarker | Cluster)[] = [...keep];
  for (const [key, arr] of cells) {
    if (arr.length === 1) out.push(arr[0]);
    else
      out.push({
        id: `cluster:${key}`,
        lat: arr.reduce((a, m) => a + m.lat, 0) / arr.length,
        lng: arr.reduce((a, m) => a + m.lng, 0) / arr.length,
        count: arr.length,
        members: arr,
      });
  }
  return out;
}

export function isCluster(x: MapMarker | Cluster): x is Cluster {
  return "count" in x;
}

export const MARKER_STYLE: Record<MarkerKind, { bg: string; ring: string; text: string }> = {
  curated: { bg: "#1F5145", ring: "#F5F0E6", text: "#F5F0E6" },
  community: { bg: "#2f6c63", ring: "#F5F0E6", text: "#F5F0E6" },
  mine: { bg: "#D96C4A", ring: "#F5F0E6", text: "#ffffff" },
  pending: { bg: "#F5F0E6", ring: "#D96C4A", text: "#a8492d" },
  private: { bg: "#242321", ring: "#D9B46F", text: "#D9B46F" },
  sponsored: { bg: "#D9B46F", ring: "#5a4518", text: "#242321" },
  stop: { bg: "#1F5145", ring: "#F5F0E6", text: "#F5F0E6" },
  draft: { bg: "#D96C4A", ring: "#ffffff", text: "#ffffff" },
};
