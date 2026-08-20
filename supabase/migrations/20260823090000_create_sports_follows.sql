-- Real persistence for the Sports module's "Suivre ce match" / "Suivre
-- cette équipe" actions. Mirrors user_wallet_follows' shape exactly
-- (Smart Money's wallet-follow table), including its RLS policies.
--
-- match_id/team_id are plain text, not a foreign key: there is no
-- matches/teams table in this database (fixtures live in
-- lib/sports/mock-data.ts until a real sports-data API is connected), the
-- same reasoning selected_markets already applies to Polymarket's
-- slug/question columns.

create table if not exists public.sports_match_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists sports_match_follows_user_id_idx
  on public.sports_match_follows (user_id);

alter table public.sports_match_follows enable row level security;

create policy "Users can view their own match follows"
  on public.sports_match_follows for select
  using (auth.uid() = user_id);

create policy "Users can follow a match"
  on public.sports_match_follows for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow a match"
  on public.sports_match_follows for delete
  using (auth.uid() = user_id);

create table if not exists public.sports_team_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

create index if not exists sports_team_follows_user_id_idx
  on public.sports_team_follows (user_id);

alter table public.sports_team_follows enable row level security;

create policy "Users can view their own team follows"
  on public.sports_team_follows for select
  using (auth.uid() = user_id);

create policy "Users can follow a team"
  on public.sports_team_follows for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow a team"
  on public.sports_team_follows for delete
  using (auth.uid() = user_id);
