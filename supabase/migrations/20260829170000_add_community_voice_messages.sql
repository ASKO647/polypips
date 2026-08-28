-- Voice messages in Communauté group chat — owner-only to record/send,
-- but every approved member can play them back. Reuses community_messages
-- (a message already optionally carries content/image_url; audio is just
-- a third optional payload) and the existing private community-media
-- bucket/storage policies (already gate the messages/{group}/{user}/…
-- prefix by community_is_member, with no file-type restriction — an
-- audio blob uploaded there needs no new bucket or policy). The actual
-- owner-only enforcement point is community_send_message() below, the
-- only way a client can ever get a message row created — there is still
-- no direct insert policy on community_messages.
alter table public.community_messages
  add column if not exists audio_url text,
  add column if not exists audio_duration_seconds integer;

-- The original CREATE TABLE declared one unnamed CHECK inline
-- ("content <> '' or image_url is not null"); Postgres auto-named it, and
-- rather than guess that name, find and replace it dynamically so this
-- migration doesn't depend on an assumption about internal naming.
do $$
declare
  v_constraint_name text;
begin
  select conname into v_constraint_name
  from pg_constraint
  where conrelid = 'public.community_messages'::regclass
    and contype = 'c';
  if v_constraint_name is not null then
    execute format('alter table public.community_messages drop constraint %I', v_constraint_name);
  end if;
end $$;

alter table public.community_messages
  add constraint community_messages_content_check
  check (content <> '' or image_url is not null or audio_url is not null);

-- community_send_message() gains two new optional parameters and the
-- owner-only rule for audio. Drop both the pre-voice-messages 3-parameter
-- signature AND the 5-parameter one below before recreating it, so this
-- block is safe to run however many times it needs to be (a first-time
-- apply only ever finds the 3-parameter version; re-running it after an
-- already-successful apply — or after a partial one that got this far —
-- finds the 5-parameter version instead; either way there must only ever
-- be one community_send_message left standing before CREATE FUNCTION
-- runs, since plain CREATE FUNCTION errors instead of replacing when a
-- same-signature function already exists).
drop function if exists public.community_send_message(uuid, text, text);
drop function if exists public.community_send_message(uuid, text, text, text, integer);

create function public.community_send_message(
  p_group_id uuid,
  p_content text,
  p_image_url text default null,
  p_audio_url text default null,
  p_audio_duration_seconds integer default null
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
  if p_audio_url is not null and not public.community_is_owner(p_group_id, caller) then
    raise exception 'only_owner_can_send_voice_messages';
  end if;
  if trim(coalesce(p_content, '')) = '' and p_image_url is null and p_audio_url is null then
    raise exception 'empty_message';
  end if;

  insert into public.community_messages (group_id, user_id, content, image_url, audio_url, audio_duration_seconds)
  values (p_group_id, caller, coalesce(trim(p_content), ''), p_image_url, p_audio_url, p_audio_duration_seconds)
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.community_send_message(uuid, text, text, text, integer) to authenticated;
