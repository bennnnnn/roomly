# Edge Functions deploy & listing expiry cron

## Deploy functions (remote)

From repo root, with `supabase link` already configured:

```bash
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy register-push-token
supabase functions deploy notify-new-message
supabase functions deploy expire-listings
supabase functions deploy delete-account
```

Set secrets in the Supabase Dashboard (Project → Edge Functions → Secrets):

| Secret                  | Used by                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`     | `create-payment-intent`, `stripe-webhook`                          |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook`                                                   |
| `CRON_SECRET`           | `expire-listings`                                                  |
| `STRIPE_TAX_ENABLED`    | `create-payment-intent` — set `true` when Stripe Tax is configured |
| `STRIPE_TAX_CODE`       | Optional; defaults to `txcd_10000000` (general digital service)    |

## Listing expiry schedule

`expire-listings` expects:

```http
POST /functions/v1/expire-listings
Authorization: Bearer <CRON_SECRET>
```

Schedule daily (or hourly) via [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions) or the repo workflow **Expire listings cron** (`.github/workflows/expire-listings-cron.yml`).

### GitHub Actions (recommended)

Add repository secrets:

| Secret         | Value                                            |
| -------------- | ------------------------------------------------ |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co`              |
| `CRON_SECRET`  | Same value as Edge Function secret `CRON_SECRET` |

The workflow runs daily at 06:00 UTC and skips gracefully if secrets are not configured (useful before first deploy).

Example pg_cron + `pg_net` (Dashboard SQL) — adjust URL and secret:

```sql
select cron.schedule(
  'expire-due-listings',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/expire-listings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || '<CRON_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Push notifications (production)

1. EAS credentials for FCM/APNs (`eas credentials`).
2. Users must use a **development build** or store build — push is not available in Expo Go for SDK 56.
