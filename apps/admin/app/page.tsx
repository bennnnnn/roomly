export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Active listings</p>
          <p className="text-3xl font-bold text-neutral-900">—</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Open reports</p>
          <p className="text-3xl font-bold text-neutral-900">—</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Total users</p>
          <p className="text-3xl font-bold text-neutral-900">—</p>
        </div>
      </div>

      <p className="text-sm text-neutral-500">
        Connect a Supabase service-role client to populate live metrics.
      </p>
    </div>
  );
}
