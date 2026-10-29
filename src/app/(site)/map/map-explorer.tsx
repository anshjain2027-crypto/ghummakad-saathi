"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapView } from "@/components/map/map-view";
import type { MapBounds, MapMarker } from "@/components/map/types";
import { Button, Chip, Notice, SponsoredLabel, Stars, inputClass } from "@/components/ui";
import { ImpressionBeacon } from "@/components/impression-beacon";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { customPinAction, submitPlaceAction, type FormResult } from "@/app/actions/community";
import type { MapPlace, PrivatePin } from "@/lib/data/community";
import type { SponsoredItem } from "@/lib/sponsors";

type Sponsored = SponsoredItem & { lat: number; lng: number };
type Mode = "browse" | "add" | "pin";

export function MapExplorer({ initial, sponsored }: { initial: { lat: number; lng: number; zoom: number; category: string | null }; sponsored: Sponsored[] }) {
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [pins, setPins] = useState<PrivatePin[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [category, setCategory] = useState<string | null>(initial.category);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [showPrivate, setShowPrivate] = useState(true);
  const bounds = useRef<{ b: MapBounds; z: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(() => {
    if (!bounds.current) return;
    const { b, z } = bounds.current;
    const qs = new URLSearchParams({ s: String(b.south), w: String(b.west), n: String(b.north), e: String(b.east) });
    if (category) qs.set("cat", category);
    if (query.trim()) qs.set("q", query.trim());
    setStatus("loading");
    fetch(`/api/map/places?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { places: MapPlace[]; pins: PrivatePin[] }) => {
        setPlaces(d.places);
        setPins(d.pins);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    const c = { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
    const url = new URL(window.location.href);
    url.searchParams.set("lat", c.lat.toFixed(4));
    url.searchParams.set("lng", c.lng.toFixed(4));
    url.searchParams.set("z", String(Math.round(z)));
    if (category) url.searchParams.set("cat", category);
    else url.searchParams.delete("cat");
    window.history.replaceState(null, "", url);
  }, [category, query]);

  const onBounds = useCallback(
    (b: MapBounds, z: number) => {
      bounds.current = { b, z };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, 350);
    },
    [load],
  );

  useEffect(() => {
    load();
  }, [load, refresh]);

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = places.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      label: p.name,
      kind: p.status === "pending" ? "pending" : p.mine ? "mine" : p.source === "curated" ? "curated" : "community",
    }));
    if (showPrivate) for (const pin of pins) m.push({ id: `pin:${pin.id}`, lat: pin.lat, lng: pin.lng, label: `${pin.name} (private)`, kind: "private" });
    for (const s of sponsored) m.push({ id: `ad:${s.campaignId}`, lat: s.lat, lng: s.lng, label: `Sponsored: ${s.title}`, kind: "sponsored" });
    if (point) m.push({ id: "draft", lat: point.lat, lng: point.lng, label: "New pin", kind: "draft" });
    return m;
  }, [places, pins, sponsored, point, showPrivate]);

  const sel = places.find((p) => p.id === selected);
  const selPin = selected?.startsWith("pin:") ? pins.find((p) => `pin:${p.id}` === selected) : undefined;
  const selAd = selected?.startsWith("ad:") ? sponsored.find((s) => `ad:${s.campaignId}` === selected) : undefined;

  return (
    <div className="grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[400px_1fr]">
      <div className="order-2 flex min-h-0 flex-col border-line bg-cream lg:order-1 lg:border-r">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-[28px]">Community map</h1>
            <label className="flex min-h-11 items-center gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" checked={showPrivate} onChange={(e) => setShowPrivate(e.target.checked)} className="h-4 w-4 accent-[var(--forest)]" />
              My private pins
            </label>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            role="search"
          >
            <label htmlFor="map-q" className="sr-only">
              Search places on the map
            </label>
            <input id="map-q" className={inputClass} placeholder="Search places in this area" value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
          <div className="scroller -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filter by category">
            <FilterChip on={!category} onClick={() => setCategory(null)}>
              All
            </FilterChip>
            {PLACE_CATEGORIES.map((c) => (
              <FilterChip key={c.id} on={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant={mode === "add" ? "primary" : "secondary"} className="flex-1 px-3 text-[14px]" onClick={() => { setMode(mode === "add" ? "browse" : "add"); setPoint(null); }} aria-pressed={mode === "add"}>
              Add public place
            </Button>
            <Button variant={mode === "pin" ? "primary" : "secondary"} className="flex-1 px-3 text-[14px]" onClick={() => { setMode(mode === "pin" ? "browse" : "pin"); setPoint(null); }} aria-pressed={mode === "pin"}>
              Save private pin
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {mode !== "browse" ? (
            <AddPanel
              mode={mode}
              point={point}
              onPoint={setPoint}
              onDone={() => {
                setMode("browse");
                setPoint(null);
                setRefresh((n) => n + 1);
              }}
            />
          ) : selAd ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[#c9a65d] bg-[#fbf6ea] p-4">
              <ImpressionBeacon token={selAd.impressionToken} />
              <SponsoredLabel demo={selAd.isDemo} />
              <p className="mt-2 font-serif text-[22px]">{selAd.title}</p>
              <p className="mt-1 text-[14px] text-ink-soft">{selAd.body}</p>
              <p className="mt-2 text-[12px] text-ink-soft">Advertiser: {selAd.advertiser}. Paid placement — not a community recommendation.</p>
              <a href={`/api/sponsor/click?t=${encodeURIComponent(selAd.clickToken)}`} target="_blank" rel="sponsored nofollow noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-[15px]">
                Visit advertiser
              </a>
            </div>
          ) : selPin ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <Chip tone="plain">Private pin · only you can see this</Chip>
              <p className="mt-2 font-serif text-[22px]">{selPin.name}</p>
              {selPin.note ? <p className="mt-1 text-[14px] text-ink-soft">{selPin.note}</p> : null}
              <Link href="/my/places" className="mt-3 inline-block text-[14px] text-forest underline">
                Manage saved places
              </Link>
            </div>
          ) : sel ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <Chip tone={sel.source === "curated" ? "forest" : "sand"}>{sel.source === "curated" ? "Editorial pick" : "Community pin"}</Chip>
                {sel.status === "pending" ? <Chip tone="terracotta">Awaiting review · visible only to you</Chip> : null}
                {sel.hiddenGem ? <Chip>Lesser-known</Chip> : null}
              </div>
              <p className="mt-2 font-serif text-[24px] leading-tight">{sel.name}</p>
              <p className="text-[14px] text-ink-soft">{PLACE_CATEGORIES.find((c) => c.id === sel.category)?.label}</p>
              {sel.reviewCount ? (
                <p className="mt-2 flex items-center gap-2 text-[14px]">
                  <Stars value={sel.avgRating ?? 0} /> {sel.avgRating} · {sel.reviewCount} explorer {sel.reviewCount === 1 ? "review" : "reviews"}
                </p>
              ) : (
                <p className="mt-2 text-[14px] text-ink-soft">No explorer reviews yet.</p>
              )}
              <Link href={`/places/${sel.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-forest px-4 text-[15px] font-medium text-cream">
                Open place
              </Link>
              <button className="ml-3 min-h-11 text-[14px] text-forest underline" onClick={() => setSelected(null)}>
                Back to list
              </button>
            </div>
          ) : status === "error" ? (
            <Notice tone="error" title="The map data didn't load">
              Check your connection and{" "}
              <button className="font-semibold underline" onClick={load}>
                try again
              </button>
              .
            </Notice>
          ) : status === "loading" && !places.length ? (
            <p className="text-[15px] text-ink-soft" role="status">
              Loading places in this area…
            </p>
          ) : places.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-5 text-center">
              <p className="font-serif text-[22px]">Nothing pinned here yet</p>
              <p className="mt-1 text-[14px] text-ink-soft">Zoom out, try another filter, or add the first place you love in this area.</p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Places in view">
              {places.slice(0, 80).map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSelected(p.id)} className="flex w-full items-start gap-3 rounded-[14px] border border-transparent bg-surface p-3 text-left hover:border-line-strong">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${p.status === "pending" ? "border-2 border-dashed border-terracotta" : p.mine ? "bg-terracotta" : "bg-forest"}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-[13px] text-ink-soft">
                        {PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}
                        {p.status === "pending" ? " · awaiting review" : ""}
                        {p.reviewCount ? ` · ★ ${p.avgRating} (${p.reviewCount})` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {places.length > 80 ? <li className="px-2 text-[13px] text-ink-soft">Zoom in to see all {places.length} places.</li> : null}
            </ul>
          )}
        </div>
        <p className="border-t border-line px-4 py-3 text-[12px] text-ink-soft">
          Explorer reviews are written by Ghummakad Saathi members and stored here — they aren&rsquo;t Google reviews. <Link href="/community-guidelines" className="underline">Guidelines</Link>
        </p>
      </div>

      <div className="order-1 h-[58vh] lg:order-2 lg:h-full">
        <MapView
          center={{ lat: initial.lat, lng: initial.lng }}
          zoom={initial.zoom}
          markers={markers}
          selectedId={selected}
          onSelect={(id) => {
            setSelected(id === "draft" ? null : id);
            if (mode !== "browse" && id !== "draft") setMode("browse");
          }}
          onBoundsChange={onBounds}
          onMapClick={(p) => (mode !== "browse" ? setPoint(p) : undefined)}
          label="Community map. Use the list beside the map to browse places with a keyboard."
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`min-h-11 shrink-0 rounded-[var(--radius-chip)] border px-3 text-[14px] ${on ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface hover:border-forest"}`}>
      {children}
    </button>
  );
}

type SearchResult = { googlePlaceId: string; name: string; address: string; lat: number; lng: number };

function AddPanel({ mode, point, onPoint, onDone }: { mode: Exclude<Mode, "browse">; point: { lat: number; lng: number } | null; onPoint: (p: { lat: number; lng: number }) => void; onDone: () => void }) {
  const [pubState, pubAction, pubPending] = useActionState<FormResult | null, FormData>(submitPlaceAction, null);
  const [pinState, pinAction, pinPending] = useActionState<FormResult | null, FormData>(customPinAction, null);
  const state = mode === "add" ? pubState : pinState;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onDone, 2200);
      return () => clearTimeout(t);
    }
  }, [state, onDone]);

  async function search() {
    setSearchNote(null);
    const r = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
    if (r.status === 404) {
      setSearchNote("Place search needs Google Maps, which isn't set up yet. Tap the map to drop the pin instead.");
      setResults([]);
      return;
    }
    if (!r.ok) {
      setSearchNote("Search is unavailable right now. Tap the map to drop the pin instead.");
      setResults([]);
      return;
    }
    const d = (await r.json()) as { results: SearchResult[] };
    setResults(d.results);
    if (!d.results.length) setSearchNote("Location not found. Try another name, or tap the map.");
  }

  if (state?.ok) return <Notice tone="success">{state.message}</Notice>;

  return (
    <div className="space-y-4">
      <p className="text-[15px]">
        {mode === "add" ? "Share a place with other explorers. A moderator checks it before it goes public." : "Save a spot just for yourself. Nobody else can see private pins."}
      </p>
      {mode === "add" ? (
        <div className="space-y-2">
          <label htmlFor="loc-q" className="block text-[14px] font-medium">
            Find the location (optional)
          </label>
          <div className="flex gap-2">
            <input id="loc-q" className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" />
            <Button type="button" variant="secondary" onClick={search} disabled={q.trim().length < 3}>
              Search
            </Button>
          </div>
          {searchNote ? <p className="text-[13px] text-ink-soft">{searchNote}</p> : null}
          {results?.length ? (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.googlePlaceId}>
                  <button type="button" className="w-full rounded-[10px] border border-line bg-surface p-2 text-left text-[14px] hover:border-forest" onClick={() => { setPicked(r); onPoint({ lat: r.lat, lng: r.lng }); setName((n) => n || r.name); }}>
                    <strong>{r.name}</strong>
                    <span className="block text-ink-soft">{r.address}</span>
                  </button>
                </li>
              ))}
              <li className="text-[11px] text-ink-soft">Search results from Google</li>
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className={`rounded-[12px] px-3 py-2 text-[14px] ${point ? "bg-forest-soft text-forest-deep" : "bg-sand-soft"}`} role="status">
        {point ? `Pin at ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} — tap the map to move it.` : "Tap the map to place the pin."}
      </p>

      <form action={mode === "add" ? pubAction : pinAction} className="space-y-3">
        <input type="hidden" name="lat" value={point?.lat ?? ""} />
        <input type="hidden" name="lng" value={point?.lng ?? ""} />
        {picked ? <input type="hidden" name="googlePlaceId" value={picked.googlePlaceId} /> : null}
        <label className="block space-y-1 text-[14px] font-medium">
          Name
          <input name="name" required maxLength={120} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          {state?.fieldErrors?.name ? <span className="block text-error">{state.fieldErrors.name}</span> : null}
        </label>
        {mode === "add" ? (
          <>
            <label className="block space-y-1 text-[14px] font-medium">
              Type of place
              <select name="category" className={inputClass} defaultValue="lesser_known">
                {PLACE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[14px] font-medium">
              Why it&rsquo;s worth going
              <textarea name="description" required minLength={20} maxLength={1200} rows={4} className={`${inputClass} py-2`} placeholder="What makes it special? When is best? Anything to know?" />
              {state?.fieldErrors?.description ? <span className="block text-error">{state.fieldErrors.description}</span> : null}
            </label>
          </>
        ) : (
          <label className="block space-y-1 text-[14px] font-medium">
            Note (private)
            <textarea name="note" maxLength={500} rows={3} className={`${inputClass} py-2`} />
          </label>
        )}
        {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
        <Button type="submit" className="w-full" disabled={!point || pubPending || pinPending}>
          {mode === "add" ? (pubPending ? "Submitting…" : "Submit for review") : pinPending ? "Saving…" : "Save privately"}
        </Button>
      </form>
    </div>
  );
}
