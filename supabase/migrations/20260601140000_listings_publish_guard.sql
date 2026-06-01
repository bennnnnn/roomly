-- 20260601140000_listings_publish_guard.sql
-- Purpose: block client-side draft→active; allow anon signed URLs for active listings.
-- PRD: §4 (pay-to-publish in Slice 4); §3.1 visitor browse.
-- Rollback: restore prior owner-update and drop anon storage policy.

-- Owners may update drafts but cannot self-activate (Slice 4 Edge Function / RPC only).
drop policy if exists "listings: owner update" on public.listings;

create policy "listings: owner update"
  on public.listings for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (
      status <> 'active'::public.listing_status
      or exists (
        select 1
        from public.listings old_row
        where old_row.id = listings.id
          and old_row.status = 'active'::public.listing_status
      )
    )
  );

-- Visitors need storage SELECT to create signed URLs for active listing photos.
create policy "listing_photos_storage: anon read via active listing"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1
      from public.listing_photos lp
      join public.listings l on l.id = lp.listing_id
      where lp.storage_path = name
        and l.status = 'active'::public.listing_status
    )
  );
