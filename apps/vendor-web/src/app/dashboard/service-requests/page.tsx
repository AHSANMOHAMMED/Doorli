'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { ServiceRequest, ServiceRequestStatus, Vendor, Profile } from '@/lib/types';
import { Wrench, Check, X, Loader as Loader2, Truck, Play, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface ServiceRequestWithCustomer extends ServiceRequest {
  profiles?: Pick<Profile, 'full_name' | 'phone'> | null;
}

type FilterTab = 'all' | ServiceRequestStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<ServiceRequestStatus, string> = {
  pending: 'badge-warning',
  accepted: 'badge-info',
  on_the_way: 'badge-info',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On the way',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ServiceRequestsPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<ServiceRequestWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadRequests() {
    setLoading(true);
    setError('');

    try {
      let vendorId: string | null = null;

      if (!isAdmin) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', profile!.id)
          .maybeSingle();

        if (vendorError) throw vendorError;
        if (!vendorData) {
          setError('No vendor profile found. Please complete onboarding first.');
          setLoading(false);
          return;
        }
        vendorId = (vendorData as Vendor).id;
        setVendor(vendorData as Vendor);
      }

      const selectColumns =
        '*, profiles!service_requests_user_id_fkey(full_name, phone)';

      const requestsQuery = supabase
        .from('service_requests')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (vendorId) {
        requestsQuery.eq('vendor_id', vendorId);
      }

      const { data, error: reqError } = await requestsQuery;

      if (reqError) throw reqError;
      setRequests((data ?? []) as unknown as ServiceRequestWithCustomer[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load service requests';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(requestId: string, status: ServiceRequestStatus) {
    setUpdatingId(requestId);
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'accepted') {
        updates.accepted_at = new Date().toISOString();
      }
      if (status === 'in_progress') {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', requestId);

      if (updateError) throw updateError;

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update request';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRequests =
    activeTab === 'all'
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const tabCounts = FILTER_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] =
        tab.key === 'all'
          ? requests.length
          : requests.filter((r) => r.status === tab.key).length;
      return acc;
    },
    {} as Record<FilterTab, number>,
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Requests</h1>
        <p className="text-slate-500 mt-1">
          {isAdmin ? 'All platform service requests' : vendor?.business_name ?? 'Manage your service requests'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Service requests table */}
      {filteredRequests.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No service requests found for this filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Service Type</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Description</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Address</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Scheduled</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Est. Amount</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const expanded = expandedId === request.id;
                  const scheduledDate = request.preferred_date;
                  const scheduledTime = request.preferred_time;
                  const estAmount = request.estimated_cost;
                  return (
                    <>
                      <tr
                        key={request.id}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : request.id)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {request.service_type}
                          {request.request_number && (
                            <span className="block text-xs text-slate-400">
                              #{request.request_number}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                          {request.description}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                          {request.address}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {scheduledDate
                            ? new Date(scheduledDate).toLocaleDateString()
                            : '—'}
                          {scheduledTime && (
                            <span className="block text-xs text-slate-400">
                              {String(scheduledTime).slice(0, 5)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {estAmount != null
                            ? `$${Number(estAmount).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${STATUS_BADGE[request.status]}`}>
                            {STATUS_LABEL[request.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${request.id}-detail`} className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Request details */}
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <DetailField
                                  label="Customer"
                                  value={request.profiles?.full_name ?? request.contact_name ?? 'Customer'}
                                />
                                <DetailField
                                  label="Contact Phone"
                                  value={request.contact_phone ?? '—'}
                                />
                                <DetailField
                                  label="Urgency"
                                  value={request.urgency ?? '—'}
                                />
                                <DetailField
                                  label="Final Amount"
                                  value={
                                    request.final_cost != null
                                      ? `$${Number(request.final_cost).toFixed(2)}`
                                      : '—'
                                  }
                                />
                              </div>

                              {/* Full description */}
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Full Description
                                </p>
                                <p className="mt-1 text-sm text-slate-900">
                                  {request.description}
                                </p>
                              </div>

                              {/* Full address */}
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                  <p className="text-sm text-slate-900">{request.address}</p>
                                  {request.city && (
                                    <p className="text-sm text-slate-500">{request.city}</p>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              {!isAdmin && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                  {request.status === 'pending' && (
                                    <button
                                      onClick={() => updateRequestStatus(request.id, 'accepted')}
                                      disabled={updatingId === request.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Accept
                                    </button>
                                  )}
                                  {request.status === 'accepted' && (
                                    <button
                                      onClick={() => updateRequestStatus(request.id, 'on_the_way')}
                                      disabled={updatingId === request.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Truck className="w-4 h-4" />
                                      )}
                                      On the way
                                    </button>
                                  )}
                                  {request.status === 'on_the_way' && (
                                    <button
                                      onClick={() => updateRequestStatus(request.id, 'in_progress')}
                                      disabled={updatingId === request.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Play className="w-4 h-4" />
                                      )}
                                      Start Work
                                    </button>
                                  )}
                                  {request.status === 'in_progress' && (
                                    <button
                                      onClick={() => updateRequestStatus(request.id, 'completed')}
                                      disabled={updatingId === request.id}
                                      className="btn-primary inline-flex items-center gap-2 text-sm"
                                    >
                                      {updatingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Mark Completed
                                    </button>
                                  )}
                                  {request.status !== 'cancelled' &&
                                    request.status !== 'completed' && (
                                      <button
                                        onClick={() => updateRequestStatus(request.id, 'cancelled')}
                                        disabled={updatingId === request.id}
                                        className="btn-secondary inline-flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                        Cancel
                                      </button>
                                    )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
