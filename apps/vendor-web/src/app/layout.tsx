import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doorli Vendor Dashboard',
  description: 'Manage orders, products, and bookings for your local business',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
