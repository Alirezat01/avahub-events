import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { TiltCard } from "./tilt-card";
import { toJalaliBadgeParts } from "@/lib/avahub/jalali";
import type { EventCardData } from "@/lib/avahub/events-db";

/**
 * کارت رویداد پوستری — فاز ۲ طراحی (H)
 * تصویر تمام‌قاب نسبت پوستر ۳:۴ + اسکریم پایین + عنوان روی تصویر؛
 * بج تاریخ شمسی شیشه‌ای، خط نوری طلایی در هاور، تیلت ۲.۵D حفظ شده.
 */
export function EventCard({
  event,
  index = 0,
}: {
  event: EventCardData;
  index?: number;
}) {
  const { day, month } = toJalaliBadgeParts(new Date(event.startsAt));

  return (
    <TiltCard delay={index * 0.08} max={6} className="h-full rounded-2xl">
      <Link
        href={`/events/${event.slug}`}
        className="tilt-root group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-gold/40 hover:shadow-[0_24px_60px_-20px_rgba(212,175,55,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        aria-label={`جزئیات رویداد: ${event.title}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={event.coverImage || "/images/event-showcase.png"}
            alt={event.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* اسکریم سینمایی پایین — خوانایی عنوان روی تصویر */}
          <div aria-hidden="true" className="poster-scrim absolute inset-0" />

          {/* ردیف بالایی: بج تاریخ شمسی شیشه‌ای + بج ویژه */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex min-w-12 flex-col items-center rounded-xl border border-white/15 bg-black/35 px-2.5 py-1.5 text-center shadow-lg backdrop-blur-md">
              <span className="text-lg font-black leading-6 text-foreground">
                {day}
              </span>
              <span className="text-[9px] font-medium leading-4 text-foreground/70">
                {month}
              </span>
            </div>
            {event.badge && (
              <span className="rounded-full bg-gradient-to-l from-[#e8cf7a] to-[#d4af37] px-2.5 py-1 text-[10px] font-black text-[#0a0a0f] shadow-lg">
                {event.badge}
              </span>
            )}
          </div>

          {/* محتوای پوستر — روی تصویر */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="mb-2 inline-block rounded-full border border-purple/45 bg-purple/20 px-2.5 py-0.5 text-[10px] font-bold text-[#e4dafb] backdrop-blur-md">
              {event.category}
            </span>
            <h3 className="text-[15px] font-black leading-7 text-foreground transition-colors duration-300 group-hover:text-gold-soft sm:text-base">
              {event.title}
            </h3>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-foreground/65">
              <MapPin className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
              {event.venueName ?? event.venueCity}
            </p>
          </div>

          {/* خط نوری طلایی — امضای هاور */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[2px] origin-center scale-x-0 bg-gradient-to-l from-transparent via-gold to-gold-soft transition-transform duration-500 ease-out group-hover:scale-x-100"
          />
        </div>
      </Link>
    </TiltCard>
  );
}
