-- STAMPD v1 schema. Designed so the immutable core of a stamped take cannot be updated.
create extension if not exists pgcrypto;

create type take_status as enum ('LIVE','HIT','MISS','VOID');
create type reaction_type as enum ('BACK','FADE');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  invite_code text unique not null default encode(gen_random_bytes(6),'hex'),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(group_id,user_id)
);

create table public.takes (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null default upper(substr(encode(gen_random_bytes(8),'hex'),1,6)),
  user_id uuid not null references public.profiles(id),
  group_id uuid references public.groups(id),
  original_text text not null check (char_length(original_text) between 1 and 280),
  canonical_text text not null,
  category text not null,
  league text,
  subject text,
  subject_type text,
  prediction_type text not null,
  metric text,
  operator text,
  target_value jsonb,
  season int,
  confidence smallint not null check (confidence between 50 and 100),
  resolution_criteria text not null,
  resolution_source text,
  resolve_at timestamptz,
  visibility text not null default 'public' check (visibility in ('public','group','private')),
  status take_status not null default 'LIVE',
  outcome jsonb,
  content_hash text not null,
  stamped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.take_reactions (
  take_id uuid references public.takes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  reaction reaction_type not null,
  created_at timestamptz not null default now(),
  primary key(take_id,user_id)
);

create table public.take_challenges (
  id uuid primary key default gen_random_uuid(),
  original_take_id uuid not null references public.takes(id),
  challenger_take_id uuid not null references public.takes(id),
  challenger_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(original_take_id,challenger_id)
);

create table public.resolutions (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes(id),
  proposed_status take_status not null,
  source_url text,
  source_label text,
  evidence jsonb,
  resolver_type text not null check (resolver_type in ('automatic','admin','group_vote')),
  created_at timestamptz not null default now()
);

-- Immutable receipt protection: only resolution-related fields may change after insert.
create or replace function public.protect_stamped_take()
returns trigger language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id
    or new.id is distinct from old.id
    or new.short_id is distinct from old.short_id
    or new.group_id is distinct from old.group_id
    or new.original_text is distinct from old.original_text
    or new.canonical_text is distinct from old.canonical_text
    or new.category is distinct from old.category
    or new.league is distinct from old.league
    or new.subject is distinct from old.subject
    or new.subject_type is distinct from old.subject_type
    or new.prediction_type is distinct from old.prediction_type
    or new.metric is distinct from old.metric
    or new.operator is distinct from old.operator
    or new.target_value is distinct from old.target_value
    or new.season is distinct from old.season
    or new.confidence is distinct from old.confidence
    or new.resolution_criteria is distinct from old.resolution_criteria
    or new.resolution_source is distinct from old.resolution_source
    or new.resolve_at is distinct from old.resolve_at
    or new.content_hash is distinct from old.content_hash
    or new.visibility is distinct from old.visibility
    or new.stamped_at is distinct from old.stamped_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Stamped take core is immutable';
  end if;
  return new;
end $$;
create trigger takes_immutable before update on public.takes for each row execute function public.protect_stamped_take();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.takes enable row level security;
alter table public.take_reactions enable row level security;
alter table public.take_challenges enable row level security;
alter table public.resolutions enable row level security;

create policy "public profiles readable" on public.profiles for select using (true);
create policy "create own profile" on public.profiles for insert with check (auth.uid()=id);
create policy "update own profile" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);

create policy "create owned group" on public.groups for insert with check (auth.uid()=owner_id);
create policy "view owned or joined groups" on public.groups for select using (
  auth.uid()=owner_id or exists (
    select 1 from public.group_members m where m.group_id=id and m.user_id=auth.uid()
  )
);
create policy "view own membership" on public.group_members for select using (auth.uid()=user_id);
create policy "group owner adds members" on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id=group_id and g.owner_id=auth.uid())
);

create policy "view authorized takes" on public.takes for select using (
  visibility='public' or auth.uid()=user_id or (
    visibility='group' and exists (
      select 1 from public.group_members m where m.group_id=takes.group_id and m.user_id=auth.uid()
    )
  )
);
create policy "create own authorized takes" on public.takes for insert with check (
  auth.uid()=user_id and (
    group_id is null or exists (
      select 1 from public.group_members m where m.group_id=takes.group_id and m.user_id=auth.uid()
    )
  ) and (visibility <> 'group' or group_id is not null)
);
create policy "react to visible takes" on public.take_reactions for insert with check (
  auth.uid()=user_id and exists (select 1 from public.takes t where t.id=take_id)
);
create policy "view reactions to visible takes" on public.take_reactions for select using (
  exists (select 1 from public.takes t where t.id=take_id)
);
