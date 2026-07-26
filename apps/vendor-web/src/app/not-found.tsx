import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-white/70">This page could not be found.</p>
      <Link href="/" className="underline">
        Back to home
      </Link>
    </div>
  );
}
