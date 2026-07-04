import { getApiHealth } from '@/lib/api';

export default async function DashboardPage() {
  const health = await getApiHealth();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-doorli-primary">Doorli Vendor Dashboard</h1>
          <p className="mt-2 text-slate-600">Everything Local. Delivered.</p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Welcome, Vendor</h2>
          <p className="mt-2 text-slate-600">
            Order management, product listing, and analytics ship in Week 5–6.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Today&apos;s Orders" value="—" />
            <StatCard label="Revenue" value="—" />
            <StatCard label="Pending Actions" value="—" />
          </div>

          {health && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-700">API Status: {health.status}</p>
              <p className="text-slate-500">
                DB: {health.db ? 'connected' : 'disconnected'} · Redis:{' '}
                {health.redis ? 'connected' : 'disconnected'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
