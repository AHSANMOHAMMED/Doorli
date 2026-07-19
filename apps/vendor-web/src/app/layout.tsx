import type { Metadata } from 'next';
import { Syne, Manrope } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-doorli-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-doorli-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doorli Vendor — Sell next door',
  description: 'Run orders, bookings, and your kitchen board for your local business on Doorli.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
