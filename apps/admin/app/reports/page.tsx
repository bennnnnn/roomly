import { createServiceClient } from '../../lib/supabase/service';
import { FlaggedMessagesPanel } from '../FlaggedMessages';

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  created_at: string;
  reporter_id: string;
}

export default async function ReportsPage() {
  const svc = createServiceClient();

  const { data, error } = await svc
    .from('reports')
    .select('id, target_type, target_id, reason, created_at, reporter_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Reports</h1>
        <p className="text-sm text-red-600">Could not load reports.</p>
      </div>
    );
  }

  const rows = (data ?? []) as unknown as ReportRow[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reports</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No reports yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Reporter</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{row.target_type}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.target_id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.reporter_id}</td>
                  <td className="px-4 py-2 max-w-md">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FlaggedMessagesPanel />
    </div>
  );
}
