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

  test("a guide revision replaces the seeded original but never an admin edit", async () => {
    const { seedBlog } = await import("@/lib/seed");
    const rev = SEED_POSTS.find((p) => p.replacesBodyMd5?.length);
    expect(rev).toBeDefined();
    const old = "old seeded body";
    const oldMd5 = (await asService((q) => q.query<{ h: string }>(`select md5($1) as h`, [old])))[0].h;
    const test = { ...rev!, replacesBodyMd5: [oldMd5] };
    SEED_POSTS.splice(SEED_POSTS.indexOf(rev!), 1, test);
    try {
      // Unedited original: replaced.
      await asService((q) => q.query(`update public.blog_post set body_md = $2 where slug = $1`, [rev!.slug, old]));
      await asService((q) => seedBlog(q));
      expect((await getPublishedPost(rev!.slug))?.bodyMd).toBe(rev!.body);
      // Edited in the admin: left alone.
      await asService((q) => q.query(`update public.blog_post set body_md = 'edited by a human' where slug = $1`, [rev!.slug]));
      await asService((q) => seedBlog(q));
      expect((await getPublishedPost(rev!.slug))?.bodyMd).toBe("edited by a human");
    } finally {
      SEED_POSTS.splice(SEED_POSTS.indexOf(test), 1, rev!);
      await asService((q) => q.query(`update public.blog_post set body_md = $2 where slug = $1`, [rev!.slug, rev!.body]));
    }
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
