-- Blog / travel guides (SEO). Public can read published posts; writes go through admin server actions.
create table if not exists public.blog_post (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 90),
  title text not null check (length(title) between 5 and 140),
  description text not null check (length(description) between 20 and 300),
  body_md text not null default '',
  cover_image_url text,
  cover_credit text,
  destination_id text references public.destination(id) on delete set null,
  tags text[] not null default '{}',
  author_name text not null default 'Ghummakad Saathi',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_post_published_idx on public.blog_post (status, published_at desc);
create index if not exists blog_post_destination_idx on public.blog_post (destination_id);

alter table public.blog_post enable row level security;
drop policy if exists blog_read_published on public.blog_post;
create policy blog_read_published on public.blog_post for select to anon, authenticated using (status = 'published');
grant select on public.blog_post to anon, authenticated;
