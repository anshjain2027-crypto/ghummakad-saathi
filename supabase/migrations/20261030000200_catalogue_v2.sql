-- Catalogue v2: travel access data, trek/packing details and licensed photos.
alter table public.destination add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.destination add column if not exists image_page_url text;
alter table public.destination add column if not exists photo_checked_at timestamptz;

alter table public.place add column if not exists image_url text;
alter table public.place add column if not exists image_credit text;
alter table public.place add column if not exists image_page_url text;
alter table public.place add column if not exists photo_title text;
alter table public.place add column if not exists photo_checked_at timestamptz;
