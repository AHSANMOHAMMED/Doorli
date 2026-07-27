'use client';

import { useEffect } from 'react';

/**
 * DEPRECATED — Doorli Super Admin now lives in apps/admin at /admin.
 * This design-dump app is kept only so historical links do not 404 in local workspaces.
 */
export default function DeprecatedSuperAdmin() {
  useEffect(() => {
    const target = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || 'http://doorli.me/admin';
    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#060b1c] px-6 text-center text-[#f4f7fb]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b86a6]">Deprecated</p>
      <h1 className="max-w-lg text-3xl font-bold tracking-tight">Doorli Super Admin moved</h1>
      <p className="max-w-md text-sm text-[#9bb4d0]">
        The unfinished design-kit screens in this app are retired. Use the live control plane at{' '}
        <a className="text-[#5dcaa5] underline underline-offset-2" href="http://doorli.me/admin">
          doorli.me/admin
        </a>
        .
      </p>
      <a
        href="http://doorli.me/admin"
        className="mt-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#1d9e75] px-5 py-3 text-sm font-semibold text-white"
      >
        Open Super Admin
      </a>
    </main>
  );
}
