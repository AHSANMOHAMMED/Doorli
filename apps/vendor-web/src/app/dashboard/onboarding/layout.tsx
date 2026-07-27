import Link from 'next/link';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="doorli-console min-h-screen">
      <header className="border-b border-white/[0.07] px-6 py-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#185fa5] to-[#1d9e75] font-display text-base font-bold text-white shadow-lg">
            D
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">Doorli Vendor</span>
        </Link>
      </header>
      <main className="mx-auto w-full max-w-4xl p-6">{children}</main>
    </div>
  );
}
