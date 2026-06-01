-- Local dev seed data. Only runs on `supabase db reset` (never against prod).
--
-- We don't seed auth.users (Supabase manages those); instead, on first
-- `supabase start` the dev should sign up via the app to populate profiles.
-- Use this file for static reference data that never depends on a user id.

-- (Currently empty — listings/categories/etc seeds land with later slices.)
