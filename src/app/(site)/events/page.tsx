import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/avahub/page-hero";
import { EventExplorer } from "@/components/avahub/event-explorer";
import { getUpcomingPublishedEvents, getActiveCategories } from "@/lib/avahub/events-db";
import { JsonLd, makeBreadcrumbJsonLd } from "@/components/avahub/json-ld";
import { SITE_URL } from "@/lib/avahub/site";
import { EVENT_TYPE_LANDINGS } from "@/lib/avahub/event-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تقویم رویدادها | کنسرت، همایش، کارگاه و رویداد سازمانی",
  description:
    "همهٔ رویدادهای پیش رو آواهاب ایونتس در یک تقویم: کنسرت و موسیقی زنده، همایش و کنفرانس، سمینار، کارگاه، نشست شبکه‌سازی، نمایشگاه، اکتیویشن برند و رویدادهای گالری در تهران و شهرها — ثبت‌حضور آنلاین رایگان با بلیت QR.",
  keywords: [
    "تقویم رویدادها",
    "رویدادهای تهران",
    "کنسرت",
    "همایش و کنفرانس",
    "سمینار آموزشی",
    "کارگاه تخصصی",
    "نشست شبکه‌سازی",
    "نمایشگاه",
    "اکتیویشن برند",
    "رویداد سازمانی",
    "ثبت نام رویداد",
  ],
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getUpcomingPublishedEvents>> = [];
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  let dbError = false;

  try {
    [events, categories] = await Promise.all([
      getUpcomingPublishedEvents(),
      getActiveCategories(),
    ]);
  } catch {
    dbError = true;
  }

  // اسکیمای ItemList — فاز د۲ (SEO): فهرست رویدادها برای گوگل
  const itemListJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "تقویم رویدادهای آواهاب ایونتس",
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/events/${e.slug}`,
      name: e.title,
    })),
  };

  // فاز E: Breadcrumb یکپارچه
  const breadcrumbJsonLd = makeBreadcrumbJsonLd([
    { name: "خانه", href: "/" },
    { name: "رویدادها", href: "/events" },
  ]);

  return (
    <>
      {!dbError && events.length > 0 && <JsonLd data={itemListJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <PageHero
        eyebrow="UPCOMING EVENTS"
        title="رویدادهای پیش رو"
        sub="از کنسرت و لایو موسیقی تا همایش سازمانی، کارگاه تخصصی، نشست شبکه‌سازی، نمایشگاه و اکتیویشن برند — رویداد بعدی خود را پیدا کنید و رزرو را از دست ندهید."
      />
      {/* فاز M — چیپ انواع رویداد: لینک‌سازی داخلی به لندینگ‌های ایندکس‌شدنی */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-label="انواع رویداد">
        <div className="flex flex-wrap gap-2 pb-6">
          {EVENT_TYPE_LANDINGS.map((t) => (
            <Link
              key={t.slug}
              href={`/event-types/${t.slug}`}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-foreground/75 transition hover:border-gold/50 hover:text-gold"
            >
              {t.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {dbError ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center">
            <p className="text-lg font-bold text-foreground/60">
              موقتاً در دسترس نیست
            </p>
            <p className="mt-2 text-sm text-foreground/40">
              در بارگذاری تقویم رویدادها مشکلی پیش آمد؛ چند لحظه دیگر دوباره تلاش کنید.
            </p>
          </div>
        ) : (
          <EventExplorer events={events} categories={categories} />
        )}
        {!dbError && events.length > 0 && (
          <p className="mt-10 text-center text-xs text-foreground/40">
            ثبت‌حضور آنلاین فعال است — از صفحه هر رویداد جایگاه خود را رایگان رزرو کنید.
          </p>
        )}
      </section>
    </>
  );
}
