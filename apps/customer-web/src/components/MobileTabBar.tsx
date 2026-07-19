"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Package, Car, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/ride", label: "Ride", icon: Car },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  // Hide on login / full-bleed auth
  if (pathname?.startsWith("/login")) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-white/10 bg-[#07101f]/95 backdrop-blur-xl safe-bottom"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium",
                  active ? "text-[var(--doorli-mint)]" : "text-white/50",
                )}
              >
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
