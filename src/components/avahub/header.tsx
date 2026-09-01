"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AvahubLogo } from "./logo";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
  { label: "خانه", href: "/" },
  { label: "رویدادها", href: "/events" },
  { label: "خدمات", href: "/services" },
  { label: "نمونه‌کارها", href: "/portfolio" },
  { label: "مجله", href: "/journal" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-panel border-b border-border py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand */}
          <Link href="/" aria-label="آواهاب ایونتس — خانه" className="flex shrink-0 items-center gap-2">
            <AvahubLogo />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-6 lg:flex xl:gap-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm transition-colors ${
                  isActive(item.href)
                    ? "text-gold"
                    : "text-foreground/75 hover:text-primary"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 inset-x-0 h-px gold-line"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA — منوی واقعی کاربر (فاز ۲) */}
          <div className="hidden shrink-0 md:block">
            <UserMenu />
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="باز کردن منو"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={reduced ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduced ? undefined : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-[300px] border-l border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 flex items-center justify-between">
                <AvahubLogo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground/70"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="ناوبری موبایل" className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-3 text-base transition-colors ${
                      isActive(item.href)
                        ? "bg-gold/10 text-gold"
                        : "text-foreground/85 hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <UserMenu variant="mobile" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
