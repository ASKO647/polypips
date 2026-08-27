-- Pips Tracks — a shared, all-users, real-time activity feed under the
-- "Fomo X Axiom" section, aggregating events from multiple sources into one
-- denormalized table so the frontend can filter/paginate/realtime-subscribe
-- against a single shape instead of unioning several source tables.
--
-- Three sources are wired in this migration: fomo/axiom (derived from
-- signal_wallet_trades, which the existing sync-signal-wallets Edge
-- Function already populates — 'mock' mode today since neither Fomo nor
-- Axiom publish a documented API, see that table's own migration comment)
-- and news (polled from CryptoPanic's free developer API by the new
-- sync-pips-tracks-news Edge Function — 'live' once CRYPTOPANIC_API_TOKEN
-- is configured, empty until then, never fabricated).
--
-- X/Twitter is deliberately NOT wired: as of when this shipped, X's API
-- has no free tier (usage-billed per read since Feb 2026) and this project
-- isn't paying for it yet. The 'x'/'x_post' enum values below stay
-- reserved so a future paid integration needs no schema change — nothing
-- writes them today, and the frontend has no "X" filter tab until it does.
--
-- Deliberately NOT sourced from signal_copy_trades: that table is one
-- user's own personalized Copy Trading decision log (their sized_amount,
-- their risk-engine outcome, gated by `auth.uid() = user_id`) — reading it
-- into this shared, all-authenticated-users table would leak one user's
-- private Copy Trading activity to every other user. "Signal IA" here is
-- instead derived from signal_wallets.polypips_score, a wallet-level score
-- already computed by the sync pipeline and already visible to every
-- authenticated user via signal_wallets' own "using (true)" policy — so
-- nothing new is exposed, only re-surfaced in the feed.
create table if not exists public.pips_track_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('fomo', 'axiom', 'x', 'news')),
  event_type text not null check (
    event_type in ('trade_buy', 'trade_sell', 'signal_ia', 'wallet_active', 'news', 'x_post')
  ),
  title text not null,
  description text not null default '',
  token_symbol text,
  wallet_address text,
  wallet_label text,
  amount_usd numeric,
  price numeric,
  ai_score integer,
  ai_win_rate numeric,
  ai_impact text check (ai_impact in ('eleve', 'moyen', 'faible')),
  external_url text,
  -- Mirrors signal_wallets.data_source_mode: every row here is 'mock'
  -- until a real Fomo/Axiom (or X/News) provider exists — see that
  -- table's migration comment for why this column is load-bearing rather
  -- than cosmetic.
  data_source_mode text not null default 'mock' check (data_source_mode in ('mock', 'live')),
  source_trade_id uuid references public.signal_wallet_trades (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists pips_track_events_occurred_at_idx
  on public.pips_track_events (occurred_at desc);
create index if not exists pips_track_events_source_idx
  on public.pips_track_events (source, occurred_at desc);
create index if not exists pips_track_events_token_symbol_idx
  on public.pips_track_events (token_symbol, occurred_at desc);
-- Backs the trigger's ON CONFLICT below — one trade can only ever produce
-- one 'trade_buy'/'trade_sell' feed row, even if the trigger somehow ran
-- twice for the same source_trade_id.
create unique index if not exists pips_track_events_source_trade_id_key
  on public.pips_track_events (source_trade_id) where source_trade_id is not null;
-- Backs sync-pips-tracks-news' dedupe: the same CryptoPanic article can't
-- be inserted twice across cron runs. Scoped to event_type='news' only —
-- every trade/signal_ia/wallet_active row's external_url is one of two
-- fixed platform homepages shared by many rows, so a table-wide unique
-- constraint on external_url would incorrectly reject those.
create unique index if not exists pips_track_events_news_external_url_key
  on public.pips_track_events (external_url) where event_type = 'news';

alter table public.pips_track_events enable row level security;

create policy "Authenticated users can read the Pips Tracks feed"
  on public.pips_track_events for select
  to authenticated
  using (true);

-- No insert/update/delete policy for authenticated: every row today is
-- written by the trigger below (fires under signal_wallet_trades' own
-- writer, sync-signal-wallets' service role); a future X/News ingestion
-- function would write through the service role the same way.

alter publication supabase_realtime add table public.pips_track_events;

-- --------------------------------------------------------------------------
-- Ingestion: one signal_wallet_trades insert can produce up to three feed
-- rows — the trade itself, an optional Signal IA row (wallet score is high
-- enough to be worth surfacing), and an optional wallet-reactivation row
-- (this wallet was quiet for 3+ days before this trade). All three read
-- only already-public data (signal_wallets, signal_wallet_trades), so
-- SECURITY DEFINER here is a consistency choice (matches every other
-- cross-table writer in this codebase), not a privilege escalation.
-- --------------------------------------------------------------------------

create or replace function public.pips_track_ingest_signal_trade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.signal_wallets;
  v_label text;
  v_prior_traded_at timestamptz;
  v_platform_url text;
begin
  select * into v_wallet from public.signal_wallets where id = new.wallet_id;
  if v_wallet is null then
    return new;
  end if;

  v_label := coalesce(nullif(v_wallet.label, ''), left(v_wallet.address, 6) || '...' || right(v_wallet.address, 4));
  v_platform_url := case when v_wallet.source = 'fomo' then 'https://fomo.family' else 'https://axiom.trade' end;

  insert into public.pips_track_events (
    source, event_type, title, description, token_symbol,
    wallet_address, wallet_label, amount_usd, price,
    external_url, data_source_mode, source_trade_id, occurred_at
  )
  values (
    v_wallet.source,
    case when new.side = 'BUY' then 'trade_buy' else 'trade_sell' end,
    case when new.side = 'BUY' then 'Achat important détecté' else 'Vente importante détectée' end,
    format('Le wallet %s a %s $%s pour %s $',
      v_label,
      case when new.side = 'BUY' then 'acheté' else 'vendu' end,
      new.token_symbol,
      to_char(round(new.amount_usd), 'FM999G999G999')),
    new.token_symbol,
    v_wallet.address, v_wallet.label, new.amount_usd, new.price,
    v_platform_url, v_wallet.data_source_mode, new.id, new.traded_at
  )
  on conflict (source_trade_id) where source_trade_id is not null do nothing;

  if v_wallet.polypips_score is not null and v_wallet.polypips_score >= 65 then
    insert into public.pips_track_events (
      source, event_type, title, description, token_symbol,
      wallet_address, wallet_label, amount_usd,
      ai_score, ai_win_rate, ai_impact,
      external_url, data_source_mode, occurred_at
    )
    values (
      v_wallet.source, 'signal_ia', 'Signal IA généré',
      format('%s sur $%s par un wallet à %s%% de Win Rate.',
        case when new.side = 'BUY' then 'Achat détecté' else 'Vente détectée' end,
        new.token_symbol, round(coalesce(v_wallet.win_rate, 0))),
      new.token_symbol, v_wallet.address, v_wallet.label, new.amount_usd,
      v_wallet.polypips_score, v_wallet.win_rate,
      case
        when v_wallet.polypips_score >= 80 then 'eleve'
        when v_wallet.polypips_score >= 65 then 'moyen'
        else 'faible'
      end,
      v_platform_url, v_wallet.data_source_mode, new.traded_at
    );
  end if;

  select max(traded_at) into v_prior_traded_at
  from public.signal_wallet_trades
  where wallet_id = new.wallet_id and id <> new.id and traded_at < new.traded_at;

  if v_prior_traded_at is not null and new.traded_at - v_prior_traded_at >= interval '3 days' then
    insert into public.pips_track_events (
      source, event_type, title, description,
      wallet_address, wallet_label, ai_score,
      external_url, data_source_mode, occurred_at
    )
    values (
      v_wallet.source, 'wallet_active', 'Nouveau wallet suivi actif',
      format('Le wallet %s redevient actif après %s jours d''inactivité.',
        v_label, floor(extract(epoch from (new.traded_at - v_prior_traded_at)) / 86400)),
      v_wallet.address, v_wallet.label, v_wallet.polypips_score,
      v_platform_url, v_wallet.data_source_mode, new.traded_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists pips_track_ingest_signal_trade_trigger on public.signal_wallet_trades;
create trigger pips_track_ingest_signal_trade_trigger
  after insert on public.signal_wallet_trades
  for each row execute function public.pips_track_ingest_signal_trade();

-- --------------------------------------------------------------------------
-- Composite reads for the right-hand column panels — single round trip
-- each, same defensive principle used throughout this codebase.
-- --------------------------------------------------------------------------

create or replace function public.pips_tracks_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'eventsToday', (select count(*) from public.pips_track_events where occurred_at >= date_trunc('day', now())),
    'signalsToday', (select count(*) from public.pips_track_events where event_type = 'signal_ia' and occurred_at >= date_trunc('day', now())),
    'buysToday', (select count(*) from public.pips_track_events where event_type = 'trade_buy' and occurred_at >= date_trunc('day', now())),
    'sellsToday', (select count(*) from public.pips_track_events where event_type = 'trade_sell' and occurred_at >= date_trunc('day', now())),
    'activeWallets', (
      select count(distinct wallet_address) from public.pips_track_events
      where wallet_address is not null and occurred_at >= now() - interval '24 hours'
    )
  );
$$;

grant execute on function public.pips_tracks_summary() to authenticated;

create or replace function public.pips_tracks_top_tokens(p_limit integer default 5)
returns table (token_symbol text, mention_count bigint)
language sql
stable
set search_path = public
as $$
  select token_symbol, count(*) as mention_count
  from public.pips_track_events
  where token_symbol is not null and occurred_at >= now() - interval '24 hours'
  group by token_symbol
  order by mention_count desc, token_symbol asc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.pips_tracks_top_tokens(integer) to authenticated;

-- --------------------------------------------------------------------------
-- "Créer une alerte" (Bloc 4) — the alert is genuinely saved (never a
-- no-op button), but no delivery pipeline reads this table yet in this
-- pass; the frontend must say so plainly rather than implying the user
-- will be notified immediately.
-- --------------------------------------------------------------------------

create table if not exists public.user_pips_track_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_symbol text,
  min_amount_usd numeric,
  created_at timestamptz not null default now()
);

create index if not exists user_pips_track_alerts_user_id_idx
  on public.user_pips_track_alerts (user_id);

alter table public.user_pips_track_alerts enable row level security;

create policy "Users can view their own Pips Tracks alerts"
  on public.user_pips_track_alerts for select
  using (auth.uid() = user_id);

create policy "Users can create their own Pips Tracks alerts"
  on public.user_pips_track_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own Pips Tracks alerts"
  on public.user_pips_track_alerts for delete
  using (auth.uid() = user_id);
