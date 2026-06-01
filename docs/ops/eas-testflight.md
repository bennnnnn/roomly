# EAS Build → TestFlight

## Prerequisites

- [Expo account](https://expo.dev) with access to the `roomly` project
- Apple Developer Program membership
- App Store Connect app record for `com.roomly.app`
- Supabase production URL + publishable key in EAS secrets

## One-time credentials

```bash
cd apps/mobile
pnpm exec eas login
pnpm exec eas credentials   # iOS: distribution cert, provisioning profile, push key
```

Push notifications require an **APNs key** uploaded to EAS (used by `expo-notifications`). FCM is configured similarly for Android.

## EAS secrets (production builds)

Set via `eas secret:create` or Expo dashboard — never commit values:

| Secret                                 | Purpose                  |
| -------------------------------------- | ------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase project URL     |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable anon key     |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`   | Stripe publishable key   |
| `EXPO_PUBLIC_SENTRY_DSN`               | Optional crash reporting |

## Build profiles (`eas.json`)

| Profile       | Use                                                  |
| ------------- | ---------------------------------------------------- |
| `development` | Dev client, internal distribution                    |
| `preview`     | Internal QA on device (no dev menu)                  |
| `production`  | App Store / TestFlight; `autoIncrement` build number |

## TestFlight upload

```bash
cd apps/mobile
pnpm exec eas build --platform ios --profile production
pnpm exec eas submit --platform ios --profile production
```

Or combine: `eas build --platform ios --profile production --auto-submit`.

First submit prompts for Apple ID, ASC app ID, and team ID — store in `eas.json` `submit.production.ios` or EAS project settings.

## Verify before release

- Sign in (email, Apple, Google)
- Verify-email flow for new email signups
- Push token registration on physical device (not Expo Go)
- Stripe PaymentSheet in sandbox
- Listing create → publish → expiry cron (see `docs/ops/edge-functions-and-cron.md`)
