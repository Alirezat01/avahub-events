import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ListChecks,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { EventCard } from "@/components/avahub/event-card";
import { getEventBySlug, getRelatedEvents } from "@/lib/avahub/events-db";
import { createClient } from "@/lib/supabase/server";
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

  // وضعیت لاگین کاربر — برای دکمه ثبت‌حضور (فعال‌سازی کامل در فاز ۴)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startsAt = event.startsAt;
  const endsAt = event.endsAt;

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
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
                    <p className="text-sm font-black">ثبت‌حضور آنلاین</p>
                    <p className="mt-0.5 text-xs text-foreground/55">
                      {event.capacity > 0
                        ? `ظرفیت محدود — ${event.capacity.toLocaleString("fa-IR")} نفر`
                        : "بدون محدودیت ظرفیت"}
                    </p>
                  </div>
                </div>
                {user ? (
                  <span
                    className="inline-flex cursor-default items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-bold text-foreground/60"
                    title="ثبت‌حضور در فاز بعدی فعال می‌شود"
                  >
                    <ListChecks className="size-4" aria-hidden="true" />
                    به‌زودی فعال می‌شود
                  </span>
                ) : (
                  <Link
                    href={`/login?next=/events/${event.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)]"
                  >
                    ورود و رزرو جایگاه
                    <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
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
