"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";
import { TiltCard } from "./tilt-card";
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

export function ServicesSection() {
  return (
    <section id="services" className="relative py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-purple/10 blur-[130px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="OUR SERVICES"
          title="خدمات ما"
          sub="راهکارهای تخصصی برای رشد، مدیریت و درخشش رویدادها"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {SERVICES.map((service, i) => (
            <TiltCard
              key={service.slug}
              delay={i * 0.08}
              glow="rgba(123,77,223,0.18)"
              className="h-full rounded-2xl"
            >
              <Link
                href={`/services/${service.slug}`}
                className="tilt-root flex h-full flex-col items-center overflow-hidden rounded-2xl border border-border bg-card/70 p-4 text-center transition-colors duration-300 group-hover:border-purple/50 sm:p-5"
              >
                {/* 3D icon with inner parallax */}
                <span className="tilt-depth-2 relative mb-4 block size-20 sm:size-24">
                  <span
                    aria-hidden="true"
                    className="absolute inset-2 rounded-full bg-purple/15 blur-xl transition-opacity duration-500 opacity-60 group-hover:opacity-100"
                  />
                  <Image
                    src={service.icon}
                    alt=""
                    width={96}
                    height={96}
                    sizes="96px"
                    className="relative size-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <h3 className="text-sm font-black leading-6 group-hover:text-gold-soft transition-colors sm:text-[15px]">
                  {service.title}
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-foreground/55 sm:leading-6">
                  {service.short}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-bold text-gold opacity-0 transition-all duration-300 group-hover:opacity-100">
                  بیشتر بدانید
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────  CTA banner  ────────────────────────────── */

export function CtaBanner() {
  const reduced = useReducedMotion();
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-charcoal px-6 py-14 text-center sm:px-12">
            {/* morphing ambient blobs */}
            <div
              aria-hidden="true"
              className={`absolute -right-20 -top-24 size-72 rounded-[42%_58%_63%_37%/41%_44%_56%_59%] bg-gradient-to-br from-purple/30 to-transparent blur-3xl ${
                reduced ? "" : "motion-safe:animate-morph"
              }`}
            />
            <div
              aria-hidden="true"
              className={`absolute -bottom-24 -left-16 size-64 rounded-[58%_42%_37%_63%/56%_59%_41%_44%] bg-gradient-to-tr from-gold/25 to-transparent blur-3xl ${
                reduced ? "" : "motion-safe:animate-morph [animation-delay:-6s]"
              }`}
            />
            <div className="relative">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-soft">
                <Sparkles className="size-3.5" aria-hidden="true" />
                شروع همکاری
              </span>
              <h2 className="mx-auto max-w-xl text-3xl font-black leading-[1.4] sm:text-4xl">
                برند شما در رویداد بعدی{" "}
                <span className="text-gradient-gold">می‌درخشد</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-foreground/60 sm:text-base sm:leading-8">
                یک جلسه مشاوره رایگان کافی است تا مسیر درخشش برند و رویداد شما
                روشن شود.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)] sm:w-auto"
                >
                  درخواست مشاوره رایگان
                </Link>
                <Link
                  href="/services"
                  className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card/40 px-8 py-3 text-base font-medium text-foreground/90 backdrop-blur transition-all hover:border-primary/50 hover:text-primary sm:w-auto"
                >
                  مشاهده خدمات
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
