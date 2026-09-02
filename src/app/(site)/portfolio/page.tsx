import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { getActivePortfolioItems } from "@/lib/avahub/portfolio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نمونه‌کارها | همایش، سمینار و رویدادهای برند",
  description:
    "نمونه‌کارهای آواهاب ایونتس؛ اجرای همایش، سمینار و کنفرانس، رویدادهای برند و پشت‌صحنه‌های حرفه‌ای در تهران و شهرهای دیگر.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const { items } = await getActivePortfolioItems();

  return (
    <>
      <PageHero
        eyebrow="PORTFOLIO"
        title="نمونه‌کارها"
        sub="گزیده‌ای از اجراها، همایش‌ها و رویدادهایی که تیم آواهاب آن‌ها را به تجربه‌هایی ماندگار تبدیل کرده است."
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* متن معرفی — فاز د۲ (محتوای قابل ایندکس) */}
        <p className="mx-auto max-w-3xl text-center text-sm leading-8 text-foreground/65 sm:text-[15px] sm:leading-9">
          هر پروژه برای ما یک چالش واقعی بوده است؛ از برگزاری همایش و کنفرانس
          چندصدنفره تا رونمایی برندها و کمپین‌های تبلیغاتی. نمونه‌کارهای زیر
          گزیده‌ای از اجرای رویداد، برندسازی و تولید محتوای تیم آواهاب ایونتس در
          تهران و سایر شهرها است — همان تجربه‌ای که می‌تواند رویداد بعدی شما را
          بسازد.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {items.map((work, i) => (
            <Reveal key={`${work.title}-${i}`} delay={(i % 3) * 0.08}>
              <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  unoptimized={work.image.startsWith("http")}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/90 via-[#0a0a0f]/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="mb-1.5 inline-block rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold-soft backdrop-blur">
                    {work.tag}
                  </span>
                  <p className="translate-y-1 text-sm font-black text-foreground transition-transform duration-500 group-hover:translate-y-0 sm:text-base">
                    {work.title}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <Camera className="size-6 text-gold/70" aria-hidden="true" />
            <p className="max-w-2xl text-sm leading-8 text-foreground/60">
              هر رویداد برای ما یک داستان است؛ نمونه‌کارهای تازه پس از هر اجرا از
              طریق پنل مدیریت همین‌جا اضافه می‌شود. اگر رویداد یا برند شما هم
              دوست دارد به این مجموعه اضافه شود، تیم آواهاب از مشاوره اولیه تا
              اجرای کامل کنار شماست — کافی است پیام بدهید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground shadow-[0_0_24px_rgba(212,175,55,0.25)] transition-shadow hover:shadow-[0_0_40px_rgba(212,175,55,0.45)]"
              >
                شروع پروژه بعدی شما
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold/10 px-6 py-2.5 text-xs font-bold text-gold transition-colors hover:bg-gold/15"
              >
                مشاهده خدمات
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
