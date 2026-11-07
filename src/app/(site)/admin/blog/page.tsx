import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { adminListPosts } from "@/lib/data/blog";
import { ButtonLink, Chip } from "@/components/ui";

export default async function AdminBlog() {
  await requireRole("admin", "/admin/blog");
  const posts = await adminListPosts();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px]">Blog</h1>
          <p className="mt-2 text-ink-soft">Write India travel guides that bring visitors from Google. Published posts appear at /blog and in the sitemap.</p>
        </div>
        <ButtonLink href="/admin/blog/new">Write a new post</ButtonLink>
      </div>
      {posts.length === 0 ? (
        <p className="text-ink-soft">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/admin/blog/${p.id}`} className="font-serif text-[20px] hover:text-forest">
                  {p.title}
                </Link>
                <p className="text-[13px] text-ink-soft">
                  /blog/{p.slug} · updated {p.updatedAt.toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Chip tone={p.status === "published" ? "forest" : "sand"}>{p.status === "published" ? "Published" : "Draft"}</Chip>
                {p.status === "published" ? (
                  <a href={`/blog/${p.slug}`} target="_blank" className="text-[14px] text-forest underline">
                    View
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
