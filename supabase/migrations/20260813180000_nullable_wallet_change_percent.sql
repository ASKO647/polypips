-- change_percent previously defaulted to 0 and was always populated, which
-- made "no historical reference yet" indistinguishable from "genuinely
-- unchanged" — the frontend has no way to tell a brand-new wallet apart
-- from a flat one, and always rendered a (green) "+0.0%" badge for both.
-- sync-smart-money now only sets this column when it found a real past
-- snapshot to compare against; otherwise it leaves it null, and the
-- frontend renders a neutral state instead of assuming a positive change.
alter table public.tracked_wallets
  alter column change_percent drop not null,
  alter column change_percent drop default;
