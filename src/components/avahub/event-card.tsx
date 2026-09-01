import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { TiltCard } from "./tilt-card";
import { toJalaliBadgeParts } from "@/lib/avahub/jalali";
import type { EventCardData } from "@/lib/avahub/events-db";

/**
 * کارت رویداد — فاز ۳
 * داده از دیتابیس (EventCardData) می‌آید و به صفحه جزئیات لینک می‌شود.
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
    <TiltCard delay={index * 0.08} max={7} className="h-full rounded-2xl">
      <Link
        href={`/events/${event.slug}`}
        className="tilt-root group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_18px_50px_-18px_rgba(212,175,55,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        aria-label={`جزئیات رویداد: ${event.title}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={event.coverImage || "/images/event-showcase.png"}
            alt={event.title}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-transparent"
          />
          {/* بج تاریخ شمسی */}
          <div className="absolute right-3 top-3 flex min-w-12 flex-col items-center rounded-xl border border-purple/40 bg-gradient-to-b from-[#7b4ddf]/90 to-[#5b35ad]/90 px-2 py-1.5 text-center shadow-lg backdrop-blur">
            <span className="text-lg font-black leading-6 text-white">
              {day}
            </span>
            <span className="text-[9px] font-medium leading-4 text-white/85">
              {month}
            </span>
          </div>
          {event.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-gradient-to-l from-[#e8cf7a] to-[#d4af37] px-2.5 py-1 text-[10px] font-black text-[#0a0a0f] shadow">
              {event.badge}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <span className="mb-1.5 text-[10px] font-bold tracking-wide text-purple">
            {event.category}
          </span>
          <h3 className="text-sm font-black leading-6 transition-colors group-hover:text-gold-soft sm:text-[15px]">
            {event.title}
          </h3>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-foreground/55">
            <MapPin className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
            {event.venueName ?? event.venueCity}
          </p>
        </div>
      </Link>
    </TiltCard>
  );
}
