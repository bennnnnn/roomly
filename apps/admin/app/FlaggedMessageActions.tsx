'use client';

import { useTransition } from 'react';

import { clearMessageFlag, deleteFlaggedMessage } from './moderation/actions';

export function FlaggedMessageActions({ messageId }: { messageId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        disabled={pending}
        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
        onClick={() => {
          startTransition(() => {
            void clearMessageFlag(messageId);
          });
        }}
      >
        Clear flag
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        onClick={() => {
          startTransition(() => {
            void deleteFlaggedMessage(messageId);
          });
        }}
      >
        Delete message
      </button>
    </div>
  );
}
