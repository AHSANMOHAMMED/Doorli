'use client';

import { useState } from 'react';

export default function OrderStatusUpdate({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setStatus(newStatus);
    
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
      setStatus(currentStatus); // revert on failure
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
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="preparing">Preparing</option>
      <option value="ready">Ready (for pickup)</option>
      <option value="picked_up">Picked Up</option>
      <option value="delivered">Delivered</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}
