"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";
import { SERVICES } from "@/lib/avahub/services";

/* ─────────────────────────────  Section heading  ───────────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-black sm:text-4xl">{title}</h2>
      <div
        aria-hidden="true"
        className="mx-auto mt-4 h-px w-24 gold-line"
      />
      {sub && (
        <p className="mt-4 text-sm leading-7 text-foreground/60 sm:text-base">
          {sub}
        </p>
      )}
      {reduced ? null : null}
    </Reveal>
  );
}

/* ─────────────────────────────  Services grid  ─────────────────────────── */

// شمارهٔ ادیتوریال فارسی: ۰۱ … ۰۶
const faIndex = (n: number) =>
  String(n).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/**
 * خدمات ادیتوریال — فاز ۲ طراحی (H)
 * چیدمان مجله‌ای: تیتر چسبان در یک ستون + فهرست شماره‌دار با خطوط نشت‌کرده
 * در ستون دیگر — جایگزین گرید یکنواخت ۶تایی.
 */
export function ServicesSection() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-purple/10 blur-[130px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.75fr] lg:gap-16">
          {/* ستون تیتر — چسبان در دسکتاپ */}
          <div className="self-start lg:sticky lg:top-28">
            <Reveal>
              <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
                OUR SERVICES
              </p>
              <h2 className="text-3xl font-black leading-snug sm:text-4xl">
                خدمات ما
              </h2>
              <div aria-hidden="true" className="mt-4 h-px w-24 gold-line" />
              <p className="mt-5 max-w-md text-sm leading-8 text-foreground/60 sm:text-base sm:leading-8">
                راهکارهای تخصصی برای رشد، مدیریت و درخشش رویدادها — هر خدمت
                یک صفحهٔ مستقل با جزئیات کامل، فرایند اجرا و پاسخ سؤالات رایج.
              </p>
              <Link
                href="/services"
                className="group mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-6 py-2.5 text-sm font-bold text-foreground/85 backdrop-blur transition-all hover:border-gold/45 hover:text-gold"
              >
                همهٔ خدمات
                <ArrowLeft
                  className="size-4 transition-transform group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          </div>

          {/* فهرست ادیتوریال شماره‌دار */}
          <div className="border-t border-white/[0.06]">
            {SERVICES.map((service, i) => (
              <Reveal key={service.slug} delay={i * 0.05}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group relative flex items-center gap-4 border-b border-white/[0.06] py-6 transition-colors duration-300 hover:bg-white/[0.015] sm:gap-6 sm:py-7"
                  aria-label={`${service.title} — صفحهٔ خدمت`}
                >
                  {/* شمارهٔ ادیتوریال */}
                  <span
                    aria-hidden="true"
                    className="editorial-index w-10 shrink-0 text-xl font-black text-foreground/15 transition-colors duration-300 group-hover:text-gold sm:text-2xl"
                    dir="ltr"
                  >
                    {faIndex(i + 1)}
                  </span>

                  {/* آیکون در کاشی شیشه‌ای */}
                  <span className="glass-card relative hidden size-16 shrink-0 items-center justify-center rounded-2xl sm:flex">
                    <span
                      aria-hidden="true"
                      className="absolute inset-2 rounded-full bg-purple/15 opacity-50 blur-lg transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <Image
                      src={service.icon}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      className="relative size-11 object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </span>

                  {/* متن */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black leading-7 transition-colors duration-300 group-hover:text-gold-soft sm:text-lg">
                      {service.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-6 text-foreground/55 sm:text-[13px]">
                      {service.short}
                    </span>
                  </span>

                  {/* فلش */}
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground/40 transition-all duration-300 group-hover:-translate-x-1 group-hover:border-gold/50 group-hover:text-gold">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
