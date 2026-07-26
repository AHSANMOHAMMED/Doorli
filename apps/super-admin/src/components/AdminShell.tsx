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
    <>
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </>
  );
}
