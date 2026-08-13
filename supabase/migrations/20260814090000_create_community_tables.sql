-- Communauté: groups with text/photo chat. Membership state transitions
-- (create/join/approve/reject/remove) all go through SECURITY DEFINER
-- functions below rather than direct table policies — that keeps a
-- pending request from ever being able to self-approve, and lets each
-- function look up auth.users (inaccessible to normal RLS policies) to
-- derive a display name without a separate profiles table.
--
-- All four tables are created first, before any RLS policy, because
-- groups' own SELECT policy needs to reference group_members (and vice
-- versa) — policy bodies are validated against real tables at creation
-- time, so the cross-referenced table must already exist.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_private boolean not null default false,
  avatar_url text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_is_private_created_at_idx
  on public.groups (is_private, created_at desc);

create index if not exists groups_owner_id_idx
  on public.groups (owner_id);

-- Membership state per user per group. display_name is captured once at
-- join time from auth.users (via the SECURITY DEFINER functions below,
-- the only writers of this table) since normal RLS can never read another
-- user's row in auth.users to resolve it later for chat/member-list UI.
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_group_id_status_idx
  on public.group_members (group_id, status);

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  check (content <> '' or image_url is not null)
);

create index if not exists group_messages_group_id_created_at_idx
  on public.group_messages (group_id, created_at);

-- Minimal moderation: a flat report table, no automated action on it yet —
-- reports are reviewed manually (via Supabase) for now.
create table if not exists public.group_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create index if not exists group_message_reports_message_id_idx
  on public.group_message_reports (message_id);

-- --------------------------------------------------------------------------
-- Cross-table visibility helpers, used by the RLS policies below instead
-- of inline subqueries. groups' policies need to check group_members and
-- group_members' policies need to check groups — plain inline subqueries
-- on both sides create a mutual dependency that Postgres detects as
-- infinite recursion ("infinite recursion detected in policy for relation
-- groups"). Routing the cross-table lookup through a SECURITY DEFINER
-- function breaks the cycle: the function's internal query runs with RLS
-- bypassed, so it never re-triggers the other table's policy.
create or replace function public.is_group_owner(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = target_group_id and owner_id = target_user_id
  );
$$;

create or replace function public.is_group_public(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = target_group_id and is_private = false
  );
$$;

create or replace function public.is_approved_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = target_user_id and status = 'approved'
  );
$$;

-- --------------------------------------------------------------------------
-- Row level security
-- --------------------------------------------------------------------------

alter table public.groups enable row level security;

-- Public groups are visible to every authenticated user (for "Découvrir");
-- a private group is only visible to its owner and its approved members —
-- it must not appear in listings or search for anyone else.
create policy "Groups visible when public, owned, or approved-member"
  on public.groups for select
  to authenticated
  using (
    is_private = false
    or owner_id = auth.uid()
    or public.is_approved_group_member(groups.id, auth.uid())
  );

create policy "Authenticated users can create a group"
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update their own group"
  on public.groups for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete their own group"
  on public.groups for delete
  to authenticated
  using (owner_id = auth.uid());

alter table public.group_members enable row level security;

-- A member can see their own row; the group owner can see everyone (to
-- manage the group); an approved member can see the rest of the roster
-- (needed to resolve pseudos in chat and show a member list). A public
-- group's roster is also visible to non-members so a message preview can
-- still show real pseudos rather than falling back to "Membre" for
-- everyone — public groups never have pending members anyway (join_group
-- auto-approves), so this only ever exposes approved display names.
create policy "Members visible to self, group owner, fellow approved members, or public-group visitors"
  on public.group_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_owner(group_members.group_id, auth.uid())
    or public.is_approved_group_member(group_members.group_id, auth.uid())
    or public.is_group_public(group_members.group_id)
  );

-- No insert/update/delete policy for authenticated: every membership
-- mutation (create's owner bootstrap, join, approve, reject, remove) goes
-- through the SECURITY DEFINER functions below so a pending request can
-- never write its own approval.

alter table public.group_messages enable row level security;

-- A public group's messages are readable in preview by anyone, even
-- non-members; a private group's messages are only readable by its owner
-- or its approved members.
create policy "Messages readable per group visibility rules"
  on public.group_messages for select
  to authenticated
  using (
    public.is_group_public(group_messages.group_id)
    or public.is_group_owner(group_messages.group_id, auth.uid())
    or public.is_approved_group_member(group_messages.group_id, auth.uid())
  );

-- Writing requires actually having joined (public groups auto-approve on
-- join, private groups require owner approval first) — preview access to
-- a public group's messages does not imply write access.
create policy "Approved members can post messages"
  on public.group_messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_approved_group_member(group_messages.group_id, auth.uid())
  );

alter table public.group_message_reports enable row level security;

create policy "Users can view their own reports"
  on public.group_message_reports for select
  to authenticated
  using (reporter_id = auth.uid());

create policy "Users can report a message"
  on public.group_message_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Real-time chat: broadcast new messages to subscribed clients.
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.group_members;

-- --------------------------------------------------------------------------
-- Membership mutation functions (SECURITY DEFINER: the only writers of
-- group_members, and the only place display_name is resolved from
-- auth.users since normal RLS can't read another user's auth row).
-- --------------------------------------------------------------------------

-- Shared by create_group and join_group: Communauté is Pro/Pro+ only,
-- unlike most of the rest of the dashboard where the 0,99€ "découverte"
-- trial plan already grants access — mirrors hasCommunityAccess() in
-- src/lib/data/pricing.ts, duplicated here since SQL can't import it. This
-- is defense in depth behind the client-side blur gate, not a replacement
-- for it: it only guards the two ways a user gains group access.
create or replace function public.has_community_access(target_user_id uuid)
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
      and plan in ('pro', 'pro-plus')
  );
$$;

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

  insert into public.groups (name, description, owner_id, is_private)
  values (trim(group_name), coalesce(trim(group_description), ''), caller, group_is_private)
  returning * into new_group;

  insert into public.group_members (group_id, user_id, display_name, status, role)
  values (new_group.id, caller, coalesce(caller_display_name, 'Membre'), 'approved', 'owner');

  return new_group;
end;
$$;

grant execute on function public.create_group(text, text, boolean) to authenticated;

create or replace function public.join_group(target_group_id uuid)
returns public.group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  caller_display_name text;
  target_group public.groups;
  desired_status text;
  result_row public.group_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not public.has_community_access(caller) then
    raise exception 'community_access_required';
  end if;

  select * into target_group from public.groups where id = target_group_id;
  if target_group is null then
    raise exception 'group_not_found';
  end if;
  if target_group.owner_id = caller then
    select * into result_row from public.group_members
      where group_id = target_group_id and user_id = caller;
    return result_row;
  end if;

  select coalesce(split_part(email, '@', 1), 'Membre') into caller_display_name
  from auth.users where id = caller;

  desired_status := case when target_group.is_private then 'pending' else 'approved' end;

  insert into public.group_members (group_id, user_id, display_name, status, role)
  values (target_group_id, caller, coalesce(caller_display_name, 'Membre'), desired_status, 'member')
  on conflict (group_id, user_id) do update
    set status = case
      when public.group_members.status = 'approved' then public.group_members.status
      else excluded.status
    end,
    display_name = excluded.display_name
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.join_group(uuid) to authenticated;

create or replace function public.approve_member(target_group_id uuid, target_user_id uuid)
returns public.group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result_row public.group_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.groups where id = target_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;

  update public.group_members
    set status = 'approved'
    where group_id = target_group_id and user_id = target_user_id and status = 'pending'
    returning * into result_row;

  if result_row is null then
    raise exception 'request_not_found';
  end if;

  return result_row;
end;
$$;

grant execute on function public.approve_member(uuid, uuid) to authenticated;

create or replace function public.reject_member(target_group_id uuid, target_user_id uuid)
returns public.group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result_row public.group_members;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if not exists (select 1 from public.groups where id = target_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;

  update public.group_members
    set status = 'rejected'
    where group_id = target_group_id and user_id = target_user_id and status = 'pending'
    returning * into result_row;

  if result_row is null then
    raise exception 'request_not_found';
  end if;

  return result_row;
end;
$$;

grant execute on function public.reject_member(uuid, uuid) to authenticated;

create or replace function public.remove_member(target_group_id uuid, target_user_id uuid)
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
  if not exists (select 1 from public.groups where id = target_group_id and owner_id = caller) then
    raise exception 'not_authorized';
  end if;
  if exists (
    select 1 from public.groups where id = target_group_id and owner_id = target_user_id
  ) then
    raise exception 'cannot_remove_owner';
  end if;

  delete from public.group_members
    where group_id = target_group_id and user_id = target_user_id;
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- --------------------------------------------------------------------------
-- Storage: chat image attachments. Path convention is
-- "{group_id}/{user_id}/{timestamp}-{filename}" — the RLS policies below
-- parse the group_id/user_id out of the object path via
-- storage.foldername() rather than needing a side table.
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', false)
on conflict (id) do nothing;

create policy "Community images readable per group visibility rules"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-images'
    and (
      public.is_group_public(((storage.foldername(name))[1])::uuid)
      or public.is_group_owner(((storage.foldername(name))[1])::uuid, auth.uid())
      or public.is_approved_group_member(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  );

create policy "Approved members can upload their own community images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_approved_group_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
