"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Left menu on desktop, like Tally's Gateway list. */
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-lg px-4 text-lg font-medium ${
              active ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
            }`}
          >
            <span aria-hidden className="w-6">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom bar on phones: always in reach of the thumb, always labelled. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-panel md:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold leading-tight ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <span aria-hidden className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
