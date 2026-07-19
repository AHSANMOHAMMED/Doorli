'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

const VENDOR_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'] as const;

export default function OrderStatusUpdate({
  orderId,
  currentStatus,
  onUpdated,
}: {
  orderId: string;
  currentStatus: string;
  onUpdated?: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const prev = status;
    setStatus(newStatus);

    try {
      const res = await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to update status');
      }
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to update order status');
      setStatus(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      className={`px-3 py-1 rounded-md text-sm border font-medium ${loading ? 'opacity-50' : ''}`}
    >
      {VENDOR_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, ' ')}
        </option>
      ))}
      {!VENDOR_STATUSES.includes(status as (typeof VENDOR_STATUSES)[number]) && (
        <option value={status}>{status.replace(/_/g, ' ')}</option>
      )}
    </select>
  );
}
