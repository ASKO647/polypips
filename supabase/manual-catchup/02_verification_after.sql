-- ============================================================================
-- VÉRIFICATION — à lancer APRÈS le script de rattrapage (lecture seule, ne
-- modifie rien).
-- ============================================================================

-- 1. Liste des tables `public` attendues, avec présent/absent. Doit
--    afficher "present" sur toutes les lignes ; toute ligne "ABSENTE"
--    signale un problème. Les tables Coach IA / Communauté ne doivent
--    JAMAIS apparaître ici (elles n'ont jamais été recréées) — la requête
--    de contrôle en bas de ce fichier le confirme séparément.
with expected(table_name) as (
  values
    ('admin_audit_log'), ('ai_usage_events'), ('analyses'),
    ('copy_trading_strategies'), ('copy_trading_suggestions'),
    ('credit_transactions'), ('football_odds_cache'), ('influencer_referrals'),
    ('influencers'), ('notifications'), ('odds_api_competitions_cache'),
    ('odds_api_matches_cache'), ('pips_track_events'), ('selected_markets'),
    ('selected_sport_matches'), ('selected_trading_analyses'),
    ('signal_ai_analyses'), ('signal_copy_settings'), ('signal_copy_trades'),
    ('signal_wallet_follow_notifications'), ('signal_wallet_trades'),
    ('signal_wallets'), ('signup_sources'), ('sports_bet_analyses'),
    ('sports_competitions_cache'), ('sports_fixtures_cache'),
    ('sports_match_follows'), ('sports_team_follows'), ('sports_teams_cache'),
    ('subscriptions'), ('tiktok_clip_submissions'), ('trading_chart_analyses'),
    ('tracked_wallets'), ('user_credits'), ('user_pips_track_alerts'),
    ('user_quota_cycles'), ('user_referral_links'), ('user_referrals'),
    ('user_settings'), ('user_signal_wallet_follows'), ('user_wallet_follows'),
    ('wallet_follow_notifications'), ('wallet_snapshots'),
    ('whop_webhook_events')
)
select
  e.table_name,
  case when t.table_name is not null then 'present' else 'ABSENTE' end as status
from expected e
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = e.table_name
order by status desc, e.table_name;

-- 2. Colonnes clés de `analyses` et `subscriptions` après rattrapage —
--    même requête que le diagnostic préalable, pour comparer avant/après.
select
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('analyses', 'subscriptions')
order by c.table_name, c.ordinal_position;

-- 3. Contrôle négatif : aucune table Coach IA / Communauté ne doit exister.
--    Cette requête doit renvoyer ZÉRO ligne.
select tablename
from pg_tables
where schemaname = 'public'
  and (
    tablename like 'coach_%'
    or tablename like 'community_%'
    or tablename in ('groups', 'group_members', 'group_messages', 'group_message_reports')
  );

-- 4. Fonctions clés — vérifie que les signatures finales sont bien en
--    place (en particulier credit_purchase à 4 paramètres).
select
  p.proname,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in (
    'credit_purchase', 'ensure_welcome_credits', 'record_user_referral',
    'record_user_referral_conversion', 'sync_plan_credits_cycle',
    'consume_deep_analysis_credit', 'ensure_plan_credits_grant'
  )
order by p.proname;

-- 5. RLS activée sur chaque table `public` — doit renvoyer ZÉRO ligne.
select relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false;

-- 6. Membres de la publication realtime (doit contenir au moins
--    user_credits et pips_track_events).
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
