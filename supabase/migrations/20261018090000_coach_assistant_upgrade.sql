-- Coach IA → assistant central: context toggles, attachments (private,
-- signed-URL-only), and structured artifacts. See coach-chat's own
-- comments for how each piece is actually used.

-- ---------------------------------------------------------------------
-- 1. Context toggles — which sources this conversation may use. A plain
-- array column (not a join table): a small fixed set of toggles per
-- conversation, always read/written as a whole, never queried by value —
-- a join table would just add a round trip for no benefit here. Already
-- covered by coach_conversations' existing "update own row" RLS policy,
-- so no new policy is needed for this column.
-- ---------------------------------------------------------------------
alter table public.coach_conversations
  add column if not exists enabled_context text[] not null default '{}';

-- ---------------------------------------------------------------------
-- 2. Attachments — private bucket, signed URLs only (see section 3).
-- Deliberately NO insert/update/delete policy for authenticated: every
-- write goes through register_coach_attachment() below, which is the
-- only place the 5/day cap is enforced. A direct-insert RLS policy would
-- let a client bypass that cap entirely. Mirrors the credits system's
-- "no insert policy, RPC only" posture (see 20260916090000_create_credits_system.sql).
-- ---------------------------------------------------------------------
create table public.coach_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Nullable: a file is uploaded (and registered, counting against the
  -- daily cap) before the conversation/message it ends up attached to
  -- necessarily exist yet — coach-chat fills these in once the message
  -- is actually persisted.
  conversation_id uuid references public.coach_conversations (id) on delete cascade,
  message_id uuid references public.coach_messages (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null check (mime_type in (
    'image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv'
  )),
  kind text not null check (kind in ('image', 'pdf', 'csv')),
  -- 10 MiB ceiling — also enforced by the bucket's own file_size_limit
  -- (belt and braces: the bucket config can't be inspected from a check
  -- constraint, and this column is what coach-chat and the UI both read).
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index coach_attachments_user_id_created_at_idx
  on public.coach_attachments (user_id, created_at desc);

create index coach_attachments_message_id_idx
  on public.coach_attachments (message_id);

alter table public.coach_attachments enable row level security;

create policy "Users can view their own coach attachments"
  on public.coach_attachments for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- register_coach_attachment — called right after the client uploads the
-- raw file to the private coach-attachments bucket (storage upload is
-- already gated by that bucket's own RLS path-ownership policy, see
-- section 3). This is the ONE place the 5-per-day-per-user cap (every
-- plan, including pro_legacy — explicitly a safety ceiling, not a
-- plan-tier quota) is enforced: the count-then-insert happens in a
-- single statement's transaction, so two concurrent uploads can't both
-- slip past the cap. Raises 'daily_attachment_limit_reached' once the
-- caller already has 5 rows in the last rolling 24h — the same "rolling
-- 24h" window convention already used for daily analysis quotas
-- (see analyze-market's FREE_DEMO_DAILY_LIMIT check).
-- ---------------------------------------------------------------------
create or replace function public.register_coach_attachment(
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_kind text,
  p_size_bytes integer
) returns public.coach_attachments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_row public.coach_attachments;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select count(*) into v_count
  from public.coach_attachments
  where user_id = v_user_id
    and created_at >= now() - interval '24 hours';

  if v_count >= 5 then
    raise exception 'daily_attachment_limit_reached';
  end if;

  insert into public.coach_attachments (
    user_id, storage_path, file_name, mime_type, kind, size_bytes
  )
  values (v_user_id, p_storage_path, p_file_name, p_mime_type, p_kind, p_size_bytes)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.register_coach_attachment(text, text, text, text, integer) from public;
grant execute on function public.register_coach_attachment(text, text, text, text, integer) to authenticated;

-- Links a batch of already-registered attachments to the message that
-- actually sent them, once that message exists — called by coach-chat
-- right after inserting the user's coach_messages row, with its own JWT
-- (not service_role), so this needs an update policy restricted to the
-- caller's own attachments.
create policy "Users can attach their own uploads to their own message"
  on public.coach_attachments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Private storage bucket for attachments — no public read, ever.
-- Every URL the app ever hands out for one of these files is a signed
-- URL (see lib/supabase/coach-attachments.ts), exactly like
-- community-media's private chat images
-- (20260829160000_fix_community_media_storage.sql). file_size_limit and
-- allowed_mime_types are enforced by Storage itself on every upload,
-- independent of the coach_attachments table's own check constraints.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-attachments',
  'coach-attachments',
  false,
  10485760, -- 10 MiB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv']
)
on conflict (id) do nothing;

create policy "Users can upload to their own coach-attachments folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coach-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own coach-attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own coach-attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'coach-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 4. Structured artifacts — comparison tables, reports, checklists, risk
-- summaries, surveillance plans. Written with the caller's own JWT (same
-- posture as coach_messages — coach-chat never uses service_role), so a
-- plain "own rows" insert policy is enough; unlike coach_attachments
-- there's no separate cap to enforce server-side (an artifact is only
-- ever a side effect of a message that already went through the normal
-- weekly Coach quota).
-- ---------------------------------------------------------------------
create table public.coach_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  message_id uuid not null references public.coach_messages (id) on delete cascade,
  type text not null check (type in (
    'comparison_table', 'report', 'checklist', 'risk_summary', 'surveillance_plan'
  )),
  -- Always the validated tool-call input from one of the emit_* tools in
  -- coach-chat/artifact-tools.ts — never raw/unvalidated model text. See
  -- that file for the exact shape per type.
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index coach_artifacts_conversation_id_created_at_idx
  on public.coach_artifacts (conversation_id, created_at desc);

create index coach_artifacts_user_id_created_at_idx
  on public.coach_artifacts (user_id, created_at desc);

alter table public.coach_artifacts enable row level security;

create policy "Users can view their own coach artifacts"
  on public.coach_artifacts for select
  using (auth.uid() = user_id);

create policy "Users can create their own coach artifacts"
  on public.coach_artifacts for insert
  with check (auth.uid() = user_id);
