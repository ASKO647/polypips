-- Communauté v2 — full rebuild on fresh tables (community_groups/
-- community_members/community_messages/community_reports), deliberately
-- NOT reusing the old groups/group_members/group_messages/
-- group_message_reports tables left behind after the feature's removal —
-- starting clean rules out inheriting any policy state from the old
-- system, which suffered a hard-to-pin-down "404 for an approved member"
-- bug across two prior fix attempts.
--
-- RLS design principle, followed strictly everywhere below: a policy on
-- table A NEVER embeds a raw subquery against table B (or against A
-- itself for a different row) — every cross-row/cross-table check goes
-- through a SECURITY DEFINER function (community_is_member/
-- community_is_owner/community_is_group_public), which reads with RLS
-- bypassed (SECURITY DEFINER runs as the function's owner, which is also
-- these tables' owner, and table owners are exempt from their own RLS
-- unless FORCE ROW LEVEL SECURITY is set, which it isn't here) — so
-- calling one from another table's policy can never re-trigger a policy
-- evaluation loop. The old system already used this pattern for its own
-- policies, so the actual prior bug most likely lived in how the
-- frontend composed its reads (e.g. a PostgREST embedded/joined select
-- across two RLS-protected tables) rather than in the policies
-- themselves — as a second, independent safeguard against that entire
-- class of bug, every "composite" read this system needs (a group's full
-- detail view, a user's list of groups) is served by its own SECURITY
-- DEFINER function returning exactly the shape the page needs in one
-- call, computed via plain SQL joins that run with RLS bypassed — the
-- Supabase client's raw `.from(table).select()` is used only for
-- genuinely single-table reads (the public groups list, a group's
-- messages) whose RLS policy is a single function call.
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_private boolean not null default false,
  -- 8-char uppercase code, collision-checked by the unique constraint —
  -- the ~2.8e12-value space makes a retry-worthy collision astronomically
  -- unlikely at this feature's realistic scale.
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists community_groups_is_private_created_at_idx
  on public.community_groups (is_private, created_at desc);
create index if not exists community_groups_owner_id_idx
  on public.community_groups (owner_id);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists community_members_group_id_status_idx
  on public.community_members (group_id, status);
create index if not exists community_members_user_id_idx
  on public.community_members (user_id);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  check (content <> '' or image_url is not null)
);

create index if not exists community_messages_group_id_created_at_idx
  on public.community_messages (group_id, created_at);

-- Minimal moderation, same as before: a flat report table, reviewed
-- manually (via Supabase) — no in-app review UI in this pass.
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create index if not exists community_reports_message_id_idx
  on public.community_reports (message_id);

-- --------------------------------------------------------------------------
-- Visibility helpers — see the file header for why every cross-table/
-- cross-row check in this file goes through one of these instead of an
-- inline subquery in a policy.
-- --------------------------------------------------------------------------

create or replace function public.community_is_owner(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_groups
    where id = p_group_id and owner_id = p_user_id
  );
$$;

create or replace function public.community_is_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members
    where group_id = p_group_id and user_id = p_user_id and status = 'approved'
  );
$$;

create or replace function public.community_is_group_public(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select not is_private from public.community_groups where id = p_group_id), false);
$$;

-- --------------------------------------------------------------------------
-- Row level security
-- --------------------------------------------------------------------------

alter table public.community_groups enable row level security;

create policy "Groups visible when public, owned, or approved member"
  on public.community_groups for select
  to authenticated
  using (
    is_private = false
    or owner_id = auth.uid()
    or public.community_is_member(id, auth.uid())
  );

-- No insert policy: community_create_group() below is the only way to
-- create a group. It creates the group row AND the owner's approved
-- membership row in one atomic SECURITY DEFINER call — a direct client
-- insert could create a group with no owner membership row at all,
-- breaking "Mes groupes" and the manage-group panel for its own creator.

create policy "Owners can update their own group"
  on public.community_groups for update
  to authenticated
  using (public.community_is_owner(id, auth.uid()))
  with check (public.community_is_owner(id, auth.uid()));

create policy "Owners can delete their own group"
  on public.community_groups for delete
  to authenticated
  using (public.community_is_owner(id, auth.uid()));

alter table public.community_members enable row level security;

create policy "Members visible to self, group owner, or fellow approved members"
  on public.community_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.community_is_owner(group_id, auth.uid())
    or public.community_is_member(group_id, auth.uid())
  );

-- No insert/update/delete policy at all for authenticated: every
-- membership mutation (owner bootstrap, join, approve, reject, remove)
-- goes through the SECURITY DEFINER functions below — a pending request
-- can never write its own approval, and a client can never fabricate an
-- "approved" row directly by inserting one itself.

alter table public.community_messages enable row level security;

create policy "Approved members can read group messages"
  on public.community_messages for select
  to authenticated
  using (public.community_is_member(group_id, auth.uid()));

create policy "Approved members can post group messages"
  on public.community_messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.community_is_member(group_id, auth.uid())
  );

alter table public.community_reports enable row level security;

create policy "Users can report a message"
  on public.community_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- No select policy: reports are reviewed manually via the service role
-- only, matching this project's existing "modération minimale" convention
-- — there is no in-app report-review UI in this pass.

-- Real-time chat: broadcast new messages to subscribed clients.
alter publication supabase_realtime add table public.community_messages;

-- --------------------------------------------------------------------------
-- Access gate — mirrors hasActiveAccess() in src/lib/supabase/
-- subscriptions.ts (active/trialing, not cancelled — every plan, since
-- this project has a single "decouverte"/"pro" pair and both currently
-- grant full dashboard access). Duplicated here since SQL can't import a
-- TS module; defense in depth behind the client-side blur gate, not a
-- replacement for it — it only guards the two ways a user gains group
-- access (creating one, joining one).
-- --------------------------------------------------------------------------

create or replace function public.community_has_active_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = target_user_id
      and status in ('active', 'trialing')
      and cancel_at_period_end = false
  );
$$;

-- --------------------------------------------------------------------------
-- Membership mutation functions — the only writers of community_members.
-- --------------------------------------------------------------------------

create or replace function public.community_create_group(
  p_name text,
  p_description text,
  p_is_private boolean default false
)
returns public.community_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  new_group public.community_groups;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.community_has_active_access(caller) then
    raise exception 'community_access_required';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'invalid_name';
  end if;

  insert into public.community_groups (name, description, owner_id, is_private)
  values (trim(p_name), coalesce(trim(p_description), ''), caller, coalesce(p_is_private, false))
  returning * into new_group;

  insert into public.community_members (group_id, user_id, status, role)
  values (new_group.id, caller, 'approved', 'owner');

  return new_group;
end;
$$;

grant execute on function public.community_create_group(text, text, boolean) to authenticated;

create or replace function public.community_join_group(p_group_id uuid)
returns public.community_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target public.community_groups;
  existing public.community_members;
  desired_status text;
  result_row public.community_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.community_has_active_access(caller) then
    raise exception 'community_access_required';
  end if;

  select * into target from public.community_groups where id = p_group_id;
  if target is null then
    raise exception 'group_not_found';
  end if;

  select * into existing from public.community_members
    where group_id = p_group_id and user_id = caller;

  if existing.id is not null and existing.status = 'approved' then
    return existing;
  end if;

  desired_status := case when target.is_private then 'pending' else 'approved' end;

  insert into public.community_members (group_id, user_id, status, role)
  values (p_group_id, caller, desired_status, 'member')
  on conflict (group_id, user_id) do update
    set status = excluded.status
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.community_join_group(uuid) to authenticated;

create or replace function public.community_approve_member(p_group_id uuid, p_user_id uuid)
returns public.community_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result_row public.community_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.community_groups where id = p_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;

  update public.community_members
    set status = 'approved'
    where group_id = p_group_id and user_id = p_user_id and status = 'pending'
    returning * into result_row;

  if result_row.id is null then
    raise exception 'request_not_found';
  end if;

  return result_row;
end;
$$;

grant execute on function public.community_approve_member(uuid, uuid) to authenticated;

create or replace function public.community_reject_member(p_group_id uuid, p_user_id uuid)
returns public.community_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result_row public.community_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.community_groups where id = p_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;

  update public.community_members
    set status = 'rejected'
    where group_id = p_group_id and user_id = p_user_id and status = 'pending'
    returning * into result_row;

  if result_row.id is null then
    raise exception 'request_not_found';
  end if;

  return result_row;
end;
$$;

grant execute on function public.community_reject_member(uuid, uuid) to authenticated;

create or replace function public.community_remove_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.community_groups where id = p_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;
  if exists (select 1 from public.community_groups where id = p_group_id and owner_id = p_user_id) then
    raise exception 'cannot_remove_owner';
  end if;

  delete from public.community_members
    where group_id = p_group_id and user_id = p_user_id;
end;
$$;

grant execute on function public.community_remove_member(uuid, uuid) to authenticated;

create or replace function public.community_send_message(
  p_group_id uuid,
  p_content text,
  p_image_url text default null
)
returns public.community_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result_row public.community_messages;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.community_is_member(p_group_id, caller) then
    raise exception 'not_a_member';
  end if;
  if trim(coalesce(p_content, '')) = '' and p_image_url is null then
    raise exception 'empty_message';
  end if;

  insert into public.community_messages (group_id, user_id, content, image_url)
  values (p_group_id, caller, coalesce(trim(p_content), ''), p_image_url)
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.community_send_message(uuid, text, text) to authenticated;

-- --------------------------------------------------------------------------
-- Composite read functions — see the file header: these serve every
-- "more than one table" read this feature needs, computed via plain SQL
-- (RLS-bypassed inside the SECURITY DEFINER function body) instead of a
-- PostgREST embedded/joined select across two RLS-protected tables.
-- --------------------------------------------------------------------------

-- "Trouver un groupe" by invite code — deliberately bypasses the normal
-- groups SELECT policy (which hides private groups from non-members):
-- finding a private group via its own invite code is the whole point of
-- having one, but it must never make that group appear in "Découvrir" or
-- any other general listing — only this single, code-keyed lookup.
create or replace function public.community_find_group_by_code(p_invite_code text)
returns table (
  id uuid,
  name text,
  description text,
  avatar_url text,
  is_private boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, g.description, g.avatar_url, g.is_private
  from public.community_groups g
  where g.invite_code = upper(trim(p_invite_code));
$$;

grant execute on function public.community_find_group_by_code(text) to authenticated;

-- "Mes groupes" — every group the caller owns or is an approved member
-- of, with their own role/status on that group.
create or replace function public.community_list_my_groups()
returns table (
  id uuid,
  name text,
  description text,
  avatar_url text,
  is_private boolean,
  invite_code text,
  member_role text,
  member_status text,
  member_count bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id, g.name, g.description, g.avatar_url, g.is_private,
    case when g.owner_id = auth.uid() then g.invite_code else null end,
    m.role,
    m.status,
    (select count(*) from public.community_members cm where cm.group_id = g.id and cm.status = 'approved'),
    g.created_at
  from public.community_groups g
  join public.community_members m on m.group_id = g.id and m.user_id = auth.uid()
  where m.status = 'approved'
  order by g.created_at desc;
$$;

grant execute on function public.community_list_my_groups() to authenticated;

-- A group's full detail view in one call: the group itself, the caller's
-- own membership (or null), whether the caller is the owner, and — only
-- when authorized (owner, or approved member) — the full member roster
-- with display names/avatars resolved from auth.users (invisible to
-- normal RLS, but readable here since this function runs with RLS
-- bypassed). Returns null only when the group itself doesn't exist —
-- an authenticated-but-not-yet-approved caller on a private group still
-- gets a real (mostly empty) payload so the page can render "Demande
-- envoyée" instead of a 404, which is exactly the failure mode this
-- rebuild exists to eliminate.
create or replace function public.community_get_group_view(p_group_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  v_group public.community_groups;
  v_my public.community_members;
  v_is_owner boolean;
  v_is_member boolean;
  v_members jsonb;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;

  select * into v_group from public.community_groups where id = p_group_id;
  if v_group is null then
    return null;
  end if;

  select * into v_my from public.community_members
    where group_id = p_group_id and user_id = caller;

  v_is_owner := v_group.owner_id = caller;
  v_is_member := coalesce(v_my.status, '') = 'approved';

  if v_is_owner or v_is_member then
    select coalesce(jsonb_agg(jsonb_build_object(
      'userId', m.user_id,
      'displayName', coalesce(
        nullif(u.raw_user_meta_data ->> 'username', ''),
        nullif(u.raw_user_meta_data ->> 'full_name', ''),
        split_part(u.email, '@', 1),
        'Membre'
      ),
      'avatarUrl', u.raw_user_meta_data ->> 'avatar_url',
      'status', m.status,
      'role', m.role,
      'joinedAt', m.joined_at
    ) order by m.joined_at asc), '[]'::jsonb)
    into v_members
    from public.community_members m
    join auth.users u on u.id = m.user_id
    where m.group_id = p_group_id
      and (v_is_owner or m.status = 'approved');
  else
    v_members := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'group', jsonb_build_object(
      'id', v_group.id,
      'name', v_group.name,
      'description', v_group.description,
      'avatarUrl', v_group.avatar_url,
      'isPrivate', v_group.is_private,
      'inviteCode', case when v_is_owner then v_group.invite_code else null end
    ),
    'myMembership', case when v_my.id is null then null else jsonb_build_object(
      'status', v_my.status, 'role', v_my.role
    ) end,
    'isOwner', v_is_owner,
    'members', v_members
  );
end;
$$;

grant execute on function public.community_get_group_view(uuid) to authenticated;

-- --------------------------------------------------------------------------
-- Storage: group avatars + chat image attachments, in a fresh bucket
-- (not the old community-images one). Path convention:
--   avatars/{group_id}/{filename}          — group avatar, owner-only write
--   messages/{group_id}/{user_id}/{file}   — chat image, approved-member write
-- RLS policies parse the segments via storage.foldername() and defer to
-- the same SECURITY DEFINER helpers used everywhere else in this file.
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', false)
on conflict (id) do nothing;

create policy "Community avatars readable per group visibility"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'avatars'
    and (
      public.community_is_group_public(((storage.foldername(name))[2])::uuid)
      or public.community_is_owner(((storage.foldername(name))[2])::uuid, auth.uid())
      or public.community_is_member(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

create policy "Group owners can upload their group avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'avatars'
    and public.community_is_owner(((storage.foldername(name))[2])::uuid, auth.uid())
  );

create policy "Group owners can replace their group avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'avatars'
    and public.community_is_owner(((storage.foldername(name))[2])::uuid, auth.uid())
  );

create policy "Community message images readable by owner or approved members"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and (
      public.community_is_owner(((storage.foldername(name))[2])::uuid, auth.uid())
      or public.community_is_member(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

create policy "Approved members can upload their own message images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and (storage.foldername(name))[3] = auth.uid()::text
    and public.community_is_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );
