'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';
import { Users, Search, UserCheck, UserX, Loader as Loader2, ShieldAlert, ShieldCheck, Mail, Phone } from 'lucide-react';

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'customer', label: 'Customers' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'driver', label: 'Drivers' },
  { value: 'admin', label: 'Admins' },
];

const ROLE_BADGE: Record<UserRole, string> = {
  customer: 'badge-info',
  vendor: 'badge-success',
  driver: 'badge-warning',
  admin: 'badge-error',
};

export default function UsersPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (authLoading || !profile) return;
    if (isAdmin) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function loadUsers() {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers((data ?? []) as Profile[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user: Profile) {
    setUpdatingId(user.id);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_active: !user.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  // Filtered users based on search + role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 mt-2">
          You do not have permission to access this page. Admin access required.
        </p>
        <Link href="/dashboard" className="btn-secondary mt-6 inline-flex items-center gap-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
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
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">
          Manage all users and their access on the platform
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input sm:w-48"
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {users.filter((u) => u.is_active).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {users.filter((u) => !u.is_active).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Verified</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {users.filter((u) => u.is_verified).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Name</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Phone</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Role</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Verified</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Joined</th>
                  <th className="px-6 py-3 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-blue-700">
                              {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-slate-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.email ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${ROLE_BADGE[user.role]} capitalize`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.is_verified ? 'badge-success' : 'badge-warning'}`}>
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={updatingId === user.id || user.id === profile?.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={
                            user.id === profile?.id
                              ? 'You cannot deactivate yourself'
                              : user.is_active
                                ? 'Deactivate user'
                                : 'Activate user'
                          }
                        >
                          {updatingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : user.is_active ? (
                            <>
                              <UserX className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
