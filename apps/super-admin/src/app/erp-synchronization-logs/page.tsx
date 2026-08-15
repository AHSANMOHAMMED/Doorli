"use client";

import React, { useEffect, useState } from 'react';
import { superAdminFetch } from '@/lib/api';

interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'in_progress';
  entityType: string;
  objectCount: number;
  region: string;
  error?: string;
}

export default function ERPSynchronizationLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ lastSync: '', totalObjects: 0, activeQueue: 0 });

  const fetchLogs = async () => {
    try {
      const res = await superAdminFetch('/admin/erp/sync-logs');
      if (res.success) {
        const rawLogs = Array.isArray(res.data) ? res.data : [];
        setLogs(rawLogs.map((l: any, i: number) => ({
          id: l.id || `log-${i}`,
          timestamp: l.createdAt || l.erpSyncedAt || l.updatedAt || new Date().toISOString(),
          status: l.erpSyncStatus === 'synced' ? 'success' : l.erpSyncStatus === 'failed' ? 'failed' : 'in_progress',
          entityType: l.vendor?.businessName || 'System',
          objectCount: Number(l.totalAmount || 0),
          region: l.vendor?.erpProvider || 'Global',
          error: l.erpSyncError || undefined,
        })));
        const successful = rawLogs.filter((l: any) => l.erpSyncStatus === 'synced');
        setStats({
          lastSync: successful[0]?.erpSyncedAt || successful[0]?.createdAt || 'N/A',
          totalObjects: rawLogs.reduce((sum: number, l: any) => sum + Number(l.totalAmount || 0), 0),
          activeQueue: rawLogs.filter((l: any) => ['pending', 'in_progress'].includes(l.erpSyncStatus)).length,
        });
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load sync logs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
        </svg>
        <span>Loading sync logs...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">
      <header className="fixed top-0 w-full z-50 bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant flex justify-between items-center px-margin-mobile h-16 w-full">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary cursor-pointer">grid_view</span>
          <h1 className="font-screen-title-mobile text-screen-title-mobile font-bold text-primary dark:text-primary">ERP Sync Logs</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-surface-container-high rounded-full px-4 py-1.5 border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-compact text-on-surface placeholder-muted w-48" placeholder="Filter entities..." type="text"/>
          </div>
        </div>
      </header>
      <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-lg">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bento-card p-md rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span> Last Successful Sync
              </span>
              <h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">{stats.lastSync || 'No data'}</h2>
            </div>
            <div className="mt-md flex items-center gap-2 text-tertiary text-caption font-caption">
              <span className="material-symbols-outlined text-[14px]">history</span> System healthy
            </div>
          </div>
          <div className="bento-card p-md rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">data_thresholding</span> Total Objects Today
              </span>
              <h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">{stats.totalObjects.toLocaleString()}</h2>
            </div>
          </div>
          <div className="bento-card p-md rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-label-medium font-label-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">reorder</span> Current Queue Status
              </span>
              <h2 className="text-kpi-number font-kpi-number text-on-surface mt-base">{stats.activeQueue} Active</h2>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <section className="bento-card rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="text-section-header font-section-header text-on-surface">Event Logs</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Timestamp</th>
                  <th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Entity Type</th>
                  <th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Object Count</th>
                  <th className="p-md font-caption text-caption text-on-surface-variant uppercase tracking-wider">Hub/Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-md text-center text-on-surface-variant">No sync logs available</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className={`hover:bg-surface-container-high transition-colors ${log.status === 'failed' ? 'bg-error-container/5' : ''}`}>
                      <td className="p-md font-body-compact text-body-compact text-on-surface">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-md">
                        <span className={`px-2 py-0.5 rounded-full text-caption font-caption inline-flex items-center gap-1 ${
                          log.status === 'success' ? 'bg-tertiary/20 text-tertiary' :
                          log.status === 'failed' ? 'bg-error/20 text-error' :
                          'bg-secondary/20 text-secondary animate-pulse'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {log.status === 'success' ? 'check_circle' : log.status === 'failed' ? 'error' : 'sync'}
                          </span>
                          {log.status === 'success' ? 'Success' : log.status === 'failed' ? 'Failed' : 'In Progress'}
                        </span>
                        {log.error && <p className="text-[10px] text-error mt-1 italic">{log.error}</p>}
                      </td>
                      <td className="p-md font-body-compact text-body-compact text-on-surface">{log.entityType}</td>
                      <td className="p-md font-body-compact text-body-compact text-on-surface">{log.objectCount.toLocaleString()}</td>
                      <td className="p-md font-body-compact text-body-compact text-on-surface">{log.region}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
