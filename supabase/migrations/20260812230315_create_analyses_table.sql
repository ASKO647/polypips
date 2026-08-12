create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  category text not null default 'Marché',
  market_url text,
  decision text not null check (decision in ('YES', 'NO')),
  ai_probability numeric not null,
  market_probability numeric not null,
  edge numeric not null,
  opportunity_score numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

create policy "Users can view their own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);
