'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Wrench, Check, Play, Loader as Loader2, MapPin } from 'lucide-react';

type ServiceRequest = {
  id: string;
  serviceType: string;
  title: string;
  description?: string | null;
  addressLine?: string | null;
  status: string;
  isUrgent?: boolean;
  offeredRate?: number | string | null;
  createdAt: string;
  customer?: { fullName?: string; phone?: string };
  latitude?: number | null;
  longitude?: number | null;
};

type FilterTab = 'all' | 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function ServiceRequestsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [nearby, setNearby] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    void load();
  }, [authLoading, profile]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const mine = await apiFetch<ServiceRequest[]>('/service-requests/my-jobs');
      setRequests(Array.isArray(mine.data) ? mine.data : []);

      const vendor = await apiFetch<{ latitude?: number; longitude?: number }>('/vendors/me');
      const lat = Number(vendor.data?.latitude ?? 6.9271);
      const lng = Number(vendor.data?.longitude ?? 79.8612);
      const near = await apiFetch<ServiceRequest[]>(
        `/service-requests/nearby?lat=${lat}&lng=${lng}&radius=15`,
      );
      setNearby(Array.isArray(near.data) ? near.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service requests');
    } finally {
      setLoading(false);
    }
  }

  async function act(id: string, action: 'accept' | 'start' | 'complete' | 'cancel') {
    setUpdatingId(id);
    try {
      const res = await apiFetch(`/service-requests/${id}/${action}`, { method: 'PATCH' });
      if (!res.success) throw new Error(res.error || 'Action failed');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered =
    activeTab === 'all' ? requests : requests.filter((r) => r.status === activeTab);

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading jobs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6" /> Service requests
        </h1>
        <p className="text-slate-500 mt-1">Accept nearby jobs and manage assigned work</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>}

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Nearby open jobs</h2>
        {nearby.length === 0 ? (
          <p className="text-sm text-slate-500">No open jobs nearby.</p>
        ) : (
          nearby.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
              <div>
                <div className="font-semibold">
                  {r.isUrgent ? '🚨 ' : ''}
                  {r.title}
                </div>
                <div className="text-sm text-slate-500 mt-1">{r.serviceType}</div>
                {r.addressLine && (
                  <div className="text-sm text-slate-600 mt-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {r.addressLine}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={updatingId === r.id}
                onClick={() => act(r.id, 'accept')}
                className="h-fit px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
              >
                Accept
              </button>
            </div>
          ))
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border rounded-lg bg-white">No assigned jobs.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-slate-500 mt-1 capitalize">{r.status.replace(/_/g, ' ')}</div>
                  {r.description && <p className="text-sm text-slate-600 mt-2">{r.description}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  {r.status === 'assigned' && (
                    <button
                      type="button"
                      disabled={updatingId === r.id}
                      onClick={() => act(r.id, 'start')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm"
                    >
                      <Play className="w-4 h-4" /> Start
                    </button>
                  )}
                  {(r.status === 'assigned' || r.status === 'in_progress') && (
                    <button
                      type="button"
                      disabled={updatingId === r.id}
                      onClick={() => act(r.id, 'complete')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                    >
                      <Check className="w-4 h-4" /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
