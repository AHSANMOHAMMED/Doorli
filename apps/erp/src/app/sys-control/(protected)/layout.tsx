import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  RefreshCw,
  ScrollText,
  Bug,
  Tags,
  MessageSquare,
  Bell,
  Settings,
  Mail,
  LogOut,
  Shield,
} from 'lucide-react'
import { AdminSessionTimer } from '@/components/admin/AdminSessionTimer'
import { ForceLightTheme } from '@/components/admin/ForceLightTheme'
import { validateAdminSession, getAdminFromSession } from '@/lib/admin'

const NAV = [
  { href: '/sys-control', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sys-control/users', label: 'Users', icon: Users },
  { href: '/sys-control/payments', label: 'Payments', icon: CreditCard },
  { href: '/sys-control/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { href: '/sys-control/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/sys-control/error-logs', label: 'Error Logs', icon: Bug },
  { href: '/sys-control/pricing', label: 'Pricing', icon: Tags },
  { href: '/sys-control/messages', label: 'Messages', icon: MessageSquare },
  { href: '/sys-control/notifications', label: 'Notifications', icon: Bell },
  { href: '/sys-control/settings', label: 'Settings', icon: Settings },
  { href: '/sys-control/send-email', label: 'Send Email', icon: Mail },
] as const

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await validateAdminSession()

  if (!session) {
    redirect('/sys-control/login')
  }

  const admin = await getAdminFromSession()

  return (
    <div className="sys-control-shell min-h-screen antialiased">
      <ForceLightTheme />

      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-[#1f2330] text-white">
          <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Admin Panel</p>
              <p className="text-[11px] text-slate-400">Doorli / RetailSmart</p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <p className="truncate text-xs text-slate-400">{admin?.email}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <AdminSessionTimer />
              <form action="/api/sys-control/auth/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="sys-control-main flex min-w-0 flex-1 flex-col">
          <header className="sys-control-header sticky top-0 z-10 px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Platform Administration</p>
                <p className="text-xs opacity-60">Manage tenants, billing, and system health</p>
              </div>
              <span className="sys-control-badge rounded-full px-2.5 py-1 text-[11px] font-medium">
                Local
              </span>
            </div>
          </header>

          <main className="sys-control-content flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
