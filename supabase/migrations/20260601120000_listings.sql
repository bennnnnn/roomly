-- 20260601120000_listings.sql
-- Purpose: listings core schema (Slice 2 — no payments).
-- PRD: §4 data model, §3.5 wizard, §3.1 browse.
-- Rollback: drop in reverse order (destructive — dev only).

-- ============================================================================
-- Enums
-- ============================================================================

create type public.listing_type as enum (
  'single_bedroom',
  'shared_bedroom',
  'basement',
  'full_unit',
  'extra_house'
);

create type public.listing_status as enum (
  'draft',
  'active',
  'expired',
  'rented',
  'paused'
);

-- ============================================================================
-- listings
-- ============================================================================

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type public.listing_type not null,
  title text not null check (char_length(title) between 1 and 60),
  description text not null check (char_length(description) >= 20),
  price_cents integer not null check (price_cents > 0 and price_cents <= 5000000),
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  available_from date not null,
  min_months smallint not null default 1 check (min_months between 1 and 12),
  -- Public area (exact address lives in listing_private_location).
  area_label text not null check (char_length(area_label) between 1 and 120),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  status public.listing_status not null default 'draft',
  view_count integer not null default 0 check (view_count >= 0),
  expires_at timestamptz,
  -- Rules & amenities (boolean columns per PRD §4).
  has_own_bath boolean not null default false,
  has_shared_bath boolean not null default false,
  no_smoking boolean not null default false,
  pets_allowed boolean not null default false,
  furnished boolean not null default false,
  utilities_included boolean not null default false,
  has_parking boolean not null default false,
  has_laundry boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_owner_id_idx on public.listings (owner_id);
create index listings_status_created_idx on public.listings (status, created_at desc);
create index listings_active_geo_idx on public.listings (lat, lng)
  where status = 'active';

alter table public.listings enable row level security;

-- Owner: full CRUD on own rows (any status).
create policy "listings: owner select"
  on public.listings for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "listings: owner insert"
  on public.listings for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "listings: owner update"
  on public.listings for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "listings: owner delete"
  on public.listings for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- Public read: active only, block-aware for signed-in users; anon can browse.
create policy "listings: public read active"
  on public.listings for select
  to anon, authenticated
  using (
    status = 'active'
    and (
      (select auth.uid()) is null
      or not public.is_blocked_between(owner_id, (select auth.uid()))
    )
  );

-- ============================================================================
-- listing_private_location — exact address, owner-only (not in public API)
-- ============================================================================

create table public.listing_private_location (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  address_line text not null check (char_length(address_line) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_private_location enable row level security;

create policy "listing_private_location: owner all"
  on public.listing_private_location for all
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- listing_photos (max 8 enforced by trigger)
-- ============================================================================

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  sort_order smallint not null default 0 check (sort_order >= 0 and sort_order < 8),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index listing_photos_listing_id_idx on public.listing_photos (listing_id, sort_order);

alter table public.listing_photos enable row level security;

create policy "listing_photos: public read via active listing"
  on public.listing_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
        and (
          (select auth.uid()) is null
          or not public.is_blocked_between(l.owner_id, (select auth.uid()))
        )
    )
  );

create policy "listing_photos: owner read own"
  on public.listing_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

create policy "listing_photos: owner insert"
  on public.listing_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

create policy "listing_photos: owner update"
  on public.listing_photos for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

create policy "listing_photos: owner delete"
  on public.listing_photos for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = (select auth.uid())
    )
  );

create or replace function public.enforce_listing_photo_max_eight()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.listing_photos where listing_id = new.listing_id) >= 8 then
    raise exception 'listing may have at most 8 photos';
  end if;
  return new;
end;
$$;

create trigger listing_photos_max_eight
  before insert on public.listing_photos
  for each row execute function public.enforce_listing_photo_max_eight();

-- ============================================================================
-- favorites
-- ============================================================================

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_id_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

create policy "favorites: self select"
  on public.favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "favorites: self insert"
  on public.favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "favorites: self delete"
  on public.favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create trigger listing_private_location_set_updated_at
  before update on public.listing_private_location
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Storage: listing-photos bucket (private; signed URLs from client)
-- Path convention: {owner_id}/{listing_id}/{photo_id}.jpg
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "listing_photos_storage: owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "listing_photos_storage: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "listing_photos_storage: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "listing_photos_storage: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Authenticated users may read objects for active listings they can see.
create policy "listing_photos_storage: read via active listing"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1
      from public.listing_photos lp
      join public.listings l on l.id = lp.listing_id
      where lp.storage_path = name
        and l.status = 'active'
        and not public.is_blocked_between(l.owner_id, (select auth.uid()))
    )
  );
