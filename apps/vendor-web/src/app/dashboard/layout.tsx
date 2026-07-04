'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken, getToken } from '@/lib/api';
import { useEffect } from 'react';

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/settings', label: 'Shop Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-doorli-primary">Doorli Vendor</h1>
            <p className="text-xs text-slate-500">Everything Local. Delivered.</p>
          </div>
          <button
            className="text-sm text-slate-600 hover:text-red-600"
            onClick={() => {
              clearToken();
              router.push('/login');
            }}
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6 pb-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 px-4 py-3 text-sm font-medium ${
                pathname === item.href
                  ? 'border-doorli-primary text-doorli-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
