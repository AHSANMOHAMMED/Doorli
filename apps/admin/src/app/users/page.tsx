'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users as UsersIcon } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { PageHeader, Badge, TableShell, EmptyState, Skeleton } from '@/components/ui';

type User = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const data = await adminFetch('/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  async function toggleActive(user: User) {
    setBusy(user.id);
    try {
      await adminFetch(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName, u.email, u.phone, u.role].filter(Boolean).some((f) => String(f).toLowerCase().includes(q)),
    );
  }, [users, query]);

  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Every Doorli account across customer, vendor, driver, and admin roles."
        actions={
          <>
            {Object.entries(byRole).map(([role, count]) => (
              <Badge key={role} tone="info">
                {count} {role}
              </Badge>
            ))}
          </>
        }
      />

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-doorli-dim" />
        <input
          className="input pl-10"
          placeholder="Search users…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={20} />}
          title={query ? 'No users match that search' : 'No users yet'}
          desc="Accounts appear here as people register on Doorli."
        />
      ) : (
        <TableShell
          head={
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-right">Action</th>
            </tr>
          }
        >
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>
                <p className="font-semibold text-white">{u.fullName || '—'}</p>
                <p className="font-mono text-[10px] text-doorli-dim">{u.id.slice(0, 8)}…</p>
              </td>
              <td>
                <p className="text-doorli-muted">{u.email || '—'}</p>
                <p className="text-xs text-doorli-dim">{u.phone || ''}</p>
              </td>
              <td>
                <Badge tone={u.role === 'admin' ? 'warning' : 'info'}>{u.role}</Badge>
              </td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                  <Badge tone={u.isVerified ? 'info' : 'neutral'}>{u.isVerified ? 'Verified' : 'Unverified'}</Badge>
                </div>
              </td>
              <td className="whitespace-nowrap text-xs text-doorli-dim">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="text-right">
                <button
                  type="button"
                  className={u.isActive ? 'btn btn-danger' : 'btn btn-accent'}
                  disabled={busy === u.id || u.role === 'admin'}
                  onClick={() => toggleActive(u)}
                  title={u.role === 'admin' ? 'Cannot disable admin accounts here' : undefined}
                >
                  {busy === u.id ? '…' : u.isActive ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </>
  );
}
