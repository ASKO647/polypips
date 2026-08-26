-- Simplifies Fomo X Axiom Copy Trading to exactly the same model as
-- Polymarket's Copy Trading (copy_trading_suggestions): a wallet trade
-- evaluated by the AI Engine + Risk Engine reaches one decision (copie/
-- ignore) and one notification with a real external link — never a
-- simulated position, execution, or PnL. sync-signal-wallets/index.ts and
-- risk-engine.ts are rewritten alongside this migration; see their file
-- comments.
--
-- status used to conflate two different things: a simulated position's
-- lifecycle (en_cours/ferme/echec) AND implicitly stood in for click
-- tracking. It becomes exactly what copy_trading_suggestions.status
-- already is: whether the USER has looked at / clicked through this
-- suggestion, never a trade's own execution state.

update public.signal_copy_trades set status = 'nouvelle';

alter table public.signal_copy_trades
  drop constraint if exists signal_copy_trades_status_check;

alter table public.signal_copy_trades
  alter column status set default 'nouvelle';

alter table public.signal_copy_trades
  add constraint signal_copy_trades_status_check
  check (status in ('nouvelle', 'vue', 'lien_cliquee'));

-- execution_mode/closed_pnl/opened_at/closed_at all existed to track a
-- simulated position through to a simulated close — that concept is gone,
-- not merely hidden, so the columns go with it rather than staying as
-- dead fields nothing ever reads again.
alter table public.signal_copy_trades
  drop column if exists execution_mode,
  drop column if exists closed_pnl,
  drop column if exists opened_at,
  drop column if exists closed_at;

-- Mirrors copy_trading_suggestions' own update policy exactly — the
-- frontend ("Trades copiés") marks a row 'lien_cliquee' the same way
-- strategy-active.tsx does for Polymarket, a direct client-side update
-- rather than a dedicated API route.
create policy "Users can update the status of their own copy trades"
  on public.signal_copy_trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- max_loss_amount/auto_stop only ever made sense against the simulated
-- position/PnL lifecycle just removed above — with no execution (real or
-- simulated) to measure a loss against, a "max daily loss" setting could
-- never be evaluated honestly, so it's dropped rather than kept as a
-- field that silently does nothing.
alter table public.signal_copy_settings
  drop column if exists max_loss_amount,
  drop column if exists auto_stop;
