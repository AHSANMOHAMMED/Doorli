"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

export default function GlobalOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, avgProcessing: '—', alerts: 0 });
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      const res = await superAdminFetch('/admin/orders');
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        const pending = res.data.filter((o: any) => o.status === 'pending').length;
        const alerts = res.data.filter((o: any) => o.status === 'failed' || o.status === 'cancelled').length;
        setStats({ total: res.data.length, pending, avgProcessing: '—', alerts });
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      <header className="fixed top-0 w-full z-50 bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
        <div className="flex items-center gap-md">
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">Global Orders Feed</h1>
        </div>
        <div className="flex items-center gap-md">
          <span className="px-3 py-1 bg-tertiary/20 text-tertiary rounded-full text-caption border border-tertiary/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span> Live
          </span>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        <main className="flex-1 px-4 md:px-8 py-8 overflow-y-auto mb-20 md:mb-0">
          <div className="max-w-container-max mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-md">
              <div>
                <p className="text-primary font-label-medium uppercase tracking-widest mb-xs">System Oversight</p>
                <h2 className="font-screen-title text-screen-title text-on-surface">Global Orders Feed</h2>
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-sm bg-surface-container p-sm rounded-xl border border-outline-variant">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-label-medium transition-colors ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>All Orders</button>
              <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-label-medium transition-colors ${filter === 'pending' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>Processing</button>
              <button onClick={() => setFilter('delivered')} className={`px-4 py-2 rounded-lg font-label-medium transition-colors ${filter === 'delivered' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>Delivered</button>
              <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg font-label-medium transition-colors ${filter === 'cancelled' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>Cancelled</button>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                <p className="text-caption text-on-surface-variant">Total Orders</p>
                <h4 className="font-kpi-number text-kpi-number text-on-surface">{stats.total}</h4>
              </div>
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                <p className="text-caption text-on-surface-variant">Pending Sync</p>
                <h4 className="font-kpi-number text-kpi-number text-secondary">{stats.pending}</h4>
              </div>
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                <p className="text-caption text-on-surface-variant">Avg. Processing</p>
                <h4 className="font-kpi-number text-kpi-number text-on-surface">{stats.avgProcessing}</h4>
              </div>
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant">
                <p className="text-caption text-on-surface-variant">Risk Alerts</p>
                <h4 className="font-kpi-number text-kpi-number text-error">{stats.alerts}</h4>
              </div>
            </section>

            <section className="space-y-sm">
              <div className="hidden md:grid grid-cols-12 px-md py-sm bg-surface-container rounded-t-lg border-x border-t border-outline-variant text-caption text-on-surface-variant uppercase tracking-wider font-bold">
                <div className="col-span-2">Order ID</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Vendor / Customer</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant">No orders found</div>
                ) : (
                  filtered.map((order) => (
                    <div key={order.id} className={`grid grid-cols-1 md:grid-cols-12 items-center px-md py-md md:py-sm bg-surface-container-low border rounded-xl transition-all duration-200 cursor-pointer ${order.status === 'cancelled' ? 'border-l-4 border-l-error border-outline-variant' : 'border-outline-variant'}`}>
                      <div className="col-span-2 flex items-center gap-sm">
                        <span className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-error' : order.status === 'delivered' ? 'bg-tertiary' : 'bg-secondary'} animate-pulse`}></span>
                        <span className="font-bold text-on-surface uppercase">{order.orderNumber || order.id?.substring(0, 8)}</span>
                      </div>
                      <div className="col-span-2 py-2 md:py-0">
                        <span className={`px-3 py-1 text-caption rounded-full flex items-center w-fit gap-1 ${
                          order.status === 'delivered' ? 'bg-tertiary/10 text-tertiary' :
                          order.status === 'cancelled' ? 'bg-error-container text-on-error-container' :
                          'bg-secondary-container text-on-secondary-container'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {order.status === 'delivered' ? 'check_circle' : order.status === 'cancelled' ? 'report' : 'local_shipping'}
                          </span>
                          {order.status}
                        </span>
                      </div>
                      <div className="col-span-3 flex flex-col">
                        <span className="text-on-surface font-medium">{order.vendor?.businessName || 'Unknown Vendor'}</span>
                        <span className="text-caption text-on-surface-variant">{order.customer?.fullName || 'Customer'}</span>
                      </div>
                      <div className="col-span-2 py-2 md:py-0">
                        <span className="font-bold text-on-surface">${Number(order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="flex items-center gap-1 text-on-surface-variant text-caption bg-surface-container px-2 py-1 rounded-md w-fit">
                          <span className="material-symbols-outlined text-[14px]">{order.erpOrderId ? 'cloud_sync' : 'lan'}</span>
                          {order.erpOrderId ? 'ERP Integrated' : 'Local Network'}
                        </span>
                      </div>
                      <div className="col-span-1 text-right flex justify-end gap-sm">
                        <button className="p-1 hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
