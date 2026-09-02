"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
