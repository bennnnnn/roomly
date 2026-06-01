# Supabase

This directory is the source of truth for the Roomly database, RLS policies, and Edge Functions. **Never** edit schema in the Supabase dashboard — always commit a migration and apply it.

## Layout

```
supabase/
├── config.toml              # local-dev config (supabase start)
├── migrations/              # SQL files applied in lexicographic order
│   └── 20260531000001_profiles.sql
├── seed.sql                 # static reference data for local dev only
├── tests/                   # pgTAP tests (run via `supabase test db`)
│   └── profiles_rls.sql
└── README.md                # you are here
```

## Local-dev quickstart

Requires the Supabase CLI ([install](https://supabase.com/docs/guides/cli/getting-started)).

```bash
# One time: install CLI
brew install supabase/tap/supabase

# Start the local stack (Postgres, Studio, GoTrue, Storage, Edge Runtime).
# Pulls Docker images on first run.
supabase start

# Apply migrations + seed
supabase db reset

# Run RLS tests (pgTAP)
supabase test db

# Open Studio
open http://localhost:54323
```

The local `EXPO_PUBLIC_SUPABASE_URL` is `http://127.0.0.1:54321`; `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is printed by `supabase status` (use the new `sb_publishable_…` key, not the legacy `anon` JWT — see [API Keys](https://supabase.com/docs/guides/getting-started/api-keys)).

## Production

Project `roomly`, ref `olzluwalevtnyliwfhai`, region `us-east-1`. Linked locally via:

```bash
supabase link --project-ref olzluwalevtnyliwfhai
supabase db push          # apply pending migrations
pnpm db:types             # regenerate packages/db-types/src/generated/database.ts
```

The linked project ref is stored in `supabase/.temp/project-ref` (gitignored).

## Authoring a new migration

```bash
# Pick a fresh timestamp:
supabase migration new <slug>
# Edit the generated file, then:
supabase db reset      # apply locally
supabase test db       # run pgTAP
```

Every new user-facing table MUST follow ADR-0006:

1. `alter table … enable row level security` in the same migration.
2. ≥1 SELECT policy that uses `public.is_blocked_between` when the row belongs to a user.
3. ≥1 owner-write policy (`INSERT` or `UPDATE` scoped to `auth.uid()`), or document why server-write-only is correct.
4. A `pgTAP` test in `supabase/tests/` covering the policies.
