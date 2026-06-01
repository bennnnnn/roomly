# Roomly — Product Requirements Document (MVP)

> Working name: **Roomly**. Native mobile app (iOS + Android) for listing and finding rooms/houses to rent. Listing service only — no leases, no rent collection.

## 0. Product overview

- **Problem.** Individuals and small companies with a spare room/basement/house have no cheap, simple, trustworthy place to advertise it to local renters; renters lack a clean local-rooms browse experience.
- **Solution.** A native app where listers pay a small flat fee to post a property (with photos, price, rules), and renters browse, save, and message hosts entirely in-app.
- **Business model.** Listing fees only — **$9.99** for the first active property/month, **$17.99** flat for additional properties (covers all extras), **$9.99** to re-list after a 30-day expiry. Renters pay nothing.

### Primary MVP goals

- A lister can publish a paid listing in **under 5 minutes**.
- A renter can find and message a relevant host in **under 2 minutes**.
- All communication stays in-app; no contact info leaks.

### Success metrics

Active listings, listing→payment conversion, renter→message conversion, messages per listing, 30-day re-list rate, paid-listing revenue, D7/D30 retention.

### Platforms

iOS + Android via Expo (SDK 56) / React Native. Admin web (Next.js). **Out of scope for MVP**: leases, rent/escrow, background checks, reviews, in-app calling (Agora = phase 2).

---

## 1. Personas

- **Host — individual** (primary payer): owns/rents a home with a spare room/basement; less tech-savvy; wants quick, cheap exposure and to avoid scams/spam.
- **Host — company**: property manager / small rental business; lists multiple units; wants efficiency and a business identity.
- **Renter**: mobile-first, browsing for a room/short-term place; wants fast filtering and direct contact.
- **Admin/Moderator** (internal): reviews reports, removes bad content, bans users, sees revenue, user counts by renter/host, listings by state/city, etc.

---

## 2. Global / cross-cutting specifications

### 2.1 Tech stack

- **App**: Expo SDK 56 (React Native 0.85, React 19.2) + TypeScript + Expo Router.
- **Backend**: Supabase — Postgres, Auth, Storage, Realtime; Edge Functions (Deno) for server logic.
- **Payments**: Stripe (`@stripe/stripe-react-native` 0.66.x; PaymentSheet, Apple Pay, Google Pay).
- **Email**: Resend (triggered by Edge Functions).
- **Push**: Expo Notifications (APNs / FCM).
- **Maps**: `react-native-maps` (approximate area only).
- **Monitoring/Analytics**: Sentry + PostHog (wrapped in `lib/logger.ts`).
- **Builds**: EAS Build + Submit.
- **Admin web**: Next.js App Router, shadcn/ui, TanStack Table, `@supabase/ssr`.

### 2.2 Auth (applies to all gated actions)

- **Methods.** iOS: Apple, Google, Email. Android: Google, Email. (No Apple on Android; email recovery covers cross-platform.)
- Pattern: social buttons shown; "Continue with email" expands Name/Email/Password (signup) or Email/Password (login).
- Email accounts require email verification (deep link) before messaging or listing.
- Tokens stored in Expo SecureStore (encrypted adapter).
- **Gated actions** (require login): Save, Message, Create listing, Report, edit profile. Ungated: browse, search, view listing detail.
- Rate-limit failed logins and signups.

### 2.3 Design system

- Accent: teal/green (#0E8A7D-ish). Neutral grays, white surfaces.
- Typography: modern sans-serif; clear hierarchy (display / title / body / caption).
- Corners: large radius on cards/buttons; soft shadows.
- Components: `ListingCard`, `PhotoUploader`, `PhotoGallery/Lightbox`, `FilterSheet`, `FilterChips`, `MapView`, `AmenityIcon`, `RuleChip`, `ConversationListItem`, `MessageBubble`, `ReportSheet`, `BlockButton`, `ConfirmDialog`, `PaywallSheet`, `Badge` (individual/company/verified), `EmptyState`, `Skeleton`, `Toast`, `Banner`.
- Every list screen must implement loading (skeleton), empty, and error (retry) states.
- **Accessibility**: min 44pt tap targets, dynamic type support, image alt text, sufficient contrast.

### 2.4 Privacy & safety (global rules)

- No phone numbers or emails rendered anywhere in the UI.
- Exact address never shown; only neighborhood + an approximate map circle.
- **Contact-info detection.** Scan listing text and messages for phone/email/URLs/social handles → mask + flag for moderation. Enforced **server-side**; client-side warning is a UX bonus.
- All comms in-app; block, delete message, report available wherever relevant.
- **Fair-housing**: rule/amenity options are property facts only (no tenant-demographic preferences).

### 2.5 Non-functional requirements

- Cold start <3 s on a mid-range device; feed first paint <1.5 s after data.
- Images lazy-loaded, compressed (max 1080 px long edge), cached.
- Offline: cached feed viewable; actions queue or show offline banner.
- All writes protected by RLS; secrets server-side only.
- Crash-free sessions >99.5%; Sentry on all releases.

### 2.6 Engineering principles (enforced)

1. **No network blocking on the UI thread.** Cache-first render, Realtime over polling, optimistic UI.
2. **Security-first.** RLS on every table; server-computed amounts/state; JWT-pinned Edge Functions.
3. **Speed everywhere.** Performance budgets enforced in CI (`docs/perf-budgets.md`).
4. **No deprecated tools.** Every dep version-verified at install time; recorded in `docs/adr/0007-dependency-pins.md`.
5. **No guessing.** Web-search official docs (≤6 months) before adopting any API. Decisions captured in ADRs.
6. **All code tested and passing.** `pnpm gate` (typecheck + lint + unit + pgTAP + Deno test + migration apply + audit) blocks merge.
7. **Uniform code/test practice — no random rules.** One ESLint/TS/Prettier/Jest config. New rules require an ADR.
8. **600-line hard cap per file.** ESLint `max-lines`. Soft targets in `docs/adr/0003-file-size-cap.md`.
9. **Industry standards.** TS strict, Conventional Commits, trunk-based, PR review.
10. **MCP-first tooling.** Prefer MCP servers (Supabase, Cursor App/Backend Control, Datadog) over bespoke scripts.

The full text of the engineering rules lives in `AGENTS.md` and is mirrored into the always-applied Cursor rules.

---

## 3. Page-by-page PRD

Each page lists: purpose · user stories · layout · elements & validation · states · actions · edge cases · data/permissions.

### 3.1 Browse (Home) — default launch screen

- **Purpose.** Immediately show relevant local listings; no marketing wall.
- **User stories.**
  - As a visitor, I can browse listings without an account.
  - As a renter, I can filter by location, price, type, and amenities.
  - As a renter, I can save or open a listing.
- **Layout (top→bottom).** Top bar (location selector · search · "Log in" when signed-out). Filter chips row (Type, Price, Bath, More). List/Map toggle. Vertical feed of `ListingCard`s. Bottom tabs: Browse · Saved · ＋ · Messages · Me.
- **`ListingCard` elements.** Cover photo (16:9), ❤️ save toggle, price $X/mo, type · neighborhood, one-line facts (bath · key rule · available date). No address.
- **States.** Loading skeleton (3–4 cards), empty (`No listings in {city} yet — be the first to list.` + List CTA), error (`Couldn't load listings` + Retry). Signed-out tapping ❤️/Message → auth sheet.
- **Actions.** Open detail, toggle save (optimistic), change location, open filters, switch to map, tap ＋ → (auth if needed → create listing).
- **Edge cases.** Location permission denied → default to last city or manual picker; long titles truncate; deleted/expired listing removed live.
- **Data/permissions.** Read `listings` where `status='active'`, filtered by geo + filters; favorites for current user. Public read.

### 3.2 Location selector

- **Purpose.** Set the geographic context for browse/search.
- **Elements.** Search input (city/neighborhood/zip, geocoded), "Use my current location", recent locations list.
- **States.** Permission denied → manual entry only; no results → "Try a different place."
- **Actions.** Select → updates feed; persists as default.
- **Data.** Geocode via Maps; store lat/lng + label locally.

### 3.3 Search & Filter sheet

- **Purpose.** Narrow listings.
- **Filters.** Property type (multi-select: single bedroom, shared bedroom, basement, full house/apartment, extra house); price range (min/max slider); bath (own/shared/any); furnished (yes/any); pets (allowed/any); availability (date on/after); distance radius.
- **Sort.** Newest (default), Price ↑, Price ↓.
- **Layout.** Bottom sheet; "Reset" + "Show X results" (live count).
- **Validation.** Min ≤ max price; sensible defaults.
- **States.** "Show 0 results" disabled state prompts loosening filters.
- **Data.** Parameterized query on `listings`.

### 3.4 Listing detail (renter view)

- **Purpose.** Present everything to evaluate + contact.
- **User stories.** View all photos; understand price/rules/area; message host; save; report.
- **Layout.** Photo gallery (swipeable ≤8, dots, tap→lightbox). Overlay: back, ❤️, share. Price $X/month; type · neighborhood; availability + min stay. Hosted-by mini-card (avatar, name, individual/company badge, verified ✓; no contact info). Amenities/rules grid (own/shared bath, no smoking, pets, furnished, utilities, parking, laundry). Description (contact-info masked). Area: map with shaded circle + neighborhood label (no pin/address). View count. Report listing link. Sticky bottom CTA: Message host.
- **States.** Loading skeleton; image load placeholders; expired/removed → "This listing is no longer available."; own listing → CTA becomes "Edit listing".
- **Actions.** Save (auth-gated), share (deep link), message (auth-gated → opens/creates conversation seeded with listing context), report (sheet with reasons), open host profile.
- **Edge cases.** Blocked host → can't message (explain); single photo (hide dots); long description (expand/collapse).
- **Data/permissions.** Read `listings + listing_photos + listing_rules`; increment views (deduped per user/session via Edge Function); favorites toggle.

### 3.5 Create / Edit listing (multi-step wizard)

- **Purpose.** Create a complete, compliant listing; save drafts.
- **User stories.** Add photos easily; set price/rules; preview; pay & publish; edit later without re-paying (if active).
- **Steps & validation.**
  1. **Property type** (single-select, required).
  2. **Photos** — up to 8; camera/library; reorder; set cover (first = default); auto-compress (≤1080 px, q=0.8). Required: ≥1. Enforce max 8.
  3. **Location** — address autocomplete → geocode; store exact privately, show area publicly. Required. Helper: "Renters only see the general area."
  4. **Price & terms** — rent/month (required, numeric > 0, sane bounds), deposit (optional), available-from date (required, today or later), minimum stay (1–12 mo, default 1).
  5. **Rules & amenities** — toggles (own bath, shared bath, no smoking, pets allowed, furnished, utilities included, parking, laundry). Optional. Facts only.
  6. **Title & description** — title (required, ≤60 chars), description (required, ≥20 chars; contact-info detection warns/masks).
  7. **Review & publish** — summary preview; account type (Individual/Company → company name + logo required if company); → Continue to payment.
- **Behavior.** Progress indicator (Step n/7); back/next; auto-save draft after each step. Edit mode pre-fills; editing an **active** listing saves without charging; editing a draft/expired routes through payment to publish.
- **States.** Upload progress per photo; geocode failure → manual map pin; validation errors inline; "Save & exit" keeps draft.
- **Edge cases.** Lose connection mid-upload → retry that photo; exceeding tier triggers correct price at payment; company logo required iff company.
- **Data/permissions.** Write `listings` (status `draft`), `listing_photos`, `listing_rules`; owner-only RLS. Photos in Supabase Storage (owner-scoped path).

### 3.6 Payment (pay to publish / renew)

- **Purpose.** Collect listing fee, publish on success.
- **User stories.** See correct price; pay with card/Apple Pay/Google Pay; get receipt; know it won't auto-renew.
- **Pricing logic (server-determined).**
  - 0 active properties → this listing = **$9.99**/mo.
  - ≥1 active property → this additional listing falls under the **$17.99**/mo flat bucket covering all extras.
  - Re-list of an expired listing = **$9.99**.
  - Tax added per Stripe Tax.
- **Layout.** Mini listing preview · plan line (auto-selected, explained) · summary (subtotal, tax, total) · Stripe PaymentSheet (card + wallets) · "Pay & publish" · fine print: "Auto-expires in 30 days. We never auto-charge; you'll be asked to renew."
- **Flow.** Create PaymentIntent (Edge Function, amount **server-computed**) → PaymentSheet → on success, Stripe webhook → Edge Function flips listing to `active`, sets `expires_at = now + 30d`, writes `payments`, sends receipt (Resend) → confirmation screen.
- **States.** Processing; success (→ listing live); failure/cancel (retry, no publish); network error.
- **Edge cases.** Webhook lag → show "finalizing" then confirm; duplicate-tap guarded; refund/chargeback → listing auto-unpublished + flag (admin).
- **Compliance (open).** Confirm App Store / Play allow external (Stripe) payment for this listing service; if rejected, fallback plan needed. See `docs/OPEN_QUESTIONS.md`.

### 3.7 Messages — Conversation list

- **Purpose.** Entry to all chats.
- **Layout.** List of `ConversationListItem`: other party avatar, name, last-message snippet, timestamp, unread badge, small listing thumbnail.
- **States.** Loading skeleton; empty ("No messages yet — start by contacting a host."); error/retry.
- **Actions.** Open thread; swipe → mute/block/report (secondary).
- **Data.** `conversations` where current user is a participant; ordered by last message; respects blocks.

### 3.8 Messages — Chat thread (Realtime)

- **Purpose.** In-app conversation between renter and host about a listing.
- **User stories.** Message about a listing; delete a message; block/report; get notified.
- **Layout.** Header (other party name + badge, ⋯ menu) · pinned listing-context card (thumbnail, price, title → tap to detail) · message bubbles (mine right/teal, theirs left/gray, timestamps, read/delivered) · composer (text input, send). Per-message action (long-press): "Delete for everyone" → replaced with "Message deleted" placeholder. ⋯ menu: Block user, Report user, Mute, View listing.
- **Behavior.**
  - Realtime via Supabase subscription on `messages`, filtered by `conversation_id`.
  - **Contact-info detection in composer**: phone/email/URL → masked + flagged (soft warning: "For your safety, keep contact in the app"). Server-side enforcement also.
  - Push + email notification to recipient on new message (respecting prefs).
- **States.** Sending/queued (optimistic); failed → retry; blocked (composer disabled, "You can't message this user"); other party deleted account ("This user is no longer available").
- **Edge cases.** Both delete → thread empty but exists; report opens reason sheet, attaches thread to `reports`; mute silences notifications only.
- **Data/permissions.** `messages` readable/writable only by the two participants (RLS); blocked relationship prevents insert; `deleted_at` soft-delete.

### 3.9 Saved

- **Purpose.** Renter's shortlist.
- **Layout.** Grid/list of saved `ListingCard`s; remove (un-heart).
- **States.** Empty ("Tap the heart on a listing to save it here."); loading; error.
- **Actions.** Open detail; remove; if a saved listing expired → badge "No longer available."
- **Data.** `favorites` join `listings`.

### 3.10 Profile — own (Me tab)

- **Purpose.** Hub for the user's activity + settings entry.
- **Layout.** Avatar (+edit) · name · member-since · verified ✓ · account-type indicator.
- **Menu (adaptive based on `count(listings owned)`).**
  - **0 listings → Renter menu**: Saved · Messages · Settings + prominent **"List your place"** CTA. No Billing, no Account type.
  - **≥1 listing → Host menu**: adds My Listings · Billing & payments · Account type/company; keeps Saved + Messages.
  - Switch is automatic the moment a user publishes their first listing.
- **Actions.** Navigate; edit avatar/name; log out; delete account (confirm + consequences).
- **Data.** `profiles` (self).

### 3.11 Profile — public (another host)

- **Purpose.** Trust + see host's other listings.
- **Layout.** Avatar · name · verified ✓ · company name/logo (if company) · member-since · listings by host grid. Header ⋯ → Report / Block.
- **Rules.** No contact info; only trust signals + active listings.
- **Actions.** Open listing; report; block (hides their listings from me + prevents contact).
- **Data.** `profiles` (public-safe fields) + their listings where `active`.

### 3.12 My Listings (host management)

- **Purpose.** Manage all of a host's properties.
- **Layout.** Tabs Active / Expired / Rented; per row: thumbnail, title, price, status, views · saves · inquiries, days left, actions: Edit · Renew ($9.99) · Mark rented · Pause · Delete.
- **States.** Empty ("You haven't listed anything yet.") + Create CTA; expiring-soon banner (≤3 days).
- **Actions.** Edit (→ wizard), renew (→ payment), mark rented (confirm), pause/unpause, delete (confirm).
- **Edge cases.** Renewing an expired listing reactivates 30 days; deleting removes from feed + cancels nothing financial.
- **Data.** `listings` owner-scoped + aggregate stats.

### 3.13 Billing & payments

- **Purpose.** Transparency on charges.
- **Layout.** Payment history (date, listing, amount, status), receipts/invoices (Stripe), saved payment method (managed by Stripe).
- **Actions.** View receipt; update payment method (Stripe).
- **Data.** `payments` owner-scoped.

### 3.14 Settings

- **Sections.**
  - **Account & password** (shared): change email (re-verify), change/set password, manage linked providers.
  - **Notifications** (shared): toggles for push + email per type (new message, listing expiring, payment receipt, marketing opt-in default off).
  - **Blocked users** (shared): list + unblock.
  - **Account type** (host-only): switch individual/company (company → business name/logo).
  - **Billing & payments** (host-only).
  - **Legal/support** (shared): Terms, Privacy, Help/FAQ, Contact.
  - **Danger zone** (shared): delete account (irreversible; removes listings, anonymizes messages).
- **Global rule.** Host-only items render only when `count(listings owned) > 0`.
- **Data.** `profiles`, notification prefs, blocks.

### 3.15 Auth screens (signup / login / verify / reset)

- **Sign up.** Social buttons + "Continue with email" → Name/Email/Password; inline "by continuing you agree…"; → verify email.
- **Log in.** Social + "Continue with email" → Email/Password; "Forgot password?"; email-account detection for cross-platform recovery (magic link/OTP).
- **Verify email.** "Check your inbox" + resend (rate-limited) + deep-link handling.
- **Reset password.** Request (email) → deep link → set new password.
- **States.** Invalid credentials (generic error to avoid enumeration), unverified (banner + resend), rate-limited (cooldown message).
- **Data.** Supabase Auth + `profiles` row created on first login.

### 3.16 Admin web (Next.js)

- **Purpose.** Keep the marketplace safe; observe revenue and supply.
- **Features.**
  - Reports queue (user/listing/message) with context → actions: dismiss, warn, remove listing, suspend, ban.
  - Flagged contact-info review.
  - User & listing search.
  - Metrics: signups, active listings (by state/city), revenue, reports.
  - Audit log of moderator actions (`audit_log` table, append-only RLS).
- **Access.** Internal roles only (`role ∈ {admin, moderator}` custom claim). Service-role Supabase client only in Route Handlers / Server Actions.
- **Stack.** Next.js App Router, `@supabase/ssr`, shadcn/ui, TanStack Table, Lucide.

---

## 4. Data model (Postgres / Supabase, all RLS-protected)

- `profiles(id→auth.users, display_name, avatar_url, account_type[individual|company], company_name, company_logo, is_verified, created_at)`
- `listings(id, owner_id, type, title, description, price, deposit, available_from, min_months, lat, lng, area_label, status[draft|active|expired|rented|paused], views, expires_at, created_at, updated_at)`
- `listing_photos(id, listing_id, storage_path, sort_order, is_cover)` — max 8 (DB constraint/trigger)
- `listing_rules(listing_id, rule_key, value)` — or boolean columns (preferred)
- `favorites(user_id, listing_id, created_at)` — PK(user_id, listing_id)
- `conversations(id, listing_id, last_message_at, created_at)` + `conversation_participants(conversation_id, user_id)` join table (composite PK)
- `conversation_hidden(user_id, conversation_id)` — soft-hide for "delete chat"
- `messages(id, conversation_id, sender_id, body, flagged, deleted_at, created_at)` — Realtime on
- `blocks(blocker_id, blocked_id, created_at)` — PK; `CHECK (blocker_id <> blocked_id)`
- `reports(id, reporter_id, target_type[user|listing|message], target_id, reason, status[open|actioned|dismissed], created_at)` — `UNIQUE(reporter_id, target_type, target_id)`
- `payments(id, user_id, listing_id, amount, currency, type[single|multi|renew], stripe_payment_intent, status, created_at)`
- `webhook_events(provider, event_id PK)` — idempotency keys
- `audit_log(id, actor_id, action, target_type, target_id, before jsonb, after jsonb, created_at)` — append-only

### Key RLS

- `profiles` self-write; public-read-safe via SECURITY DEFINER RPC that filters by blocks.
- `listings` owner-write, public-read only when `active` and not blocked.
- `photos`/`rules` follow listing ownership.
- `favorites` self-only.
- `messages` readable/writable only by the two participants and not if blocked; DELETE scoped to `sender_id = auth.uid()` (soft-delete-for-self via RPC).
- `reports` insert by any authed user, read by admins.
- `payments` self-read, server-write only.

---

## 5. Notifications

| Event                       | Push | Email                          |
| --------------------------- | ---- | ------------------------------ |
| New message                 | ✓    | ✓ (if unread after delay)      |
| Listing published           | ✓    | ✓ (receipt)                    |
| Listing expiring (T-3d)     | ✓    | ✓                              |
| Listing expired             | ✓    | ✓                              |
| Payment receipt             | —    | ✓                              |
| Report actioned (reporter)  | opt  | opt                            |
| Email verification / reset  | —    | ✓                              |

All respect user prefs; transactional emails (verify, reset, receipt) always sent.

---

## 6. Build phases (delivery plan)

See `AGENTS.md` §10 for slice exit criteria.

1. **Foundations** — Expo + Supabase + admin scaffolds, Auth (Apple/Google/Email), tab nav, design system, all governance + CI.
2. **Listings** — wizard, photo upload/storage, detail screen.
3. **Browse/Search** — feed, filters, map, location, saved.
4. **Payments** — Stripe, tier logic, expiry/renew, webhooks, receipts.
5. **Messaging** — Realtime chat, block/delete/report, notifications, contact-info detection.
6. **Profiles, settings, billing.**
7. **Admin/moderation + legal + analytics.**
8. **Hardening** — RLS review, empty/error states, accessibility, tests, EAS build → store submit → launch one city.
9. **Phase 2** — Agora voice/video, reviews/ratings, featured/boosted listings.

---

## 7. Open items requiring a human

See `docs/OPEN_QUESTIONS.md` for the live list. Highlights:

- Stripe account + tax + entity; verify App Store / Play payment policy for listing fees.
- Apple ($99/yr) + Google ($25) developer accounts.
- Terms/Privacy legal review + fair-housing ad compliance.
- Domain + Resend sending-domain DNS.
- RLS policy security review pre-launch.
- Seed first city (recruit initial hosts).
- Final brand name + logo + accent color.
