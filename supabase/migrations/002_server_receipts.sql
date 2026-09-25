-- Run after 001_init.sql. Server timestamps, IDs, status, and SHA-256 digest
-- replace any values supplied by an untrusted browser at insert time.
create or replace function public.stamp_take_on_insert()
returns trigger language plpgsql set search_path = pg_catalog, extensions, public, pg_temp as $$
begin
  new.id := gen_random_uuid();
  new.short_id := upper(encode(gen_random_bytes(6), 'hex'));
  new.created_at := clock_timestamp();
  new.stamped_at := new.created_at;
  new.status := 'LIVE';
  new.outcome := null;
  new.resolved_at := null;
  new.content_hash := encode(digest(jsonb_build_object(
    'id', new.id,
    'user_id', new.user_id,
    'original_text', new.original_text,
    'canonical_text', new.canonical_text,
    'category', new.category,
    'league', new.league,
    'subject', new.subject,
    'subject_type', new.subject_type,
    'prediction_type', new.prediction_type,
    'metric', new.metric,
    'operator', new.operator,
    'target_value', new.target_value,
    'confidence', new.confidence,
    'criteria', new.resolution_criteria,
    'source', new.resolution_source,
    'season', new.season,
    'resolve_at', new.resolve_at,
    'visibility', new.visibility,
    'group_id', new.group_id,
    'stamped_at', new.stamped_at
  )::text, 'sha256'), 'hex');
  return new;
end $$;

create trigger takes_stamp_on_insert before insert on public.takes
for each row execute function public.stamp_take_on_insert();

create policy "change own reaction on visible live take"
on public.take_reactions for update
using (auth.uid() = user_id and exists (
  select 1 from public.takes t where t.id = take_id and t.status = 'LIVE'
))
with check (auth.uid() = user_id and exists (
  select 1 from public.takes t where t.id = take_id and t.status = 'LIVE'
));

drop policy "react to visible takes" on public.take_reactions;
create policy "react to visible live takes" on public.take_reactions for insert
with check (auth.uid() = user_id and exists (
  select 1 from public.takes t where t.id = take_id and t.status = 'LIVE'
));
