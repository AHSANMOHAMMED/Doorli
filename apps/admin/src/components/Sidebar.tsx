import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, UserCheck, Settings, Car } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 h-screen sticky top-0 text-slate-300 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Doorli Admin</h1>
        <p className="text-xs text-slate-500 mt-1">Unified Enterprise System</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-800 text-white">
          <LayoutDashboard size={20} />
          <span className="font-medium">Overview</span>
        </Link>
        <Link href="/vendors" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
          <Users size={20} />
          <span className="font-medium">Vendors</span>
        </Link>
        <Link href="/verifications" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
          <UserCheck size={20} />
          <span className="font-medium">Verifications</span>
        </Link>
        <Link href="/drivers" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
          <Car size={20} />
          <span className="font-medium">Drivers</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
          <Settings size={20} />
          <span className="font-medium">Platform Settings</span>
        </Link>
      </div>
    </aside>
  );
}
