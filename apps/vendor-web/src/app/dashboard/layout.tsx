'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Calendar, Wrench, Star, Settings, LogOut, Menu, X, Bell, Store, Truck, ChartBar as BarChart3, FileUp } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  group: string;
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['vendor', 'admin', 'driver'], group: 'Today' },
  { href: '/dashboard/pos', label: 'Cashier / POS', icon: Store, roles: ['vendor', 'admin'], group: 'Today' },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag, roles: ['vendor', 'admin'], group: 'Today' },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: Package, roles: ['vendor', 'admin'], group: 'Today' },
  { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck, roles: ['driver', 'admin'], group: 'Today' },

  { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['vendor', 'admin'], group: 'Catalogue' },
  { href: '/dashboard/purchases', label: 'Purchases', icon: FileUp, roles: ['vendor', 'admin'], group: 'Catalogue' },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar, roles: ['vendor', 'admin'], group: 'Catalogue' },
  { href: '/dashboard/service-requests', label: 'Service Requests', icon: Wrench, roles: ['vendor', 'admin'], group: 'Catalogue' },

  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['vendor', 'admin'], group: 'Insights' },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star, roles: ['vendor', 'admin'], group: 'Insights' },

  // Platform vendors/users live only in Doorli Super Admin (apps/admin at /admin).
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['vendor', 'admin', 'driver'], group: 'Manage' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="doorli-console flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#378add]" />
      </div>
    );
  }

  if (!user) return null;

  const role = profile?.role ?? 'vendor';
  const items = NAV.filter((item) => item.roles.includes(role));
  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="doorli-console flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.07] bg-[#050a19]/95 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 lg:bg-transparent ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#185fa5] to-[#1d9e75] font-display text-base font-bold text-white shadow-lg">
              D
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">Doorli</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5 text-doorli-muted" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {Object.entries(groups).map(([group, groupItems]) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-doorli-dim">
                {group}
              </p>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-white/[0.09] text-white'
                          : 'text-doorli-muted hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#378add] to-[#1d9e75]" />
                      )}
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#5dcaa5]' : ''}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-doorli-muted transition-colors hover:bg-[rgba(242,102,139,0.12)] hover:text-[#f2668b]"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#060b1c]/70 px-4 backdrop-blur-xl lg:px-7">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-ml-2 flex min-h-11 min-w-11 items-center justify-center lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-doorli-muted" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors hover:bg-white/[0.09]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px] text-doorli-muted" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#f2668b] ring-2 ring-[#060b1c]" />
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] py-1.5 pl-1.5 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#185fa5] to-[#1d9e75] text-sm font-semibold text-white">
                {initial}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight text-white">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs capitalize leading-tight text-doorli-dim">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
