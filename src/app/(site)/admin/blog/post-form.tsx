"use client";

import { useActionState, useState } from "react";
import { saveBlogPostAction, type BlogFormState } from "@/app/actions/blog";
import { Button, Field, inputClass, Notice } from "@/components/ui";

type Initial = {
  title: string;
  slug: string;
  description: string;
  body: string;
  destinationId: string;
  coverImageUrl: string;
  coverCredit: string;
  tags: string;
  status: "draft" | "published";
};

export function PostForm({ id, initial, destinations, saved }: { id: string | null; initial: Initial; destinations: { id: string; name: string }[]; saved?: boolean }) {
  const [state, action, pending] = useActionState<BlogFormState, FormData>(saveBlogPostAction.bind(null, id), saved ? { ok: true } : {});
  const [desc, setDesc] = useState(initial.description);
  const [title, setTitle] = useState(initial.title);
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : state.ok ? <Notice tone="success">Saved.</Notice> : null}
      <Field label="Title" htmlFor="title" hint={`${title.length}/140 · Put the main search phrase first, e.g. "Goa in 4 days: …"`}>
        <input id="title" name="title" required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Web address (slug)" htmlFor="slug" hint="Leave empty to make one from the title. Lowercase words with dashes.">
        <input id="slug" name="slug" defaultValue={initial.slug} maxLength={90} className={inputClass} placeholder="goa-4-day-itinerary" />
      </Field>
      <Field label="Summary for Google (meta description)" htmlFor="description" hint={`${desc.length}/300 · Aim for 140–160 characters that make someone click.`}>
        <textarea id="description" name="description" rows={3} maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} className={inputClass} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Linked destination (optional)" htmlFor="destinationId" hint="Adds its photo and a 'Plan this trip' button.">
          <select id="destinationId" name="destinationId" defaultValue={initial.destinationId} className={inputClass}>
            <option value="">None</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Comma separated, e.g. trekking, himalaya, weekend">
          <input id="tags" name="tags" defaultValue={initial.tags} className={inputClass} />
        </Field>
        <Field label="Cover photo link (optional)" htmlFor="coverImageUrl" hint="An https:// image link you have the right to use. Empty = destination photo.">
          <input id="coverImageUrl" name="coverImageUrl" type="url" defaultValue={initial.coverImageUrl} className={inputClass} />
        </Field>
        <Field label="Photo credit" htmlFor="coverCredit" hint="e.g. Photo: Ansh Jain">
          <input id="coverCredit" name="coverCredit" defaultValue={initial.coverCredit} className={inputClass} />
        </Field>
      </div>
      <Field label="Article" htmlFor="body" hint="Write normally. ## for a section heading, - for a bullet, **bold**, [link text](https://…).">
        <textarea id="body" name="body" rows={24} defaultValue={initial.body} className={`${inputClass} font-mono text-[14px] leading-relaxed`} />
      </Field>
      <fieldset className="flex flex-wrap items-center gap-6">
        <legend className="mb-2 text-[14px] font-medium">Status</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="status" value="draft" defaultChecked={initial.status === "draft"} /> Draft (only you can see it)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="status" value="published" defaultChecked={initial.status === "published"} /> Published (live on the site)
        </label>
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save post"}
      </Button>
    </form>
  );
}
