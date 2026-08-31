"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, CalendarDays, Briefcase, Phone } from "lucide-react";

const ITEMS = [
  { label: "خانه", href: "/", icon: Home },
  { label: "خدمات", href: "/services", icon: LayoutGrid },
  { label: "رویدادها", href: "/events", icon: CalendarDays, center: true },
  { label: "نمونه‌کارها", href: "/portfolio", icon: Briefcase },
  { label: "تماس", href: "/contact", icon: Phone },
];

/**
 * Mobile bottom navigation — like the concept board phones.
 * Center item (رویدادها) is an elevated gold pill.
 */
export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="ناوبری پایین موبایل"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div className="glass-panel border-t border-border pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-md grid-cols-5 px-2">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            if (item.center) {
              return (
                <li key={item.href} className="relative flex justify-center">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={`-mt-5 flex size-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-br from-[#e8cf7a] to-[#b8942a] text-[#0a0a0f] shadow-[0_8px_28px_rgba(212,175,55,0.45)] transition-transform active:scale-95 ${
                      active ? "scale-105" : ""
                    }`}
                  >
                    <item.icon className="size-5" aria-hidden="true" />
                    <span className="text-[10px] font-black">{item.label}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                    active ? "text-gold" : "text-foreground/55"
                  }`}
                >
                  <item.icon
                    className={`size-5 transition-transform ${active ? "scale-110" : ""}`}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
