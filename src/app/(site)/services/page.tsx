import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SERVICES } from "@/lib/avahub/services";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { TiltCard } from "@/components/avahub/tilt-card";

export const metadata: Metadata = {
  title: "خدمات آواهاب ایونتس | از ایده تا اجرا و رشد",
  description:
    "شش خدمت تخصصی آواهاب ایونتس: استودیو تبلیغات نوین، خانهٔ رویدادهای بزرگ، آتلیهٔ محتوا، فرماندهی شبکه‌های اجتماعی، اتاق استراتژی، کارگاه برند و گرافیک.",
  alternates: { canonical: "/services" },
};

const PROCESS = [
  { title: "شناخت", desc: "جلسه اول رایگان است؛ هدف، مخاطب و چالش‌های شما را می‌شناسیم." },
  { title: "طراحی", desc: "راهکار اختصاصی با بودجه شفاف و برنامه زمانی دقیق طراحی می‌شود." },
  { title: "اجرا", desc: "تیم تخصصی آواهاب اجرا را بر عهده می‌گیرد؛ شما فقط نتیجه را می‌بینید." },
  { title: "گزارش", desc: "نتایج با اعداد روشن گزارش می‌شود و مسیر قدم بعد ترسیم می‌گردد." },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title="خدمات ما"
        sub="راهکارهای تخصصی برای رشد، مدیریت و درخشش رویدادها — هر خدمت یک مسیر کامل از شناخت تا نتیجه قابل اندازه‌گیری."
      />

      {/* Service cards */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <TiltCard key={service.slug} delay={i * 0.07} className="h-full rounded-2xl">
              <Link
                href={`/services/${service.slug}`}
                className="tilt-root flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-6 transition-colors duration-300 group-hover:border-purple/50"
              >
                <div className="tilt-depth-2 mb-5 flex size-16 items-center justify-center rounded-2xl border border-border bg-[#0d0d14]">
                  <Image
                    src={service.icon}
                    alt=""
                    width={64}
                    height={64}
                    sizes="64px"
                    className="size-12 object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h2 className="text-lg font-black transition-colors group-hover:text-gold-soft">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-foreground/60">
                  {service.short}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-gold transition-all group-hover:gap-3">
                  صفحه خدمت
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
              HOW WE WORK
            </p>
            <h2 className="text-3xl font-black sm:text-4xl">مسیر همکاری</h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden="true"
              className="absolute inset-x-16 top-7 hidden h-px bg-gradient-to-l from-purple/40 via-gold/40 to-purple/40 lg:block"
            />
            {PROCESS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12} className="relative text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/40 bg-charcoal text-xl font-black text-gradient-gold shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  {(i + 1).toLocaleString("fa-IR")}
                </div>
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-56 text-sm leading-7 text-foreground/55">
                  {step.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
