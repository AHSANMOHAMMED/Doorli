'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy /orders route — redirect to Doorli JWT dashboard orders. */
export default function LegacyOrdersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/orders');
  }, [router]);
  return <div className="p-8 text-slate-500">Redirecting to orders...</div>;
}
