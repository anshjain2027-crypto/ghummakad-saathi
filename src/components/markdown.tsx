import { Fragment, type ReactNode } from "react";

/**
 * Small, safe Markdown renderer for blog posts (no HTML passthrough — every
 * piece of text is rendered as React text, so posts can't inject scripts).
 * Supports: ## / ### headings, paragraphs, - and 1. lists, > quotes,
 * **bold**, *italic*, [links](https://…) and internal links (/plan),
 * pipe tables, and ![alt](/path.jpg) images or ![alt](/path.mp4) videos on
 * their own line, with an optional *italic* caption line right after.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("[")) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      const href = lm[2];
      const safe = /^(https?:\/\/|\/(?!\/))/.test(href);
      if (!safe) out.push(lm[1]);
      else {
        const external = href.startsWith("http");
        out.push(
          <a key={k} href={href} className="text-forest underline underline-offset-4" {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
            {lm[1]}
          </a>,
        );
      }
    } else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const MEDIA_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;
/** Own files (/blog/…) or https only — never javascript:, data: or protocol-relative URLs. */
const SAFE_SRC = /^(https:\/\/|\/(?!\/))/;
const TABLE_SEP = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

export function slugifyHeading(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const k = `b${key++}`;
    const media = line.trim().match(MEDIA_RE);
    if (media && SAFE_SRC.test(media[2])) {
      const [, alt, src] = media;
      i++;
      // An italic line straight after the image or video is its caption (photo credit, etc.).
      let caption: string | null = null;
      if (i < lines.length && /^\*[^*].*\*$/.test(lines[i].trim())) caption = lines[i++].trim().slice(1, -1);
      blocks.push(
        <figure key={k} className="mt-8">
          {VIDEO_RE.test(src) ? (
            <video src={src} controls playsInline preload="metadata" aria-label={alt} className="w-full rounded-[var(--radius-card)] bg-ink" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- plain img keeps blog posts free of next/image remote config.
            <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full rounded-[var(--radius-card)]" />
          )}
          {caption ? <figcaption className="mt-2 text-[14px] text-ink-soft">{inline(caption, `${k}-c`)}</figcaption> : null}
        </figure>,
      );
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={k} className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[16px]">
            <thead>
              <tr>
                {head.map((c, j) => (
                  <th key={j} className="border-b-2 border-sand px-3 py-2 font-semibold">
                    {inline(c, `${k}-h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j} className="border-b border-sand px-3 py-2 align-top">
                      {inline(c, `${k}-${ri}-${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const Tag = h[1].length === 2 ? "h2" : "h3";
      blocks.push(
        <Tag key={k} id={slugifyHeading(h[2])} className={Tag === "h2" ? "mt-10 text-[28px] sm:text-[32px]" : "mt-8 text-[22px]"}>
          {inline(h[2], k)}
        </Tag>,
      );
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote key={k} className="mt-6 border-l-4 border-sand pl-4 text-[18px] italic text-ink-soft">
          {inline(buf.join(" "), k)}
        </blockquote>,
      );
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\.\s+/ : /^[-*]\s+/).test(lines[i])) items.push(lines[i++].replace(/^([-*]|\d+\.)\s+/, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={k} className={`mt-5 space-y-2 pl-6 text-[17px] leading-relaxed ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}-${j}`)}</li>
          ))}
        </List>,
      );
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|[-*]\s|\d+\.\s)/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(
      <p key={k} className="mt-5 text-[17px] leading-relaxed">
        {inline(buf.join(" "), k)}
      </p>,
    );
  }
  return <Fragment>{blocks}</Fragment>;
}
