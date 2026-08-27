-- Emoji reactions on Communauté messages. No reactions table existed among
-- the tables kept from the feature's previous deactivation (only
-- community_groups/community_members/community_messages/community_reports
-- — the last of those is a moderation flag table, unrelated to reactions),
-- so this is a new table, built on the same conventions as
-- 20260829130000_create_community_tables_v2.sql: group_id is duplicated
-- onto every row (instead of resolving it via a join to community_messages
-- inside the RLS policy) so both the policy and realtime's filter stay
-- simple single-column checks, matching how community_messages itself
-- carries its own group_id rather than requiring a join to know it.
create table if not exists public.community_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages (id) on delete cascade,
  group_id uuid not null references public.community_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '😂', '😮', '😢', '🔥')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists community_message_reactions_message_id_idx
  on public.community_message_reactions (message_id);
create index if not exists community_message_reactions_group_id_idx
  on public.community_message_reactions (group_id);

-- DELETE events only carry the primary key by default (default replica
-- identity), which would drop group_id/emoji/user_id from the realtime
-- payload — both the client's group_id=eq.… filter and the "which
-- reaction was removed" handler need those columns on delete too.
alter table public.community_message_reactions replica identity full;

alter table public.community_message_reactions enable row level security;

-- Same defensive principle as the rest of this feature: this policy calls
-- the existing community_is_member() SECURITY DEFINER helper rather than
-- embedding a subquery against another table, so it can never become part
-- of a recursive policy-evaluation cycle.
create policy "Approved members can read message reactions"
  on public.community_message_reactions for select
  to authenticated
  using (public.community_is_member(group_id, auth.uid()));

-- No insert/update/delete policy for authenticated: exactly like
-- community_members, every mutation goes through the SECURITY DEFINER
-- function below, so a client can never fabricate a reaction under
-- someone else's user_id or bypass the membership check.

alter publication supabase_realtime add table public.community_message_reactions;

-- Add-or-remove in one atomic call — the "click your own reaction to
-- remove it" toggle semantics belong server-side so two rapid clicks
-- can't race into a duplicate insert/delete pair.
create or replace function public.community_toggle_reaction(p_message_id uuid, p_emoji text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  v_group_id uuid;
  v_existing uuid;
begin
  if caller is null then
    raise exception 'authentication_required';
  end if;
  if p_emoji not in ('👍', '❤️', '😂', '😮', '😢', '🔥') then
    raise exception 'invalid_emoji';
  end if;

  select group_id into v_group_id from public.community_messages where id = p_message_id;
  if v_group_id is null then
    raise exception 'message_not_found';
  end if;
  if not public.community_is_member(v_group_id, caller) then
    raise exception 'not_a_member';
  end if;

  select id into v_existing from public.community_message_reactions
    where message_id = p_message_id and user_id = caller and emoji = p_emoji;

  if v_existing is not null then
    delete from public.community_message_reactions where id = v_existing;
    return 'removed';
  else
    insert into public.community_message_reactions (message_id, group_id, user_id, emoji)
    values (p_message_id, v_group_id, caller, p_emoji);
    return 'added';
  end if;
end;
$$;

grant execute on function public.community_toggle_reaction(uuid, text) to authenticated;
