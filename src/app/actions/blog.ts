"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { asService, one } from "@/lib/db";
import { audit } from "@/lib/audit";

export type BlogFormState = { error?: string; ok?: boolean };

const PostSchema = z.object({
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(90)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Web address can only use lowercase letters, numbers and dashes, e.g. best-time-to-visit-goa"),
  description: z.string().trim().min(20, "Summary needs at least 20 characters").max(300, "Keep the summary under 300 characters"),
  body: z.string().max(60_000),
  destinationId: z.string().trim().max(80).optional(),
  coverImageUrl: z.union([z.literal(""), z.string().url().startsWith("https://", "Image link must start with https://")]).optional(),
  coverCredit: z.string().trim().max(160).optional(),
  tags: z.string().trim().max(200).optional(),
  status: z.enum(["draft", "published"]),
});

export const slugify = async (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 90);

export async function saveBlogPostAction(id: string | null, _prev: BlogFormState, form: FormData): Promise<BlogFormState> {
  const admin = await requireRole("admin");
  const raw = Object.fromEntries(form.entries());
  if (!raw.slug && typeof raw.title === "string") raw.slug = await slugify(raw.title);
  const v = PostSchema.safeParse(raw);
  if (!v.success) return { error: v.error.issues[0].message };
  const d = v.data;
  const tags = (d.tags ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
  let savedId = id;
  try {
    savedId = await asService(async (q) => {
      const dest = d.destinationId ? await one<{ id: string }>(q, `select id from public.destination where id = $1`, [d.destinationId]) : undefined;
      const params = [d.slug, d.title, d.description, d.body, dest?.id ?? null, d.coverImageUrl || null, d.coverCredit || null, tags, d.status];
      let rowId: string;
      if (id) {
        const r = await one<{ id: string }>(
          q,
          `update public.blog_post set slug = $1, title = $2, description = $3, body_md = $4, destination_id = $5, cover_image_url = $6,
             cover_credit = $7, tags = $8, status = $9,
             published_at = case when $9 = 'published' then coalesce(published_at, now()) else published_at end,
             updated_at = now()
           where id = $10 returning id`,
          [...params, id],
        );
        if (!r) throw new Error("not_found");
        rowId = r.id;
      } else {
        const r = await one<{ id: string }>(
          q,
          `insert into public.blog_post (slug, title, description, body_md, destination_id, cover_image_url, cover_credit, tags, status, published_at, author_name)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, case when $9 = 'published' then now() else null end, $10) returning id`,
          [...params, admin.displayName || "Ghummakad Saathi"],
        );
        rowId = r!.id;
      }
      await audit(q, admin.id, id ? "blog.update" : "blog.create", "blog_post", rowId, { slug: d.slug, status: d.status });
      return rowId;
    });
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    if (/unique|duplicate/i.test(msg)) return { error: "Another post already uses that web address. Change the slug." };
    if (/blog_post/.test(msg) && /exist/.test(msg)) return { error: "The blog isn't switched on in the database yet. Ask Claude to finish setting up the blog." };
    console.error("blog save", e);
    return { error: "Couldn't save. Please try again." };
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${d.slug}`);
  revalidatePath("/sitemap.xml");
  if (!id) redirect(`/admin/blog/${savedId}?saved=1`);
  return { ok: true };
}

export async function deleteBlogPostAction(id: string) {
  const admin = await requireRole("admin");
  await asService(async (q) => {
    await q.query(`delete from public.blog_post where id = $1`, [id]);
    await audit(q, admin.id, "blog.delete", "blog_post", id);
  });
  revalidatePath("/blog");
  redirect("/admin/blog");
}
