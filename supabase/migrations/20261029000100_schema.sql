-- Ghummakad Saathi — core schema
-- Runs unchanged on Supabase Postgres and (with db/local/000_supabase_shim.sql) on PGlite.
-- Coordinates use plain double precision + btree indexes so viewport queries work
-- everywhere; PostGIS can be layered on in Supabase later (see docs/ARCHITECTURE.md).

-- ───────────────────────── Identity ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 40),
  home_country text,
  display_currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Explorer'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and (role = r or role = 'admin')
  )
$$;

-- ───────────────────────── Catalogue ─────────────────────────
create table if not exists public.destination (
  id text primary key,                         -- stable slug, e.g. 'tirthan-valley'
  name text not null,
  region text not null,
  country text not null,
  country_code char(2) not null,
  lat double precision not null,
  lng double precision not null,
  timezone text not null,
  local_currency text not null,
  tagline text not null,
  story text not null,
  moods text[] not null,
  styles text[] not null,
  companions text[] not null,
  experience_tags text[] not null,
  daily_cost_inr jsonb not null,               -- {"backpacking":[lo,hi],"comfortable":[lo,hi],"luxury":[lo,hi]} per person per day, illustrative
  suggested_days_min int not null,
  suggested_days_max int not null,
  best_months int[] not null,
  season_note text not null,
  travel_character text not null,
  practical_note text not null,
  getting_there text not null,
  stay_area text not null,
  nearest_airport_iata text,
  nearest_rail_station text,
  scene text not null default 'mountains',
  hero_image_url text,
  image_credit text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  provenance text not null default 'editorial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists destination_country_idx on public.destination (country_code);

create table if not exists public.place (
  id uuid primary key default gen_random_uuid(),
  destination_id text references public.destination(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category in ('viewpoint', 'nature', 'food', 'stay', 'culture', 'experience', 'lesser_known')),
  description text not null default '' check (char_length(description) <= 1200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  country_code char(2),
  source text not null check (source in ('curated', 'community')),
  coords_source text not null default 'first_party' check (coords_source in ('first_party', 'google')),
  coords_cached_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  avg_duration_min int,
  est_cost_inr int,
  best_time text check (best_time in ('morning', 'afternoon', 'evening', 'any')),
  hidden_gem boolean not null default false,
  scene text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists place_lat_lng_idx on public.place (lat, lng);
create index if not exists place_category_idx on public.place (category);
create index if not exists place_destination_idx on public.place (destination_id);
create index if not exists place_status_idx on public.place (status);
create index if not exists place_created_by_idx on public.place (created_by);

create table if not exists public.place_external_reference (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place(id) on delete cascade,
  provider text not null check (provider in ('google', 'openstreetmap')),
  external_id text not null,                   -- Google place IDs may be stored indefinitely per Places policy
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists public.private_saved_place (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid references public.place(id) on delete cascade,
  custom_name text check (custom_name is null or char_length(custom_name) between 1 and 120),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (place_id is not null or (custom_name is not null and lat is not null and lng is not null))
);
create unique index if not exists private_saved_place_unique on public.private_saved_place (user_id, place_id) where place_id is not null;
create index if not exists private_saved_place_user_idx on public.private_saved_place (user_id);

create table if not exists public.place_review (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.place(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1500),
  worth_going text not null check (worth_going in ('yes', 'depends', 'no')),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id)
);
create index if not exists place_review_place_idx on public.place_review (place_id, status);

create table if not exists public.review_report (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.place_review(id) on delete cascade,
  place_id uuid references public.place(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('inaccurate', 'abusive', 'spam', 'self_promotion', 'unsafe', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'upheld', 'dismissed')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (review_id is not null or place_id is not null)
);
create unique index if not exists review_report_once on public.review_report (reporter_id, coalesce(review_id, place_id));

create table if not exists public.moderation_action (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references auth.users(id),
  target_type text not null check (target_type in ('place', 'review', 'report')),
  target_id uuid not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Planner ─────────────────────────
create table if not exists public.trip_draft (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  anon_token_hash text,                        -- sha256 of an httpOnly cookie; never the raw token
  preferences jsonb not null,                  -- validated trip_preference payload (see src/lib/planner/schema.ts)
  selected_destination_id text references public.destination(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_id is not null or anon_token_hash is not null)
);
create index if not exists trip_draft_owner_idx on public.trip_draft (owner_id);
create index if not exists trip_draft_token_idx on public.trip_draft (anon_token_hash);

create table if not exists public.destination_match (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.trip_draft(id) on delete cascade,
  destination_id text not null references public.destination(id),
  rank int not null,
  organic_recommendation_score numeric not null,   -- never influenced by sponsorship
  reasons jsonb not null,
  estimate jsonb not null,
  created_at timestamptz not null default now(),
  unique (draft_id, rank)
);

create table if not exists public.trip_plan (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid unique references public.trip_draft(id) on delete set null,
  destination_id text not null references public.destination(id),
  preferences jsonb not null,
  travellers int not null check (travellers between 1 and 30),
  current_version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trip_plan_owner_idx on public.trip_plan (owner_id);

create table if not exists public.trip_edit_history (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trip_plan(id) on delete cascade,
  version int not null,
  destination_id text not null references public.destination(id),
  plan jsonb not null,                         -- validated TripPlan (days → stops); see ARCHITECTURE.md
  change_summary text not null,
  generator text not null,                     -- 'mock' | 'llm:<model>' | 'manual'
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (trip_id, version)
);

create table if not exists public.trip_self_booking (
  trip_id uuid not null references public.trip_plan(id) on delete cascade,
  item_key text not null,
  status text not null check (status in ('not_booked', 'self_reported_booked')),
  note text check (note is null or char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  primary key (trip_id, item_key)
);

-- ───────────────────────── Payments ─────────────────────────
create table if not exists public.payment_order (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid references public.trip_draft(id) on delete set null,
  trip_id uuid references public.trip_plan(id) on delete set null,
  purpose text not null check (purpose in ('trip_purchase', 'tier_upgrade', 'renewal')),
  tier text not null check (tier in ('standard', 'group')),
  travellers int not null,
  amount_paise int not null check (amount_paise > 0),
  currency text not null default 'INR',
  provider text not null check (provider in ('dodo', 'mock')),
  checkout_session_id text unique,
  provider_order_id text unique,
  provider_payment_id text unique,
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'cancelled')),
  failure_reason text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists payment_order_user_idx on public.payment_order (user_id);
create index if not exists payment_order_status_idx on public.payment_order (status, created_at);

create table if not exists public.payment_event (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  order_id uuid references public.payment_order(id),
  event_type text not null,
  signature_valid boolean not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists public.trip_entitlement (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trip_plan(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_order_id uuid not null unique references public.payment_order(id),
  tier text not null check (tier in ('standard', 'group')),
  paid_at timestamptz not null,
  edit_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (edit_expires_at = paid_at + interval '30 days')
);
create index if not exists trip_entitlement_trip_idx on public.trip_entitlement (trip_id, edit_expires_at desc);

-- ───────────────────────── Partners & referrals ─────────────────────────
create table if not exists public.provider_adapter_status (
  provider text primary key,
  category text not null check (category in ('stay', 'flight', 'train', 'event', 'vehicle', 'activity', 'maps', 'ai', 'search', 'payments')),
  mode text not null check (mode in ('mock', 'redirect', 'sandbox_approved', 'approved_api', 'disabled')),
  notes text not null,
  docs_url text,
  verified_at date,
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_link (
  id uuid primary key default gen_random_uuid(),
  provider text not null references public.provider_adapter_status(provider),
  label text not null,
  affiliate_id text,                           -- only set once the programme has approved us
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.outbound_click (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_hash text not null,
  provider text not null,
  target_host text not null,
  context text not null,
  is_affiliate boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Sponsorship (CPC) ─────────────────────────
create table if not exists public.sponsor_business (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null check (service_type in ('stay', 'vehicle_rental', 'activity', 'agency')),
  website text,
  contact_email text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsor_placement (
  id text primary key,                         -- 'match_support' | 'destination_sidebar' | 'map_pin' | 'trip_module'
  description text not null,
  max_slots int not null default 1
);

create table if not exists public.sponsor_campaign (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.sponsor_business(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'exhausted', 'ended', 'suspended')),
  placements text[] not null,
  destination_ids text[] not null default '{}',
  country_codes text[] not null default '{}',
  categories text[] not null default '{}',
  creative_title text not null check (char_length(creative_title) <= 80),
  creative_body text not null check (char_length(creative_body) <= 220),
  creative_image_url text,
  target_url text not null,
  utm_campaign text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  cpc_paise int not null check (cpc_paise > 0),
  budget_cap_paise int not null check (budget_cap_paise > 0),
  spent_paise int not null default 0 check (spent_paise >= 0),
  priority int not null default 0,
  map_lat double precision,
  map_lng double precision,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);
create index if not exists sponsor_campaign_window_idx on public.sponsor_campaign (status, start_at, end_at);

create table if not exists public.sponsor_impression (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaign(id) on delete cascade,
  placement text not null,
  context_key text not null,
  session_hash text not null,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  unique (campaign_id, placement, context_key, session_hash, day)
);

create table if not exists public.sponsor_click (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaign(id) on delete cascade,
  placement text not null,
  context_key text not null,
  session_hash text not null,
  billable boolean not null,
  invalid_reason text,
  cost_paise int not null default 0,
  disputed boolean not null default false,
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists sponsor_click_campaign_idx on public.sponsor_click (campaign_id, created_at);
create index if not exists sponsor_click_dedupe_idx on public.sponsor_click (campaign_id, session_hash, created_at);

-- ───────────────────────── Operations ─────────────────────────
create table if not exists public.app_setting (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_bucket (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
