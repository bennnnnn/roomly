# Open questions (human-action required)

A live list of unknowns that must be resolved before launch. **Update this file whenever a question is answered or a new one surfaces.**

Each entry: ID · status · owner · question · why it matters · target slice.

---

## Blocking before launch

- **OQ-001 · open · TBD · App Store / Google Play payment policy for listing fees.**
  Does Apple require IAP for a real-world listing-service fee, or is Stripe acceptable? Read Apple §3.1.5 (a) Goods and Services Outside of the App and Play's equivalent guidance.
  Why: blocks Slice 4 store submission if IAP is required. Mitigation plan needed (lower price tier? web-only payment?).
  Target slice: 4.

- **OQ-002 · open · TBD · Legal review of Terms of Service and Privacy Policy.**
  Roomly handles PII and connects strangers. ToS/Privacy must cover fair-housing ad rules, content moderation, data retention, GDPR/CCPA.
  Target slice: 7.

- **OQ-003 · open · TBD · Stripe account, tax registration, business entity.**
  Required before any payment can be processed.
  Target slice: 4.

- **OQ-004 · open · TBD · Apple Developer ($99/yr) and Google Play Developer ($25 one-time) accounts.**
  Required for TestFlight + Internal Testing.
  Target slice: 7.

- **OQ-005 · open · TBD · Resend sending-domain DNS (SPF, DKIM, DMARC) on the production domain.**
  Required before any transactional email is sent.
  Target slice: 4.

- **OQ-006 · open · TBD · Final brand name, logo, accent color.**
  "Roomly" is a working name. Confirm or rename before any store listing.
  Target slice: 7.

- **OQ-007 · open · TBD · Seed city + first-host recruitment.**
  Empty marketplace = no users. Pick a launch city; recruit 25–50 hosts manually.
  Target slice: 7.

- **OQ-008 · open · TBD · RLS security review by an external reviewer.**
  Schedule before Slice 7 hardening.
  Target slice: 7.

---

## Technical debt to revisit

| ID    | Item                                                                                                                                                                                                                                                          | Trigger to revisit                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| TD-01 | Pinned to `jest@29.7.0` because `jest-expo@56` peer-depends on Jest 29 internals. Upgrade to Jest 30 once jest-expo ships a compatible release.                                                                                                               | jest-expo 57 release (or 56.x bumping Jest peer). |
| TD-02 | Moderate `uuid` GHSA in the Expo CLI build chain (see ADR-0007 audit policy table). Acceptable because it only runs at `expo prebuild`/EAS Build.                                                                                                             | Expo SDK 57 or any `@expo/cli` minor bump.        |
| TD-03 | GitHub Actions runner deprecation: `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4` still run on Node 20 inside the runner. GitHub forces Node 24 default on 2026-06-16. Verify these still work by then, or pin newer action versions. | 2026-06-16.                                       |

## Technical decisions still open

- **OQ-010 · open · agent · Admin auth strategy.**
  Use Supabase Auth with `role` custom claim, **or** separate Supabase project for admin?
  Recommendation: same project + role claim for MVP; revisit if blast-radius concerns arise.

- **OQ-011 · open · agent · Map provider — `react-native-maps` vs `@maplibre/maplibre-react-native`.**
  Recommendation: `react-native-maps` for familiarity; Google API key required.

- **OQ-012 · open · agent · Image hosting / CDN for listing photos.**
  Supabase Storage default; revisit if egress costs spike.

- **OQ-013 · open · agent · Presence: Supabase Realtime presence channels vs `presence(user_id, last_seen)` table.**
  Recommendation: Realtime presence — zero DB writes, derives from connected clients.

- **OQ-014 · open · agent · Geocoding provider.**
  Apple/Google built-in vs Mapbox vs OpenStreetMap Nominatim.
  Recommendation: native platform geocoder for the address-autocomplete step; verify rate limits before launch.

---

## Resolved

_(Move entries here as they get answered, with the resolution and the date.)_
