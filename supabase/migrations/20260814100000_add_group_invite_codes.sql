-- Group invite codes: a second discovery path alongside "Découvrir" for
-- private groups (which are deliberately excluded from that public
-- listing) — the owner shares the code out of band, and find_group_by_code
-- below is the one place that's allowed to look a group up by code
-- regardless of privacy, since that is the whole point of the code.

alter table public.groups add column if not exists invite_code text unique;

-- Unambiguous alphabet (no 0/O, 1/I/L) so a code stays easy to read and
-- retype when shared verbally or in a screenshot.
create or replace function public.generate_unique_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  attempt integer := 0;
begin
  loop
    candidate := '';
    for i in 1..7 loop
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;

    exit when not exists (select 1 from public.groups where invite_code = candidate);

    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  return candidate;
end;
$$;

-- Backfill any groups created before this migration (none expected
-- pre-launch, but keeps the column safely NOT NULL either way).
update public.groups
  set invite_code = public.generate_unique_invite_code()
  where invite_code is null;

alter table public.groups alter column invite_code set not null;

-- Redefine create_group to also generate and store the new group's code.
-- Same signature as the original (20260814090000) — this replaces it in
-- place rather than duplicating the function under a new name.
create or replace function public.create_group(
  group_name text,
  group_description text,
  group_is_private boolean
)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  caller_display_name text;
  new_group public.groups;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.has_community_access(caller) then
    raise exception 'community_access_required';
  end if;
  if trim(group_name) = '' then
    raise exception 'invalid_name';
  end if;

  select coalesce(split_part(email, '@', 1), 'Membre') into caller_display_name
  from auth.users where id = caller;

  insert into public.groups (name, description, owner_id, is_private, invite_code)
  values (
    trim(group_name),
    coalesce(trim(group_description), ''),
    caller,
    group_is_private,
    public.generate_unique_invite_code()
  )
  returning * into new_group;

  insert into public.group_members (group_id, user_id, display_name, status, role)
  values (new_group.id, caller, coalesce(caller_display_name, 'Membre'), 'approved', 'owner');

  return new_group;
end;
$$;

-- Code-based lookup: bypasses the groups SELECT policy on purpose (a
-- private group must be findable by whoever has its code, even though it's
-- invisible in "Découvrir") and reports the caller's own membership status
-- so the frontend can show "Déjà membre" / "Demande en attente" instead of
-- a join button, without a second round trip.
create or replace function public.find_group_by_code(search_code text)
returns table (
  id uuid,
  name text,
  description text,
  owner_id uuid,
  is_private boolean,
  member_count bigint,
  created_at timestamptz,
  membership_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;

  return query
    select
      g.id,
      g.name,
      g.description,
      g.owner_id,
      g.is_private,
      (
        select count(*) from public.group_members gm
        where gm.group_id = g.id and gm.status = 'approved'
      ) as member_count,
      g.created_at,
      (
        select gm2.status from public.group_members gm2
        where gm2.group_id = g.id and gm2.user_id = caller
      ) as membership_status
    from public.groups g
    where upper(g.invite_code) = upper(trim(search_code));
end;
$$;

grant execute on function public.find_group_by_code(text) to authenticated;
