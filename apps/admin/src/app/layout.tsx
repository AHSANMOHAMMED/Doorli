import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AdminShell from "@/components/AdminShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Doorli Admin - Platform Overview",
  description: "Enterprise administration dashboard for the Doorli ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex bg-slate-50 min-h-screen`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
