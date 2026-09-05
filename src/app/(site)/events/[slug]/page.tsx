import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Armchair,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Coffee,
  Info,
  MapPin,
  Music,
  Ticket,
  Users,
} from "lucide-react";
import { EventCard } from "@/components/avahub/event-card";
import { getEventBySlug, getRelatedEvents } from "@/lib/avahub/events-db";
import { schemaEventType, dbTypeToSlug, EVENT_TYPE_LANDINGS, pickRelatedServicesForEvent } from "@/lib/avahub/event-types";
import {
  getEventCapacitySummary,
  getUserRegistration,
  getUserWaitlistEntry,
} from "@/lib/avahub/registration";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { JsonLd } from "@/components/avahub/json-ld";
import { SITE_URL, absoluteImageUrl } from "@/lib/avahub/site";
import {
  formatJalaliDate,
  formatJalaliShort,
  formatTimeFa,
} from "@/lib/avahub/jalali";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) return { title: "رویداد پیدا نشد | آواهاب ایونتس" };

  const title = event.metaTitle ?? event.title;
  const description = event.metaDescription ?? event.summary ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title,
      description,
      images: event.coverImage ? [event.coverImage] : undefined,
      type: "article",
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) notFound();

  const related = await getRelatedEvents(event.slug, event.categoryId, 4).catch(
    () => [],
  );

  // وضعیت لاگین + ظرفیت زنده + وضعیت ثبت‌نام کاربر (فاز ۴)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const capacity = await getEventCapacitySummary(event.id, event.capacity).catch(
    () => ({ taken: 0, remaining: null as number | null, full: false }),
  );

  let myReg: Awaited<ReturnType<typeof getUserRegistration>> = null;
  let myWaitlist: Awaited<ReturnType<typeof getUserWaitlistEntry>> = null;
  if (user) {
    const profile = await db.profile
      .findFirst({ where: { authUserId: user.id }, select: { id: true } })
      .catch(() => null);
    if (profile) {
      [myReg, myWaitlist] = await Promise.all([
        getUserRegistration(event.id, profile.id).catch(() => null),
        getUserWaitlistEntry(event.id, profile.id).catch(() => null),
      ]);
    }
  }
  const activeReg = myReg && myReg.status !== "CANCELLED" ? myReg : null;
  const registerHref = `/events/${event.slug}/register`;

  const startsAt = event.startsAt;
  const endsAt = event.endsAt;

  // اسکیمای Event — فاز د + فاز M: کاملاً داینامیک
  // حضوری/آنلاین/ترکیبی، وضعیت واقعی، نوع رویداد و زبان
  const coverUrl = absoluteImageUrl(event.coverImage);
  const isOnline = event.isOnline === true;
  const eventStatusMap: Record<string, string> = {
    PUBLISHED: "https://schema.org/EventScheduled",
    CANCELLED: "https://schema.org/EventCancelled",
  };
  const eventJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.metaDescription ?? event.summary ?? undefined,
    image: coverUrl ? [coverUrl] : undefined,
    startDate: startsAt.toISOString(),
    endDate: endsAt?.toISOString(),
    eventStatus: eventStatusMap[event.status] ?? "https://schema.org/EventScheduled",
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(schemaEventType(event.eventType) ? { eventType: schemaEventType(event.eventType) } : {}),
    inLanguage: "fa-IR",
    isAccessibleForFree: true,
    location: isOnline
      ? {
          "@type": "VirtualLocation",
          name: event.venueName ?? "پخش آنلاین",
          url: `${SITE_URL}/events/${event.slug}`,
        }
      : {
          "@type": "Place",
          name: event.venueName ?? event.venueCity,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venueAddress ?? undefined,
            addressLocality: event.venueCity,
            addressCountry: "IR",
          },
        },
    organizer: {
      "@type": "Organization",
      name: "آواهاب ایونتس",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      name: "ثبت‌حضور رایگان",
      price: "0",
      priceCurrency: "IRR",
      url: `${SITE_URL}/events/${event.slug}/register`,
      availability: capacity.full
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    },
  };

  // اسکیمای BreadcrumbList — فاز د۲ (SEO)
  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "رویدادها", item: `${SITE_URL}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: `${SITE_URL}/events/${event.slug}` },
    ],
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <JsonLd data={eventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* پس‌زمینه محیطی */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(123,77,223,0.16),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* مسیر راهنما */}
        <nav aria-label="مسیر راهنما" className="mb-8 flex items-center gap-2 text-xs text-foreground/50">
          <Link href="/" className="transition-colors hover:text-gold">
            خانه
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/events" className="transition-colors hover:text-gold">
            رویدادها
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground/80">{event.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          {/* کاور */}
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
            <div className="relative aspect-[16/10]">
              <Image
                src={event.coverImage || "/images/event-showcase.png"}
                alt={event.title}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/70 via-transparent to-transparent"
              />
              {event.category && (
                <span className="absolute right-4 top-4 rounded-full border border-purple/40 bg-[#7b4ddf]/85 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
                  {event.category.title}
                </span>
              )}
            </div>
          </div>

          {/* اطلاعات اصلی */}
          <div>
            <h1 className="text-2xl font-black leading-[1.5] sm:text-3xl sm:leading-[1.5]">
              {event.title}
            </h1>
            {event.summary && (
              <p className="mt-4 text-sm leading-8 text-foreground/70 sm:text-base sm:leading-8">
                {event.summary}
              </p>
            )}

            {/* ردیف‌های اطلاعات سریع */}
            <dl className="mt-8 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-foreground/50">تاریخ برگزاری</dt>
                  <dd className="mt-0.5 text-sm font-bold">
                    {formatJalaliDate(startsAt)}
                  </dd>
                  {endsAt && endsAt.toDateString() !== startsAt.toDateString() && (
                    <dd className="text-xs text-foreground/50">
                      تا {formatJalaliShort(endsAt)}
                    </dd>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-foreground/50">ساعت شروع</dt>
                  <dd className="mt-0.5 text-sm font-bold">
                    {formatTimeFa(startsAt)}
                    {endsAt && ` تا ${formatTimeFa(endsAt)}`}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-foreground/50">محل برگزاری</dt>
                  <dd className="mt-0.5 text-sm font-bold">
                    {event.venueName ?? "به‌زودی اعلام می‌شود"}
                  </dd>
                  {event.venueAddress && (
                    <dd className="text-xs text-foreground/50">{event.venueAddress}</dd>
                  )}
                </div>
              </div>
            </dl>

            {/* باکس نکات خاص این رویداد — ادمین می‌نویسد، کاربر می‌بیند */}
            {(() => {
              const items = [
                event.hasSeating === true
                  ? { icon: Armchair, text: "این رویداد صندلی اختصاصی دارد." }
                  : event.hasSeating === false
                    ? {
                        icon: Armchair,
                        text: "این رویداد صندلی اختصاصی ندارد؛ نشستن آزاد است.",
                      }
                    : null,
                event.cateringNote ? { icon: Coffee, text: event.cateringNote } : null,
                event.musicInfo ? { icon: Music, text: event.musicInfo } : null,
                event.specialNotes ? { icon: Info, text: event.specialNotes } : null,
              ].filter((x): x is { icon: typeof Armchair; text: string } => !!x);
              if (items.length === 0) return null;
              return (
                <section
                  aria-labelledby="special-notes"
                  className="mt-5 rounded-2xl border border-purple/25 bg-purple/[0.05] p-5"
                >
                  <h2
                    id="special-notes"
                    className="flex items-center gap-2 text-[13px] font-black text-foreground/90"
                  >
                    <Info className="size-4 text-purple" aria-hidden="true" />
                    نکات مهم این رویداد
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs leading-6 text-foreground/65"
                      >
                        <item.icon
                          className="mt-0.5 size-3.5 shrink-0 text-purple/80"
                          aria-hidden="true"
                        />
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })()}

            {/* باکس ثبت‌حضور */}
            <div className="relative mt-8 overflow-hidden rounded-3xl border border-gold/25 bg-charcoal/80 p-6 backdrop-blur">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 size-44 rounded-full bg-gold/10 blur-[70px]"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10">
                    <Ticket className="size-5 text-gold" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-black">ثبت‌حضور آنلاین — رایگان</p>
                    <p className="mt-0.5 text-xs text-foreground/55">
                      {event.capacity > 0 ? (
                        capacity.full ? (
                          <span className="text-amber-300">
                            ظرفیت تکمیل شده — {capacity.taken.toLocaleString("fa-IR")} نفر
                          </span>
                        ) : (
                          `ظرفیت باقی‌مانده: ${(capacity.remaining ?? 0).toLocaleString("fa-IR")} نفر`
                        )
                      ) : (
                        "بدون محدودیت ظرفیت"
                      )}
                    </p>
                  </div>
                </div>
                {!user ? (
                  <Link
                    href={`/login?next=${registerHref}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)]"
                  >
                    ورود و رزرو جایگاه
                    <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
                  </Link>
                ) : activeReg ? (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold text-gold transition-colors hover:bg-gold/15"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {activeReg.status === "CONFIRMED" ? "ثبت‌نام شما قطعی است" : "ثبت‌نام شما در انتظار تأیید"}
                  </Link>
                ) : myWaitlist ? (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-full border border-purple/40 bg-purple/10 px-6 py-3 text-sm font-bold text-purple"
                  >
                    <Clock3 className="size-4" aria-hidden="true" />
                    در لیست انتظار — نوبت {myWaitlist.position.toLocaleString("fa-IR")}
                  </Link>
                ) : capacity.full && !event.waitlistEnabled ? (
                  <span className="inline-flex cursor-default items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-bold text-foreground/50">
                    ظرفیت تکمیل شده
                  </span>
                ) : (
                  <Link
                    href={registerHref}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)]"
                  >
                    {capacity.full ? (
                      <>
                        عضویت در لیست انتظار
                        <Clock3 className="size-4" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        ثبت‌حضور رایگان
                        <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
                      </>
                    )}
                  </Link>
                )}
              </div>
              {event.waitlistEnabled && (
                <p className="relative mt-4 border-t border-border/60 pt-3 text-[11px] leading-6 text-foreground/50">
                  در صورت تکمیل ظرفیت، امکان عضویت در لیست انتظار فعال می‌شود و در صورت
                  باز شدن جایگاه، به‌صورت خودکار مطلع خواهید شد.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* توضیحات کامل */}
        {event.description && (
          <section className="mt-14" aria-labelledby="event-description">
            <h2
              id="event-description"
              className="flex items-center gap-3 text-xl font-black"
            >
              <span aria-hidden="true" className="h-6 w-1 rounded-full bg-gradient-to-b from-gold to-purple" />
              درباره این رویداد
            </h2>
            <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card/50 p-6 sm:p-8">
              {event.description.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-8 text-foreground/75 sm:text-[15px] sm:leading-9">
                  {para}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* نوار اطلاعات پایانی */}
        <section className="mt-10 grid gap-3 sm:grid-cols-3" aria-label="اطلاعات تکمیلی">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-4">
            <Users className="size-5 shrink-0 text-purple" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-foreground/50">ظرفیت رویداد</p>
              <p className="text-sm font-bold">
                {event.capacity > 0
                  ? `${event.capacity.toLocaleString("fa-IR")} نفر`
                  : "بدون محدودیت"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-4">
            <MapPin className="size-5 shrink-0 text-purple" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-foreground/50">شهر برگزاری</p>
              <p className="text-sm font-bold">{event.venueCity}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-4">
            <CalendarDays className="size-5 shrink-0 text-purple" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-foreground/50">زمان</p>
              <p className="text-sm font-bold">{formatJalaliShort(startsAt)}</p>
            </div>
          </div>
        </section>

        {/* فاز M — لینک‌سازی داخلی: نوع رویداد + خدمات مرتبط */}
        {(dbTypeToSlug(event.eventType) || pickRelatedServicesForEvent(event).length > 0) && (
          <section className="mt-10 rounded-2xl border border-border bg-card/60 p-5" aria-label="لینک‌های مرتبط">
            <div className="flex flex-wrap items-center gap-2">
              {dbTypeToSlug(event.eventType) && (
                <>
                  <span className="text-xs text-foreground/50">نوع رویداد:</span>
                  <Link
                    href={`/event-types/${dbTypeToSlug(event.eventType)}`}
                    className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold transition hover:bg-gold/20"
                  >
                    همهٔ {EVENT_TYPE_LANDINGS.find((t) => t.slug === dbTypeToSlug(event.eventType))?.plural}
                  </Link>
                </>
              )}
              {pickRelatedServicesForEvent(event).length > 0 && (
                <>
                  <span className="ms-2 text-xs text-foreground/50">برگزار آن را می‌خواهید؟</span>
                  {pickRelatedServicesForEvent(event).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="rounded-full border border-border px-4 py-1.5 text-xs text-foreground/75 transition hover:border-gold/40 hover:text-gold"
                    >
                      {s.title}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        {/* رویدادهای مرتبط */}
        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-events">
            <div className="mb-8 flex items-center justify-between">
              <h2 id="related-events" className="text-xl font-black">
                رویدادهای مرتبط
              </h2>
              <Link
                href="/events"
                className="text-sm font-bold text-gold transition-colors hover:text-gold-soft"
              >
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {related.map((rel, i) => (
                <EventCard key={rel.slug} event={rel} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
