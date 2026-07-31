'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Car,
  LogOut,
  Store,
  Building2,
  Menu,
  X,
  Activity,
  ShoppingBag,
  ToggleLeft,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: 'Today',
    items: [{ href: '/', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    label: 'Marketplace',
    items: [
      { href: '/vendors', label: 'Vendors', icon: Store },
      { href: '/verifications', label: 'Verifications', icon: UserCheck },
      { href: '/drivers', label: 'Drivers', icon: Car },
      { href: '/marketplace', label: 'Orders', icon: ShoppingBag },
      { href: '/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'ERP',
    items: [{ href: '/tenants', label: 'Tenants & Sync', icon: Building2 }],
  },
  {
    label: 'System',
    items: [
      { href: '/health', label: 'Health', icon: Activity },
      { href: '/features', label: 'Feature Flags', icon: ToggleLeft },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === '/login') return null;

  function logout() {
    localStorage.removeItem('doorli_admin_token');
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#185fa5] to-[#1d9e75] font-display text-lg font-extrabold text-white shadow-lg shadow-[#185fa5]/30">
          D
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight text-white">Doorli</p>
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-doorli-dim">Super Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-doorli-dim">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'bg-white/[0.09] text-white'
                        : 'text-doorli-muted hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#378add] to-[#1d9e75]" />
                    )}
                    <Icon size={18} className={active ? 'text-doorli-mint' : 'text-doorli-dim group-hover:text-white'} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-doorli-muted transition hover:bg-white/[0.05] hover:text-white"
        >
          <LogOut size={18} className="text-doorli-dim" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="glass-panel fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center text-white lg:hidden"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-white/[0.08] bg-[#070d20]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-lg text-doorli-muted hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.03] backdrop-blur-xl lg:flex">
        {nav}
      </aside>
    </>
  );
}
