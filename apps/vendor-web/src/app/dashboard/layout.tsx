'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  Wrench,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Store,
  Users,
  Truck,
  BarChart3,
} from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const role = profile?.role ?? 'vendor';

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['vendor', 'admin', 'driver'] },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag, roles: ['vendor', 'admin'] },
    { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['vendor', 'admin'] },
    { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar, roles: ['vendor', 'admin'] },
    { href: '/dashboard/service-requests', label: 'Service Requests', icon: Wrench, roles: ['vendor', 'admin'] },
    { href: '/dashboard/reviews', label: 'Reviews', icon: Star, roles: ['vendor', 'admin'] },
    { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck, roles: ['driver', 'admin'] },
    { href: '/dashboard/vendors', label: 'Vendors', icon: Store, roles: ['admin'] },
    { href: '/dashboard/users', label: 'Users', icon: Users, roles: ['admin'] },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['vendor', 'admin'] },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['vendor', 'admin', 'driver'] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            Doorli
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
