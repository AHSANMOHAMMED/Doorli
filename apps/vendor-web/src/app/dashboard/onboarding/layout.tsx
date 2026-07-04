import Link from 'next/link';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/dashboard" className="text-xl font-bold text-doorli-primary">
          Doorli Vendor
        </Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
