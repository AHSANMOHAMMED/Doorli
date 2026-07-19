'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Loader as Loader2 } from 'lucide-react';

type UserRow = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'admin') {
      setError('Admin only');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await apiFetch<{ items?: UserRow[] } | UserRow[]>('/admin/users');
        const data = res.data;
        setUsers(Array.isArray(data) ? data : data?.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6" /> Users
      </h1>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{u.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error && (
          <div className="p-6 text-center text-slate-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
