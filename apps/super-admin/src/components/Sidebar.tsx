'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Settings, Car, LogOut } from 'lucide-react';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/verifications', label: 'Verifications', icon: UserCheck },
  { href: '/drivers', label: 'Drivers', icon: Car },
  { href: '/settings', label: 'Platform Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  function logout() {
    localStorage.removeItem('doorli_admin_token');
    router.replace('/login');
  }

  return (
    <aside className="w-64 bg-slate-900 h-screen sticky top-0 text-slate-300 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Doorli Admin</h1>
        <p className="text-xs text-slate-500 mt-1">Unified Enterprise System</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                active ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
