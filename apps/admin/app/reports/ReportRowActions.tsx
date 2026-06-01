'use client';

import { useTransition } from 'react';

import { updateReportStatus } from '../moderation/actions';

export function ReportRowActions({ reportId, status }: { reportId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status !== 'open') {
    return <span className="text-xs text-neutral-500">{status}</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
        onClick={() => {
          startTransition(() => {
            void updateReportStatus(reportId, 'actioned');
          });
        }}
      >
        Actioned
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
        onClick={() => {
          startTransition(() => {
            void updateReportStatus(reportId, 'dismissed');
          });
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
