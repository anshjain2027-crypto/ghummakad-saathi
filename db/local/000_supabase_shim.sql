-- LOCAL / TEST ONLY. Never run this against Supabase.
-- Recreates the small slice of Supabase that our migrations depend on
-- (roles, auth schema, auth.uid(), auth.users) so the same migrations and
-- row-level-security policies run unchanged inside PGlite.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ), ''
  )::uuid
$$;

-- Demo-mode one-time sign-in codes (Supabase Auth replaces this in production).
create table if not exists auth.demo_otp (
  email text primary key,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null
);

-- Demo-mode passwords (scrypt hashes). Production uses Supabase Auth.
create table if not exists auth.demo_password (
  email text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);
