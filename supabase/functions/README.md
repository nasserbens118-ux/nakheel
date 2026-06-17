# Nakheel — Edge Functions

## Déploiement

```bash
# Prérequis : supabase CLI installé et projet lié
supabase login
supabase link --project-ref laiohanxhxhvicyqrvwe

# Variables d'environnement (à définir dans Supabase Dashboard > Edge Functions > Secrets)
# RESEND_API_KEY = re_fA2TC91b_E7TAQ8Cwtkbn68Znhut39k1U
# ADMIN_EMAIL    = bounouni@gmail.com
# STOCK_THRESHOLD = 500

# Déployer les 3 fonctions
supabase functions deploy subscription-renewal
supabase functions deploy stock-alert
supabase functions deploy commission-report
```

## Planification CRON (Supabase Dashboard > Database > Cron Jobs)

```sql
-- 1. Vérification abonnements expirés — chaque jour à 02h00 UTC
select cron.schedule(
  'subscription-renewal',
  '0 2 * * *',
  $$select net.http_post(
    url := 'https://laiohanxhxhvicyqrvwe.supabase.co/functions/v1/subscription-renewal',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
  )$$
);

-- 2. Alerte stock bas — chaque jour à 18h00 UTC
select cron.schedule(
  'stock-alert',
  '0 18 * * *',
  $$select net.http_post(
    url := 'https://laiohanxhxhvicyqrvwe.supabase.co/functions/v1/stock-alert',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
  )$$
);

-- 3. Rapport mensuel — 1er du mois à 06h00 UTC
select cron.schedule(
  'commission-report',
  '0 6 1 * *',
  $$select net.http_post(
    url := 'https://laiohanxhxhvicyqrvwe.supabase.co/functions/v1/commission-report',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb
  )$$
);
```

## Fonctions

| Fonction | Schedule | Rôle |
|---|---|---|
| `subscription-renewal` | Chaque jour 02:00 | Expire les abonnements Pro → repasse à Free + email opérateur |
| `stock-alert` | Chaque jour 18:00 | Détecte les stocks < 500 kg → email admin |
| `commission-report` | 1er du mois 06:00 | Rapport GMV + commissions + abonnements → email admin |
