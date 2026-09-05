import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/avahub/page-hero";
import { EventCard, type EventCardData } from "@/components/avahub/event-card";
import { FaqList } from "@/components/avahub/faq";
import { JsonLd, makeBreadcrumbJsonLd } from "@/components/avahub/json-ld";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/avahub/site";
import { SERVICES } from "@/lib/avahub/services";
import { EVENT_TYPE_LANDINGS, findTypeLanding } from "@/lib/avahub/event-types";

// ─────────────────────────────────────────────────────────────
// لندینگ اختصاصی انواع رویداد — فاز M (Content SEO)
// هر نوع رویداد یک صفحهٔ ایندکس‌شدنی با محتوای تجاری، FAQ،
// رویدادهای واقعی همان نوع و خدمات مرتبط دارد.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Params = { type: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const landing = findTypeLanding(type);
  if (!landing) return { title: "یافت نشد" };
  return {
    title: landing.seoTitle,
    description: landing.seoDescription,
    keywords: [landing.name, ...landing.matchKeywords, "رویدادهای تهران", "ثبت حضور آنلاین"],
    alternates: { canonical: `/event-types/${landing.slug}` },
    openGraph: {
      title: landing.seoTitle,
      description: landing.seoDescription,
      url: `${SITE_URL}/event-types/${landing.slug}`,
      type: "website",
      locale: "fa_IR",
    },
  };
}

/** رویدادهای منتشرشدهٔ همین نوع — با eventType یا کیورد عنوان/خلاصه (مقاوم به خطای DB) */
async function getEventsOfType(landing: (typeof EVENT_TYPE_LANDINGS)[number]) {
  const kwOr = landing.matchKeywords.flatMap((kw) => [
    { title: { contains: kw, mode: "insensitive" as const } },
    { summary: { contains: kw, mode: "insensitive" as const } },
  ]);
  let events: Awaited<ReturnType<typeof fetchEvents>> = [];
  try {
    events = await fetchEvents(landing.db, kwOr);
  } catch (e) {
    console.error("[event-types] خطای خواندن رویدادها:", e);
    return [];
  }
  const now = Date.now();
  const mapped: (EventCardData & { isPast: boolean })[] = events.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category?.title ?? "رویداد",
    categorySlug: e.category?.slug ?? "",
    summary: e.summary,
    coverImage: e.coverImage,
    startsAt: e.startsAt.toISOString(),
    venueName: e.venueName,
    venueCity: e.venueCity,
    isFeatured: e.isFeatured,
    isPast: e.startsAt.getTime() < now,
  }));
// آینده‌ها اول (نزدیک→دور)، بعد گذشته‌ها (جدید→قدیم)
  return [
    ...mapped.filter((e) => !e.isPast).reverse(),
    ...mapped.filter((e) => e.isPast),
  ];
}

async function fetchEvents(
  dbType: string,
  kwOr: object[],
) {
  return db.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ eventType: dbType }, ...kwOr],
    },
    orderBy: { startsAt: "desc" },
    take: 12,
    include: { category: { select: { slug: true, title: true } } },
  });
}

export default async function EventTypeLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  const landing = findTypeLanding(type);
  if (!landing) notFound();

  const events = await getEventsOfType(landing);
  const relatedServices = landing.services
    .map((s) => SERVICES.find((x) => x.slug === s))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));
  const others = EVENT_TYPE_LANDINGS.filter((t) => t.slug !== landing.slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: landing.plural,
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/events/${e.slug}`,
      name: e.title,
    })),
  };
  const breadcrumbJsonLd = makeBreadcrumbJsonLd([
    { name: "خانه", href: "/" },
    { name: "رویدادها", href: "/events" },
    { name: landing.name, href: `/event-types/${landing.slug}` },
  ]);

  return (
    <>
      {events.length > 0 && <JsonLd data={itemListJsonLd} />}
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero eyebrow={landing.name} title={landing.h1} sub={landing.heroSub} />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* محتوای سئویی */}
        <section className="mx-auto max-w-3xl space-y-4 text-[15px] leading-8 text-foreground/80">
          {landing.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        {/* رویدادهای این نوع */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-black sm:text-2xl">
            {events.some((e) => !e.isPast) ? `${landing.plural} پیش رو` : `${landing.plural} اخیر`}
          </h2>
          {events.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card/60 p-8 text-center text-sm leading-7 text-foreground/60">
              هنوز رویدادی از این نوع منتشر نشده — به‌زودی برنامه‌های جدید همین‌جا اعلام می‌شود.
              می‌توانید تقویم کامل را در{" "}
              <Link href="/events" className="text-gold underline-offset-4 hover:underline">
                صفحهٔ رویدادها
              </Link>{" "}
              دنبال کنید.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {events.slice(0, 8).map((e, i) => (
                <EventCard key={e.slug} event={e} index={i} />
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link
              href="/events"
              className="inline-block rounded-xl border border-gold/40 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
            >
              مشاهده تقویم کامل رویدادها
            </Link>
          </div>
        </section>

        {/* خدمات مرتبط */}
        {relatedServices.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-lg font-black">خدمات مرتبط برای این نوع رویداد</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:border-gold/40"
                >
                  <h3 className="font-bold text-foreground group-hover:text-gold">{s.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-foreground/60">{s.short}</p>
                  <span className="mt-3 inline-block text-xs text-gold">جزئیات خدمت ←</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* سوالات متداول */}
        <section className="mt-14">
          <h2 className="mb-6 text-center text-lg font-black sm:text-xl">
            سوالات متداول درباره {landing.name}
          </h2>
          <FaqList items={landing.faqs} />
        </section>

        {/* لینک به سایر انواع — لینک‌سازی داخلی */}
        <section className="mt-14 rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="mb-4 text-sm font-bold text-foreground/80">
            انواع دیگر رویدادها را هم ببینید:
          </h2>
          <div className="flex flex-wrap gap-2">
            {others.map((t) => (
              <Link
                key={t.slug}
                href={`/event-types/${t.slug}`}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-foreground/70 transition hover:border-gold/40 hover:text-gold"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
