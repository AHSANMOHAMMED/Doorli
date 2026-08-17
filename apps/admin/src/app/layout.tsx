import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Doorli Super Admin",
  description: "Unified control plane for the Doorli marketplace and dual ERP backends",
};

export const viewport: Viewport = {
  themeColor: "#060b1c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
