import { createServiceClient } from '../lib/supabase/service';

import { FlaggedMessageActions } from './FlaggedMessageActions';

interface FlaggedRow {
  id: string;
  body: string;
  created_at: string;
  conversation_id: string;
}

export async function FlaggedMessagesPanel() {
  const svc = createServiceClient();
  const { data } = await svc
    .from('messages')
    .select('id, body, created_at, conversation_id')
    .eq('flagged', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = (data ?? []) as FlaggedRow[];

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold">Flagged messages</h2>
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="text-neutral-500">{new Date(row.created_at).toLocaleString()}</p>
            <p className="mt-1 text-neutral-900">{row.body}</p>
            <p className="mt-1 font-mono text-xs text-neutral-400">{row.conversation_id}</p>
            <FlaggedMessageActions messageId={row.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
