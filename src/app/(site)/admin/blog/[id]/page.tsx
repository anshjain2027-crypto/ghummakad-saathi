import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { adminGetPost } from "@/lib/data/blog";
import { listDestinations } from "@/lib/data/catalog";
import { deleteBlogPostAction } from "@/app/actions/blog";
import { Button } from "@/components/ui";
import { PostForm } from "../post-form";

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  await requireRole("admin", `/admin/blog/${id}`);
  const [post, destinations, sp] = await Promise.all([adminGetPost(id), listDestinations(), searchParams]);
  if (!post) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[36px]">Edit post</h1>
        {post.status === "published" ? (
          <a href={`/blog/${post.slug}`} target="_blank" className="text-[15px] text-forest underline">
            View live post ↗
          </a>
        ) : null}
      </div>
      <PostForm
        id={post.id}
        saved={sp.saved === "1"}
        initial={{
          title: post.title,
          slug: post.slug,
          description: post.description,
          body: post.bodyMd,
          destinationId: post.destinationId ?? "",
          coverImageUrl: post.coverImageUrl ?? "",
          coverCredit: post.coverCredit ?? "",
          tags: post.tags.join(", "),
          status: post.status,
        }}
        destinations={destinations.filter((d) => d.countryCode === "IN").map((d) => ({ id: d.id, name: d.name }))}
      />
      <form action={deleteBlogPostAction.bind(null, post.id)} className="border-t border-line pt-6">
        <Button type="submit" variant="secondary">
          Delete this post
        </Button>
      </form>
    </div>
  );
}
