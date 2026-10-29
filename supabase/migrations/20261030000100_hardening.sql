-- Advisor fixes: trigger function is not an RPC; cover foreign keys with indexes.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log(actor_id);
create index if not exists destination_match_destination_idx on public.destination_match(destination_id);
create index if not exists payment_event_order_idx on public.payment_event(order_id);
create index if not exists payment_order_draft_idx on public.payment_order(draft_id);
create index if not exists payment_order_trip_idx on public.payment_order(trip_id);
create index if not exists place_external_reference_place_idx on public.place_external_reference(place_id);
create index if not exists place_review_user_idx on public.place_review(user_id);
create index if not exists private_saved_place_place_idx on public.private_saved_place(place_id);
create index if not exists review_report_place_idx on public.review_report(place_id);
create index if not exists review_report_review_idx on public.review_report(review_id);
create index if not exists sponsor_campaign_business_idx on public.sponsor_campaign(business_id);
create index if not exists trip_draft_destination_idx on public.trip_draft(selected_destination_id);
create index if not exists trip_edit_history_destination_idx on public.trip_edit_history(destination_id);
create index if not exists trip_entitlement_user_idx on public.trip_entitlement(user_id);
create index if not exists trip_plan_destination_idx on public.trip_plan(destination_id);
create index if not exists outbound_click_user_idx on public.outbound_click(user_id);
