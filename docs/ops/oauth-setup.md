# Apple & Google OAuth setup

Mobile sign-in uses:

- **Apple** — native `signInWithIdToken` (`apps/mobile/src/lib/appleSignIn.ts`)
- **Google** — browser OAuth via `signInWithOAuth` (`apps/mobile/src/lib/oauthSignIn.ts`)

Both require the provider to be enabled in Supabase Auth.

## Supabase Dashboard (production)

Project → **Authentication** → **Providers**:

### Google

1. Create an OAuth 2.0 **Web client** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste **Client ID** and **Client secret** into Supabase Google provider settings.
4. Enable the provider.

### Apple

1. [Apple Developer](https://developer.apple.com/account/resources/identifiers/list) — App ID with **Sign in with Apple**.
2. Create a **Services ID** (web) for Supabase callback if using web OAuth; for native-only, configure the App ID bundle `com.roomly.app`.
3. Create a **Sign in with Apple** key; note Team ID, Key ID, Services ID / bundle ID.
4. In Supabase Apple provider: paste client ID (Services ID or bundle ID per Supabase docs) and secret (JWT or key material per dashboard UI).
5. Enable the provider.

### Redirect URLs

Authentication → **URL configuration**:

- Site URL: `roomly://`
- Redirect URLs: `roomly://auth/callback`

## Local development (`supabase start`)

`supabase/config.toml` reads provider secrets from env vars. Add to `supabase/.env` (gitignored):

```bash
SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_APPLE_SECRET=
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
```

Without these, local OAuth provider init may fail — use email OTP for local auth until secrets are set.

## Mobile

No extra `EXPO_PUBLIC_*` vars are required for OAuth. Google uses `roomly://auth/callback`; ensure `app.config.ts` `scheme: 'roomly'` matches.
