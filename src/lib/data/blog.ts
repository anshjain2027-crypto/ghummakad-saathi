import "server-only";
import { asAnon, asService, one } from "@/lib/db";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
  coverImageUrl: string | null;
  coverCredit: string | null;
  destinationId: string | null;
  tags: string[];
  authorName: string;
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date;
};

type Row = {
  id: string; slug: string; title: string; description: string; body_md: string; cover_image_url: string | null; cover_credit: string | null;
  destination_id: string | null; tags: string[]; author_name: string; status: "draft" | "published"; published_at: Date | null; updated_at: Date;
};

const map = (r: Row): BlogPost => ({
  id: r.id, slug: r.slug, title: r.title, description: r.description, bodyMd: r.body_md, coverImageUrl: r.cover_image_url,
  coverCredit: r.cover_credit, destinationId: r.destination_id, tags: r.tags ?? [], authorName: r.author_name, status: r.status,
  publishedAt: r.published_at ? new Date(r.published_at) : null, updatedAt: new Date(r.updated_at),
});

/** Public: published posts, newest first. Returns [] if the blog table isn't there yet. */
export async function listPublishedPosts(limit = 100): Promise<BlogPost[]> {
  try {
    const rows = await asAnon((q) =>
      q.query<Row>(`select * from public.blog_post where status = 'published' order by published_at desc nulls last limit $1`, [limit]),
    );
    return rows.map(map);
  } catch {
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]{1,90}$/.test(slug)) return null;
  try {
    const r = await asAnon((q) => one<Row>(q, `select * from public.blog_post where slug = $1 and status = 'published'`, [slug]));
    return r ? map(r) : null;
  } catch {
    return null;
  }
}

export async function postsForDestination(destinationId: string, limit = 3): Promise<BlogPost[]> {
  try {
    const rows = await asAnon((q) =>
      q.query<Row>(`select * from public.blog_post where status = 'published' and destination_id = $1 order by published_at desc limit $2`, [destinationId, limit]),
    );
    return rows.map(map);
  } catch {
    return [];
  }
}

// ── Admin (call only after requireRole("admin")) ──

export async function adminListPosts(): Promise<BlogPost[]> {
  try {
    const rows = await asService((q) => q.query<Row>(`select * from public.blog_post order by coalesce(published_at, created_at) desc`));
    return rows.map(map);
  } catch {
    return [];
  }
}

export async function adminGetPost(id: string): Promise<BlogPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await asService((q) => one<Row>(q, `select * from public.blog_post where id = $1`, [id]));
  return r ? map(r) : null;
}

export function readingMinutes(md: string): number {
  return Math.max(2, Math.round(md.split(/\s+/).length / 220));
}
