-- Removes the Coach IA and Communauté features entirely: tables, RPC
-- functions, RLS policies (dropped automatically with their tables), and
-- the storage buckets/policies that backed them.
--
-- DO NOT apply this automatically. Run it by hand in the Supabase SQL
-- Editor once you've confirmed the app deploy that removes the Coach/
-- Communauté UI and code is live (this migration is destructive and not
-- reversible — there is no "down" migration).
--
-- Foreign-key check performed before writing this file (see the full
-- repo audit): grepped every migration under supabase/migrations/ for
-- any `references public.coach_*` / `references public.community_*` /
-- `references public.groups` / `references public.group_members` /
-- `references public.group_messages` outside the Coach/Communauté
-- migrations themselves — none found. No other table, view, or function
-- in this codebase has a foreign key into any table dropped below.
--
-- Two Communauté schemas are dropped here, not one:
--   - community_groups / community_members / community_messages /
--     community_reports / community_message_reactions — the CURRENT
--     ("v2") schema, created by 20260829130000_create_community_tables_v2.sql
--     and extended since.
--   - groups / group_members / group_messages / group_message_reports —
--     an OLDER ("v1") schema from 20260814090000_create_community_tables.sql.
--     The v2 migration's own header says these were deliberately left
--     behind, unreused, after an earlier deactivation of the feature, and
--     no later migration ever dropped them — they are still live, orphaned
--     tables in the database today. Both schemas are Communauté data and
--     both are removed here.
--
-- Coach IA schema: coach_conversations / coach_messages / coach_attachments
-- / coach_artifacts (20260813110409_create_coach_tables.sql and
-- 20261018090000_coach_assistant_upgrade.sql).

-- ============================================================================
-- 1. RPC functions — drop before the tables they reference, though CASCADE
--    on the table drops below would also take care of any that got missed.
-- ============================================================================

-- Communauté v2 functions
drop function if exists public.community_toggle_reaction(uuid, text);
drop function if exists public.community_get_group_view(uuid);
drop function if exists public.community_list_my_groups();
drop function if exists public.community_find_group_by_code(text);
drop function if exists public.community_send_message(uuid, text, text, text, integer);
drop function if exists public.community_send_message(uuid, text, text);
drop function if exists public.community_remove_member(uuid, uuid);
drop function if exists public.community_reject_member(uuid, uuid);
drop function if exists public.community_approve_member(uuid, uuid);
drop function if exists public.community_join_group(uuid);
drop function if exists public.community_create_group(text, text, boolean);
drop function if exists public.community_has_active_access(uuid);
drop function if exists public.community_is_group_public(uuid);
drop function if exists public.community_is_member(uuid, uuid);
drop function if exists public.community_is_owner(uuid, uuid);

-- Communauté v1 (legacy/orphaned) functions
drop function if exists public.find_group_by_code(text);
drop function if exists public.generate_unique_invite_code();
drop function if exists public.remove_member(uuid, uuid);
drop function if exists public.reject_member(uuid, uuid);
drop function if exists public.approve_member(uuid, uuid);
drop function if exists public.join_group(uuid);
drop function if exists public.create_group(text, text, boolean);
drop function if exists public.has_community_access(uuid);
drop function if exists public.is_approved_group_member(uuid, uuid);
drop function if exists public.is_group_public(uuid);
drop function if exists public.is_group_owner(uuid, uuid);

-- Coach IA functions
drop function if exists public.register_coach_attachment(text, text, text, text, integer);

-- ============================================================================
-- 2. Tables — CASCADE drops each table's own RLS policies, indexes,
--    constraints, and realtime-publication membership automatically.
-- ============================================================================

-- Coach IA
drop table if exists public.coach_artifacts cascade;
drop table if exists public.coach_attachments cascade;
drop table if exists public.coach_messages cascade;
drop table if exists public.coach_conversations cascade;

-- Communauté v2 (current)
drop table if exists public.community_message_reactions cascade;
drop table if exists public.community_reports cascade;
drop table if exists public.community_messages cascade;
drop table if exists public.community_members cascade;
drop table if exists public.community_groups cascade;

-- Communauté v1 (legacy/orphaned)
drop table if exists public.group_message_reports cascade;
drop table if exists public.group_messages cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;

-- ============================================================================
-- 3. Storage — policies first, then the buckets themselves.
--
-- IMPORTANT: storage.buckets rows cannot be deleted while storage.objects
-- still reference them. Empty each bucket's OBJECTS first — either run the
-- DELETE below (fine for a small number of files) or, for a large bucket,
-- empty it from the Supabase Dashboard (Storage → bucket → select all →
-- delete), which paginates and avoids a single huge statement. Either way,
-- do this BEFORE the "delete from storage.buckets" statement at the end,
-- or that statement will fail with a foreign-key violation.
-- ============================================================================

-- Coach IA attachments bucket policies
drop policy if exists "Users can delete their own coach-attachments" on storage.objects;
drop policy if exists "Users can read their own coach-attachments" on storage.objects;
drop policy if exists "Users can upload to their own coach-attachments folder" on storage.objects;

-- Communauté v2 bucket policies (community-media, community-avatars)
drop policy if exists "Approved members can upload their own message images" on storage.objects;
drop policy if exists "Community message images readable by owner or approved members" on storage.objects;
drop policy if exists "Group owners can replace a community avatar" on storage.objects;
drop policy if exists "Group owners can upload a community avatar" on storage.objects;
drop policy if exists "Community group avatars are publicly readable" on storage.objects;
-- Superseded policies from the original community-media avatar path,
-- already dropped by 20260829160000_fix_community_media_storage.sql, but
-- listed here `if exists` in case that migration was ever skipped:
drop policy if exists "Group owners can replace their group avatar" on storage.objects;
drop policy if exists "Group owners can upload their group avatar" on storage.objects;
drop policy if exists "Community avatars readable per group visibility" on storage.objects;

-- Communauté v1 (legacy) bucket policy (community-images)
drop policy if exists "Approved members can upload their own community images" on storage.objects;
drop policy if exists "Community images readable per group visibility rules" on storage.objects;

-- Empty each bucket's objects (safe to run even if already empty / bucket
-- never existed). For a bucket with a lot of files, do this from the
-- Dashboard instead — see the note above.
delete from storage.objects where bucket_id in (
  'coach-attachments', 'community-media', 'community-avatars', 'community-images'
);

-- Only once the corresponding bucket is confirmed empty (see note above):
delete from storage.buckets where id in (
  'coach-attachments', 'community-media', 'community-avatars', 'community-images'
);

-- ============================================================================
-- 4. Tell PostgREST to drop its cached schema (removed tables/functions
--    must disappear from the auto-generated REST API immediately).
-- ============================================================================
NOTIFY pgrst, 'reload schema';
