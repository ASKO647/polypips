-- Fixes "photo doesn't display in the Communauté chat" and adds a real
-- group-avatar upload.
--
-- Root cause of the display bug: the original v2 migration created
-- `community-media` as a PRIVATE bucket (public=false) — correct for chat
-- images, which must stay gated to a private group's approved members —
-- but both uploadGroupAvatar() and uploadMessageImage() called
-- getPublicUrl() to build the stored URL. Supabase's public object
-- endpoint (/storage/v1/object/public/...) always rejects requests
-- against a private bucket regardless of any RLS SELECT policy defined on
-- it, so neither URL ever actually resolved — the upload itself
-- succeeded and the URL was saved correctly, but the browser's <img>
-- request 400'd. That matches exactly what was reported: upload works,
-- URL is saved, but the photo never renders.
--
-- Fix, applied differently per use case since their privacy needs differ:
--   - Message images stay in the private community-media bucket (a
--     private group's images must stay members-only) — community.ts now
--     mints a signed URL instead of a public one (see uploadMessageImage).
--   - Group avatars move to a new PUBLIC bucket, community-avatars,
--     mirroring the existing `avatars` bucket used for user profile
--     photos exactly (see 20260829110000_create_avatars_bucket.sql):
--     public read (a group's avatar is shown in "Découvrir" to
--     non-members deciding whether to join — same reasoning as a user's
--     avatar being visible to anyone in the dashboard UI), writes
--     restricted to the group's owner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-avatars',
  'community-avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "Community group avatars are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'community-avatars');

create policy "Group owners can upload a community avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-avatars'
    and public.community_is_owner(((storage.foldername(name))[1])::uuid, auth.uid())
  );

create policy "Group owners can replace a community avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'community-avatars'
    and public.community_is_owner(((storage.foldername(name))[1])::uuid, auth.uid())
  );

-- The old avatar policies on community-media never actually worked (see
-- above) and are superseded by the ones above — drop them rather than
-- leaving dead RLS policies for a path prefix (avatars/...) nothing
-- writes to anymore.
drop policy if exists "Community avatars readable per group visibility" on storage.objects;
drop policy if exists "Group owners can upload their group avatar" on storage.objects;
drop policy if exists "Group owners can replace their group avatar" on storage.objects;
