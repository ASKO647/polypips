create table if not exists public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_conversations_user_id_updated_at_idx
  on public.coach_conversations (user_id, updated_at desc);

alter table public.coach_conversations enable row level security;

create policy "Users can view their own coach conversations"
  on public.coach_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create their own coach conversations"
  on public.coach_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own coach conversations"
  on public.coach_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_conversation_id_created_at_idx
  on public.coach_messages (conversation_id, created_at);

create index if not exists coach_messages_user_id_role_created_at_idx
  on public.coach_messages (user_id, role, created_at);

alter table public.coach_messages enable row level security;

create policy "Users can view their own coach messages"
  on public.coach_messages for select
  using (auth.uid() = user_id);

create policy "Users can create their own coach messages"
  on public.coach_messages for insert
  with check (auth.uid() = user_id);
