import { describe, expect, test } from "vitest";
import { asAnon, asService } from "@/lib/db";
import { getPublishedPost, listPublishedPosts } from "@/lib/data/blog";
import { SEED_POSTS } from "@/lib/seed/blog";

describe("blog", () => {
  test("starter guides are seeded and published", async () => {
    const posts = await listPublishedPosts();
    for (const s of SEED_POSTS) expect(posts.map((p) => p.slug)).toContain(s.slug);
    const triund = await getPublishedPost("triund-trek-guide-mcleodganj");
    expect(triund?.destinationId).toBe("mcleodganj-triund");
  });

  test("drafts are invisible to the public, even via direct SQL", async () => {
    await asService((q) =>
      q.query(
        `insert into public.blog_post (slug, title, description, body_md, status) values ('secret-draft', 'A secret draft post', 'This draft must not be visible to anyone', 'x', 'draft')
         on conflict (slug) do nothing`,
      ),
    );
    expect(await getPublishedPost("secret-draft")).toBeNull();
    const raw = await asAnon((q) => q.query(`select slug from public.blog_post where slug = 'secret-draft'`));
    expect(raw).toHaveLength(0);
    await expect(asAnon((q) => q.query(`insert into public.blog_post (slug, title, description) values ('hack-post', 'Hacked title here', 'Hacked description text')`))).rejects.toThrow();
  });
});
