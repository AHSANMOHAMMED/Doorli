'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

type Driver = {
  id: string;
  vehicleType: string;
  vehicleNumber?: string | null;
  isOnline: boolean;
  totalDeliveries: number;
  earningsToday: number | string | null;
  user?: { fullName?: string; phone?: string };
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/admin/drivers')
      .then(setDrivers)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Drivers</h1>
      {error && <p className="text-amber-600 text-sm">{error}</p>}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Driver</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Online</th>
              <th className="p-4">Deliveries</th>
              <th className="p-4">Earnings today</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-4">
                  <div className="font-medium">{d.user?.fullName}</div>
                  <div className="text-xs text-slate-400">{d.user?.phone}</div>
                </td>
                <td className="p-4 capitalize">{d.vehicleType} {d.vehicleNumber || ''}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${d.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="p-4">{d.totalDeliveries}</td>
                <td className="p-4">LKR {Number(d.earningsToday).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
