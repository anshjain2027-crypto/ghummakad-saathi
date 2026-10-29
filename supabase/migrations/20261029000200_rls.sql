-- Row-level security. Every public table has RLS on.
-- Pattern:
--   • Reads/writes on behalf of a signed-in user run as role `authenticated`
--     with request.jwt.claims.sub = user id (Supabase sets this; our server
--     sets it explicitly for direct Postgres connections — src/lib/db).
--   • Payments, entitlements, sponsor billing, moderation and audit writes run
--     only through server code using the privileged connection, after explicit
--     checks. No policy grants `authenticated` write access to those tables.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.destination enable row level security;
alter table public.place enable row level security;
alter table public.place_external_reference enable row level security;
alter table public.private_saved_place enable row level security;
alter table public.place_review enable row level security;
alter table public.review_report enable row level security;
alter table public.moderation_action enable row level security;
alter table public.trip_draft enable row level security;
alter table public.destination_match enable row level security;
alter table public.trip_plan enable row level security;
alter table public.trip_edit_history enable row level security;
alter table public.trip_self_booking enable row level security;
alter table public.payment_order enable row level security;
alter table public.payment_event enable row level security;
alter table public.trip_entitlement enable row level security;
alter table public.provider_adapter_status enable row level security;
alter table public.affiliate_link enable row level security;
alter table public.outbound_click enable row level security;
alter table public.sponsor_business enable row level security;
alter table public.sponsor_placement enable row level security;
alter table public.sponsor_campaign enable row level security;
alter table public.sponsor_impression enable row level security;
alter table public.sponsor_click enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.rate_limit_bucket enable row level security;
alter table public.app_setting enable row level security;

-- Start from zero for the API roles, then grant precisely.
revoke all on all tables in schema public from anon, authenticated;

-- profiles: display names are public to signed-in users (shown on reviews);
-- other profile columns are read/written by the server for the owner only.
grant select (id, display_name) on public.profiles to authenticated;
grant update (display_name, home_country, display_currency, timezone, marketing_consent, updated_at) on public.profiles to authenticated;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant select on public.user_roles to authenticated;
drop policy if exists user_roles_own on public.user_roles;
create policy user_roles_own on public.user_roles for select to authenticated using (user_id = auth.uid());

-- destinations: public editorial catalogue (anonymous wizard needs it).
grant select on public.destination to anon, authenticated;
drop policy if exists destination_public on public.destination;
create policy destination_public on public.destination for select to anon, authenticated using (status = 'published');

-- places: sign-in required for ALL map access (locked product decision).
grant select, insert, delete on public.place to authenticated;
grant update (name, category, description, lat, lng, updated_at) on public.place to authenticated;
drop policy if exists place_read on public.place;
create policy place_read on public.place for select to authenticated
  using (status = 'approved' or created_by = auth.uid() or public.has_role('moderator'));
drop policy if exists place_insert_own on public.place;
create policy place_insert_own on public.place for insert to authenticated
  with check (created_by = auth.uid() and source = 'community' and status = 'pending');
drop policy if exists place_update_own_pending on public.place;
create policy place_update_own_pending on public.place for update to authenticated
  using (created_by = auth.uid() and source = 'community' and status in ('pending', 'rejected'))
  with check (created_by = auth.uid());
drop policy if exists place_delete_own on public.place;
create policy place_delete_own on public.place for delete to authenticated
  using (created_by = auth.uid() and source = 'community');

grant select, insert on public.place_external_reference to authenticated;
drop policy if exists place_ref_read on public.place_external_reference;
create policy place_ref_read on public.place_external_reference for select to authenticated
  using (exists (select 1 from public.place p where p.id = place_id));
drop policy if exists place_ref_insert on public.place_external_reference;
create policy place_ref_insert on public.place_external_reference for insert to authenticated
  with check (exists (select 1 from public.place p where p.id = place_id and p.created_by = auth.uid()));

-- private pins: owner only, enforced here — not in the UI.
grant select, insert, update, delete on public.private_saved_place to authenticated;
drop policy if exists private_pin_owner on public.private_saved_place;
create policy private_pin_owner on public.private_saved_place for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reviews: published ones are visible to signed-in users; authors manage their own.
grant select, insert, delete on public.place_review to authenticated;
grant update (rating, comment, worth_going, updated_at) on public.place_review to authenticated;
drop policy if exists review_read on public.place_review;
create policy review_read on public.place_review for select to authenticated
  using (status = 'published' or user_id = auth.uid() or public.has_role('moderator'));
drop policy if exists review_insert_own on public.place_review;
create policy review_insert_own on public.place_review for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'published' and is_demo = false
    and exists (select 1 from public.place p where p.id = place_id and p.status = 'approved')
  );
drop policy if exists review_update_own on public.place_review;
create policy review_update_own on public.place_review for update to authenticated
  using (user_id = auth.uid() and status = 'published') with check (user_id = auth.uid());
drop policy if exists review_delete_own on public.place_review;
create policy review_delete_own on public.place_review for delete to authenticated using (user_id = auth.uid());

grant select, insert on public.review_report to authenticated;
drop policy if exists report_insert_own on public.review_report;
create policy report_insert_own on public.review_report for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
drop policy if exists report_read on public.review_report;
create policy report_read on public.review_report for select to authenticated
  using (reporter_id = auth.uid() or public.has_role('moderator'));

grant select on public.moderation_action to authenticated;
drop policy if exists moderation_read on public.moderation_action;
create policy moderation_read on public.moderation_action for select to authenticated using (public.has_role('moderator'));

-- planner: owners can read their own; all writes go through checked server code.
grant select on public.trip_draft, public.destination_match, public.trip_plan, public.trip_edit_history,
  public.trip_self_booking, public.payment_order, public.trip_entitlement to authenticated;

drop policy if exists draft_owner on public.trip_draft;
create policy draft_owner on public.trip_draft for select to authenticated using (owner_id = auth.uid());
drop policy if exists match_owner on public.destination_match;
create policy match_owner on public.destination_match for select to authenticated
  using (exists (select 1 from public.trip_draft d where d.id = draft_id and d.owner_id = auth.uid()));
drop policy if exists trip_owner on public.trip_plan;
create policy trip_owner on public.trip_plan for select to authenticated using (owner_id = auth.uid());
drop policy if exists trip_history_owner on public.trip_edit_history;
create policy trip_history_owner on public.trip_edit_history for select to authenticated
  using (exists (select 1 from public.trip_plan t where t.id = trip_id and t.owner_id = auth.uid()));
drop policy if exists trip_booking_owner on public.trip_self_booking;
create policy trip_booking_owner on public.trip_self_booking for select to authenticated
  using (exists (select 1 from public.trip_plan t where t.id = trip_id and t.owner_id = auth.uid()));
drop policy if exists order_owner on public.payment_order;
create policy order_owner on public.payment_order for select to authenticated using (user_id = auth.uid());
drop policy if exists entitlement_owner on public.trip_entitlement;
create policy entitlement_owner on public.trip_entitlement for select to authenticated using (user_id = auth.uid());

-- transparency tables readable by anyone signed in.
grant select on public.provider_adapter_status, public.sponsor_placement to anon, authenticated;
drop policy if exists provider_status_read on public.provider_adapter_status;
create policy provider_status_read on public.provider_adapter_status for select to anon, authenticated using (true);
drop policy if exists placement_read on public.sponsor_placement;
create policy placement_read on public.sponsor_placement for select to anon, authenticated using (true);

-- payment_event, affiliate_link, outbound_click, sponsor_*, admin_audit_log,
-- rate_limit_bucket: no grants to anon/authenticated at all (server only).
