import type { Metadata, Viewport } from "next";
import { Syne, Manrope } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { MobileTabBar } from "@/components/MobileTabBar";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-doorli-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-doorli-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doorli | Everything local. Delivered.",
  description:
    "Connect with every business, service, and venue in your community. Groceries, food, home repairs, and more.",
  appleWebApp: {
    capable: true,
    title: "Doorli",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0f2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--doorli-navy)] text-[var(--doorli-text)] pb-tab-bar">
        <CartProvider>
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
          <MobileTabBar />
        </CartProvider>
      </body>
    </html>
  );
}
