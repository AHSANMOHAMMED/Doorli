'use client';

import { useEffect, useState } from 'react';
import { Car, Bike, Truck, Package, Wallet } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, StatCard, Badge, TableShell, EmptyState, Skeleton } from '@/components/ui';

type Driver = {
  id: string;
  vehicleType: string;
  vehicleNumber?: string | null;
  isOnline: boolean;
  totalDeliveries: number;
  earningsToday: number | string | null;
  user?: { fullName?: string; phone?: string };
};

function vehicleIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('bike') || t.includes('motor') || t.includes('scooter')) return <Bike size={15} />;
  if (t.includes('truck') || t.includes('van') || t.includes('lorry')) return <Truck size={15} />;
  return <Car size={15} />;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/admin/drivers')
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const online = drivers.filter((d) => d.isOnline).length;
  const deliveries = drivers.reduce((sum, d) => sum + (Number(d.totalDeliveries) || 0), 0);
  const earnings = drivers.reduce((sum, d) => sum + (Number(d.earningsToday) || 0), 0);

  return (
    <>
      <PageHeader title="Drivers" subtitle="Fleet availability, delivery volume, and today's earnings." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Online now" value={online} hint={`of ${drivers.length} drivers`} tone="teal" icon={<Car size={17} />} delay="doorli-rise" />
        <StatCard label="Total deliveries" value={deliveries.toLocaleString()} hint="All time" tone="blue" icon={<Package size={17} />} delay="doorli-rise-1" />
        <StatCard label="Earnings today" value={`LKR ${earnings.toLocaleString()}`} hint="Across the fleet" tone="gold" icon={<Wallet size={17} />} delay="doorli-rise-2" />
      </div>

      {error && (
        <p className="rounded-xl border border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] px-4 py-3 text-sm text-doorli-gold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState icon={<Car size={20} />} title="No drivers registered" desc="Drivers appear here once they sign up and complete onboarding." />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th className="text-right">Deliveries</th>
              <th className="text-right">Earnings today</th>
            </tr>
          }
        >
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>
                <p className="font-semibold text-white">{d.user?.fullName || 'Unnamed driver'}</p>
                <p className="text-xs text-doorli-dim">{d.user?.phone || '—'}</p>
              </td>
              <td>
                <span className="inline-flex items-center gap-2 capitalize text-doorli-muted">
                  <span className="text-doorli-dim">{vehicleIcon(d.vehicleType)}</span>
                  {d.vehicleType}
                  {d.vehicleNumber && <span className="text-doorli-dim">· {d.vehicleNumber}</span>}
                </span>
              </td>
              <td>
                <Badge tone={d.isOnline ? 'success' : 'neutral'}>{d.isOnline ? 'Online' : 'Offline'}</Badge>
              </td>
              <td className="text-right tabular-nums text-doorli-muted">{d.totalDeliveries}</td>
              <td className="text-right tabular-nums font-semibold text-white">
                LKR {Number(d.earningsToday || 0).toFixed(0)}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </>
  );
}
