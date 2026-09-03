"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
          scrolled
            ? "border-b border-white/[0.06] bg-[#0a0a0f]/70 py-2 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl backdrop-saturate-150"
            : "bg-transparent py-4"
        }`}
      >
        {/* خط نوری طلایی — فقط در حالت اسکرول (امضای سینمایی) */}
        {scrolled && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[-1px] h-px hairline-fade opacity-70"
          />
        )}
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand — لوگوی واقعی آواهاب */}
          <Link href="/" aria-label="آواهاب ایونتس — خانه" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo-full.png"
              alt="آواهاب ایونتس"
              width={657}
              height={625}
              priority
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop nav — دکمه‌های واقعی */}
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-2 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium backdrop-blur transition-all duration-300 xl:px-4 ${
                    active
                      ? "border-gold/60 bg-gold/15 text-gold shadow-[0_0_22px_rgba(212,175,55,0.28)]"
                      : "border-white/10 bg-white/[0.04] text-foreground/80 hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/10 hover:text-gold hover:shadow-[0_0_18px_rgba(212,175,55,0.22)]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.9)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
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
                <Image
                  src="/images/logo-full.png"
                  alt="آواهاب ایونتس"
                  width={657}
                  height={625}
                  className="h-12 w-auto"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground/70"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="ناوبری موبایل" className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl border px-4 py-3 text-base font-medium transition-all ${
                        active
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-white/10 bg-white/[0.04] text-foreground/85 hover:border-gold/40 hover:bg-gold/5 hover:text-gold"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <UserMenu variant="mobile" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
