'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (isLogin) return;
    if (!localStorage.getItem('doorli_admin_token')) {
      router.replace('/login');
    }
  }, [isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="doorli-hero-plane relative flex min-h-screen">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      <Sidebar />
      <main className="relative z-10 min-w-0 flex-1 px-5 py-8 pt-16 sm:px-8 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
