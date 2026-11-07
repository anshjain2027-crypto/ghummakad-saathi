import { requireRole } from "@/lib/auth";
import { listDestinations } from "@/lib/data/catalog";
import { PostForm } from "../post-form";

export default async function NewPost() {
  await requireRole("admin", "/admin/blog/new");
  const destinations = await listDestinations();
  return (
    <div className="space-y-6">
      <h1 className="text-[36px]">New post</h1>
      <PostForm
        id={null}
        initial={{ title: "", slug: "", description: "", body: "", destinationId: "", coverImageUrl: "", coverCredit: "", tags: "", status: "draft" }}
        destinations={destinations.filter((d) => d.countryCode === "IN").map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
