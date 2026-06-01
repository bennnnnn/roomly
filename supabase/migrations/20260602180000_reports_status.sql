-- 20260602180000_reports_status.sql
-- Purpose: moderation queue status on reports (PRD §4).
-- Rollback: drop column and type (dev only).

begin;

create type public.report_status as enum ('open', 'actioned', 'dismissed');

alter table public.reports
  add column status public.report_status not null default 'open';

create index reports_status_created_idx on public.reports (status, created_at desc);

comment on column public.reports.status is 'Moderation queue state; staff updates via service role.';

commit;
