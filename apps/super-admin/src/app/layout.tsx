import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doorli Super Admin",
  description: "Enterprise Command Center",
};

import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
      </head>
      <body className="bg-background text-on-surface min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
