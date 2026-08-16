"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BriefcaseBusiness, Package, Car, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Explore", icon: Home },
  { href: "/search?category=service", label: "Services", icon: BriefcaseBusiness },
  { href: "/ride", label: "Rides", icon: Car },
  { href: "/orders", label: "Activity", icon: Package },
  { href: "/profile", label: "Account", icon: User },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  // Hide on login / full-bleed auth
  if (pathname?.startsWith("/login")) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-[#dce7f2] bg-white/95 backdrop-blur-xl safe-bottom shadow-[0_-8px_24px_rgba(25,68,112,.10)]"
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
                  "relative flex flex-col items-center justify-center gap-1 h-full text-[10px] font-semibold transition-colors",
                  active ? "text-[#16805b]" : "text-[#71839a] hover:text-[#10213f]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className={cn("absolute top-0 h-0.5 w-8 rounded-full transition-all", active ? "bg-[#16805b] opacity-100" : "opacity-0")} />
                <Icon className={cn("w-5 h-5 transition-transform", active && "stroke-[2.5] scale-110")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
