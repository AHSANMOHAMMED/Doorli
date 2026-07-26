"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('doorli_superadmin_token');
    
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (token && pathname === '/login') {
      router.push('/');
    } else {
      setIsReady(true);
    }
  }, [pathname, router]);

  if (!isReady) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#E63946] border-t-transparent animate-spin"></div>
    </div>;
  }

  return <>{children}</>;
}
