import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "./reveal";
import { EventCard } from "./event-card";
import { getUpcomingPublishedEvents } from "@/lib/avahub/events-db";

/**
 * رویدادهای پیش رو — صفحه اصلی (فاز ۳)
 * کامپوننت سرور: داده مستقیم از دیتابیس (رویدادهای منتشرشده و آینده)
 */
export async function FeaturedEvents() {
  let events = [] as Awaited<ReturnType<typeof getUpcomingPublishedEvents>>;
  try {
    events = await getUpcomingPublishedEvents(10);
  } catch {
    events = [];
  }

  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row-reverse sm:items-end">
            <Link
              href="/events"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-gold transition-colors hover:text-gold-soft"
            >
              مشاهده همه
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
            <div className="text-center sm:text-right">
              <p className="mb-2 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
                UPCOMING EVENTS
              </p>
              <h2 className="text-3xl font-black sm:text-4xl">رویدادهای پیش رو</h2>
              <div aria-hidden="true" className="mt-3 h-px w-24 gold-line sm:mr-0" />
            </div>
          </div>
        </Reveal>

        {events.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
            {events.map((event, i) => (
              <EventCard key={event.slug} event={event} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center">
            <p className="text-lg font-bold text-foreground/60">
              رویدادهای جدید به‌زودی اعلام می‌شوند
            </p>
            <p className="mt-2 text-sm text-foreground/40">
              برای اطلاع از تقویم رویدادها، همین صفحه را دنبال کنید.
            </p>
          </div>
        )}

        <Reveal className="mt-8 text-center">
          <p className="text-xs text-foreground/40">
            ثبت‌حضور آنلاین رویدادها به‌زودی از همین صفحه فعال می‌شود.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
