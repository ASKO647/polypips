-- ============================================================================
-- DIAGNOSTIC — à lancer AVANT le script de rattrapage (lecture seule, ne
-- modifie rien). Colle le résultat de cette requête dans ta prochaine
-- réponse pour confirmer que 01_production_catchup.sql complète
-- bien les colonnes manquantes de `analyses` et `subscriptions` sans rien
-- oublier ni rien supposer à tort sur leur état actuel.
-- ============================================================================

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

-- Contraintes CHECK/UNIQUE actuelles sur ces deux tables (utile pour
-- confirmer l'état exact de subscriptions_plan_check / analyses_decision_*
-- avant le rattrapage).
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.analyses'::regclass, 'public.subscriptions'::regclass)
order by table_name, conname;
