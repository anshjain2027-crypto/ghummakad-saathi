import type { CSSProperties } from "react";

/**
 * Art-directed landscape illustrations drawn in the brand palette.
 * Used wherever DESIGN.md calls for destination photography until licensed
 * photos are added (destination.hero_image_url). Deterministic per `seed`.
 */

type SceneKind = "mountains" | "beach" | "forest" | "culture" | "adventure" | "lake" | "desert" | "tea" | "city";

type Palette = { skyTop: string; skyBottom: string; sun: string; far: string; mid: string; near: string; fog: string; accent: string };

const PALETTES: Record<SceneKind, Palette> = {
  mountains: { skyTop: "#f1d9b5", skyBottom: "#f7ecdc", sun: "#f3c27e", far: "#9fb5a7", mid: "#5e8a77", near: "#1f5145", fog: "#f5f0e6", accent: "#163b32" },
  forest: { skyTop: "#dfe6d6", skyBottom: "#f2efe2", sun: "#f1dca8", far: "#a7bda5", mid: "#557f68", near: "#1f5145", fog: "#eef0e4", accent: "#123128" },
  beach: { skyTop: "#f2c9a1", skyBottom: "#f8e7d0", sun: "#ec9a6f", far: "#d9b46f", mid: "#5d9289", near: "#2f6c63", fog: "#fbf3e6", accent: "#1f5145" },
  culture: { skyTop: "#f0c7a2", skyBottom: "#f6e3c9", sun: "#d96c4a", far: "#d7aa82", mid: "#b8774f", near: "#7a4430", fog: "#f7ead6", accent: "#4b2a1e" },
  adventure: { skyTop: "#e9c6a0", skyBottom: "#f5e4cd", sun: "#e8915f", far: "#c1957a", mid: "#8f5e48", near: "#3e5a4f", fog: "#f3e7d3", accent: "#1f5145" },
  lake: { skyTop: "#d8e1dc", skyBottom: "#f3efe4", sun: "#f0d29c", far: "#a9bdb6", mid: "#6b958b", near: "#2c5f55", fog: "#f2f2ea", accent: "#1f5145" },
  desert: { skyTop: "#f0d2ad", skyBottom: "#f8ebd6", sun: "#e7a65f", far: "#e0bf91", mid: "#c99566", near: "#9a6a47", fog: "#f8eedf", accent: "#5c3d2a" },
  tea: { skyTop: "#e5e6cf", skyBottom: "#f4f0e0", sun: "#f1d49a", far: "#b3c39b", mid: "#6f9a63", near: "#2f6a4a", fog: "#f2f0e2", accent: "#1f5145" },
  city: { skyTop: "#efc9ad", skyBottom: "#f7e8d6", sun: "#d96c4a", far: "#d9b9a0", mid: "#b48a72", near: "#6d4b3d", fog: "#f6ebdd", accent: "#3c2a22" },
};

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth ridge line across the canvas, closed to the bottom. */
function ridge(r: () => number, base: number, amp: number, peaks: number, sharp = false): string {
  const W = 1200;
  const pts: [number, number][] = [];
  const n = peaks * 4;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * W;
    const wave = Math.sin((i / n) * Math.PI * peaks + r() * 2) * amp * (0.6 + r() * 0.5);
    const jitter = (r() - 0.5) * amp * (sharp ? 0.9 : 0.35);
    pts.push([x, base - Math.abs(wave) * (sharp ? 1.3 : 1) + jitter]);
  }
  let d = `M0 800 L0 ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (sharp) d += ` L${x1.toFixed(1)} ${y1.toFixed(1)}`;
    else d += ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
  }
  return `${d} L1200 ${pts[pts.length - 1][1].toFixed(1)} L1200 800 Z`;
}

function pines(r: () => number, y: number, count: number, color: string, scale = 1) {
  return Array.from({ length: count }, (_, i) => {
    const x = (i / count) * 1200 + r() * 40;
    const h = (60 + r() * 70) * scale;
    const w = h * 0.34;
    const yy = y + r() * 30;
    return <path key={i} d={`M${x} ${yy - h} L${x + w} ${yy} L${x - w} ${yy} Z`} fill={color} />;
  });
}

function palms(r: () => number, color: string) {
  return [0.08, 0.86].map((fx, i) => {
    const x = 1200 * fx + r() * 30;
    const top = 470 + r() * 40;
    return (
      <g key={i} fill="none" stroke={color} strokeLinecap="round">
        <path d={`M${x} 800 Q${x + 30} ${top + 140} ${x + 12} ${top}`} strokeWidth={14} />
        {[-70, -30, 20, 60, 100].map((a) => (
          <path key={a} d={`M${x + 12} ${top} q${Math.cos((a * Math.PI) / 180) * 90} ${Math.sin((a * Math.PI) / 180) * 30 + 30} ${Math.cos((a * Math.PI) / 180) * 150} ${Math.sin((a * Math.PI) / 180) * 70 + 60}`} strokeWidth={9} />
        ))}
      </g>
    );
  });
}

function temples(r: () => number, color: string) {
  const x = 520 + r() * 160;
  return (
    <g fill={color}>
      <rect x={x - 120} y={560} width={240} height={240} />
      <path d={`M${x - 70} 560 Q${x} 390 ${x + 70} 560 Z`} />
      <rect x={x - 4} y={370} width={8} height={40} />
      <path d={`M${x - 220} 620 Q${x - 180} 520 ${x - 140} 620 Z`} />
      <rect x={x - 230} y={620} width={100} height={180} />
      <path d={`M${x + 140} 610 Q${x + 185} 500 ${x + 230} 610 Z`} />
      <rect x={x + 130} y={610} width={110} height={190} />
      {[-90, -45, 0, 45, 90].map((dx) => (
        <rect key={dx} x={x + dx - 8} y={640} width={16} height={60} rx={8} fill="#f6e3c9" opacity={0.55} />
      ))}
    </g>
  );
}

function rooftops(r: () => number, color: string) {
  let x = 0;
  const parts = [];
  let k = 0;
  while (x < 1200) {
    const w = 60 + r() * 90;
    const h = 90 + r() * 120;
    const roof = r() > 0.5;
    parts.push(
      <g key={k++} fill={color}>
        <rect x={x} y={800 - h} width={w} height={h} />
        {roof ? <path d={`M${x - 6} ${800 - h} L${x + w / 2} ${800 - h - 40} L${x + w + 6} ${800 - h} Z`} /> : <path d={`M${x + w * 0.25} ${800 - h} Q${x + w / 2} ${800 - h - 60} ${x + w * 0.75} ${800 - h} Z`} />}
        {Array.from({ length: 3 }, (_, j) => (
          <rect key={j} x={x + 12 + j * (w / 3.4)} y={800 - h + 30} width={10} height={16} fill="#f6d9a8" opacity={0.7} />
        ))}
      </g>,
    );
    x += w + 4;
  }
  return parts;
}

function teaRows(color: string) {
  return Array.from({ length: 7 }, (_, i) => (
    <path key={i} d={`M-20 ${640 + i * 26} Q300 ${600 + i * 30} 600 ${640 + i * 22} T1220 ${620 + i * 26}`} stroke={color} strokeWidth={9} fill="none" opacity={0.55} strokeLinecap="round" />
  ));
}

export function Scene({
  kind,
  seed,
  className,
  style,
  label,
  photoUrl,
  credit,
  priority = false,
}: {
  kind: string | null | undefined;
  seed: string;
  className?: string;
  style?: CSSProperties;
  label: string;
  photoUrl?: string | null;
  credit?: string | null;
  priority?: boolean;
}) {
  const pos = className?.includes("absolute") ? "" : "relative ";
  if (photoUrl) {
    return (
      <div className={`${pos}overflow-hidden ${className ?? ""}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" loading={priority ? "eager" : "lazy"} />
        {credit ? <span className="absolute bottom-2 right-3 text-[11px] text-white/80 drop-shadow">{credit}</span> : null}
      </div>
    );
  }

  const k = (kind && kind in PALETTES ? kind : "mountains") as SceneKind;
  const p = PALETTES[k];
  const r = rng(`${seed}:${k}`);
  const id = `s${Math.abs([...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))}`;
  const sunX = 250 + r() * 700;
  const sunY = 210 + r() * 120;
  const water = k === "beach" || k === "lake";

  return (
    <div className={`${pos}overflow-hidden ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.skyTop} />
            <stop offset="1" stopColor={p.skyBottom} />
          </linearGradient>
          <radialGradient id={`${id}-sun`}>
            <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
            <stop offset="0.55" stopColor={p.sun} stopOpacity="0.35" />
            <stop offset="1" stopColor={p.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.fog} stopOpacity="0" />
            <stop offset="0.6" stopColor={p.fog} stopOpacity="0.75" />
            <stop offset="1" stopColor={p.fog} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#0d1f1a" stopOpacity="0.38" />
          </linearGradient>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        <rect width="1200" height="800" fill={`url(#${id}-sky)`} />
        <circle cx={sunX} cy={sunY} r={260} fill={`url(#${id}-sun)`} />
        <circle cx={sunX} cy={sunY} r={52} fill={p.sun} opacity={0.9} />

        {k === "mountains" || k === "adventure" || k === "desert" ? (
          <path d={ridge(r, 380, 170, 3, true)} fill={p.far} opacity={0.85} />
        ) : (
          <path d={ridge(r, 430, 70, 2)} fill={p.far} opacity={0.8} />
        )}
        {k === "mountains" ? <path d={ridge(r, 360, 120, 3, true)} fill="#fbf6ee" opacity={0.25} /> : null}

        <g className="drift">
          <rect x="-60" y={430} width="1320" height="120" fill={`url(#${id}-fog)`} />
        </g>

        {water ? (
          <>
            <rect x="0" y="560" width="1200" height="240" fill={p.mid} />
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M${r() * 900} ${590 + i * 22} h${120 + r() * 220}`} stroke={p.fog} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
            ))}
            <rect x={sunX - 30} y="566" width="60" height="200" fill={p.sun} opacity={0.18} />
            {k === "beach" ? <path d="M0 720 Q400 650 760 700 T1200 690 L1200 800 L0 800 Z" fill={p.far} /> : null}
            {k === "lake" ? <path d={ridge(r, 600, 50, 2)} fill={p.near} opacity={0.0} /> : null}
          </>
        ) : k === "adventure" ? (
          <>
            <path d={ridge(r, 560, 90, 4, true)} fill={p.mid} />
            <path d="M560 800 C600 700 520 650 600 580 C640 560 660 600 640 640 C620 700 700 760 700 800 Z" fill="#8fb3ab" opacity={0.8} />
            <path d={ridge(r, 690, 60, 5, true)} fill={p.near} />
          </>
        ) : k === "desert" ? (
          <>
            <path d={ridge(r, 600, 70, 2)} fill={p.mid} />
            <path d={ridge(r, 690, 50, 2)} fill={p.near} />
          </>
        ) : k === "tea" ? (
          <>
            <path d={ridge(r, 560, 80, 2)} fill={p.mid} />
            <path d={ridge(r, 660, 60, 2)} fill={p.near} />
            {teaRows(p.accent)}
          </>
        ) : (
          <>
            <path d={ridge(r, 570, 80, 3)} fill={p.mid} />
            <path d={ridge(r, 680, 60, 3)} fill={p.near} />
          </>
        )}

        {k === "mountains" || k === "forest" ? <g opacity={0.95}>{pines(r, 760, k === "forest" ? 26 : 16, p.accent, k === "forest" ? 1.6 : 1.1)}</g> : null}
        {k === "lake" ? <g opacity={0.9}>{pines(r, 610, 14, p.near, 0.8)}</g> : null}
        {k === "beach" ? palms(r, p.accent) : null}
        {k === "culture" ? temples(r, p.accent) : null}
        {k === "city" ? <g opacity={0.95}>{rooftops(r, p.accent)}</g> : null}

        <rect width="1200" height="800" fill={`url(#${id}-shade)`} />
        <rect width="1200" height="800" filter={`url(#${id}-grain)`} opacity={0.9} />
      </svg>
    </div>
  );
}
