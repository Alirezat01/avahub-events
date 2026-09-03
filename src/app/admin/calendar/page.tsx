import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Newspaper,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin, getAllowedEventIds } from "@/lib/avahub/admin";
import { formatTimeFa, formatJalaliShort, toPersianDigits } from "@/lib/avahub/jalali";
import {
  WEEKDAY_HEADERS,
  jalaliTodayParts,
  buildMonthGrid,
  jalaliAddMonths,
  jalaliDayOfMonth,
} from "@/lib/avahub/jalali-grid";

// ─────────────────────────────────────────────────────────────
// تقویم ادمین — فاز L
// نمای ماهانهٔ شمسی رویدادها + مقالات منتشرشدهٔ مجله
// مدیر رویداد (غیرارشد) فقط رویدادهای تخصیص‌یافته را می‌بیند
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const EVENT_CHIP: Record<string, string> = {
  PUBLISHED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  DRAFT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  CANCELLED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  ARCHIVED: "border-white/15 bg-white/5 text-white/50",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "منتشرشده",
  DRAFT: "پیش‌نویس",
  CANCELLED: "لغو شده",
  ARCHIVED: "آرشیو",
};

const STATUS_DOT: Record<string, string> = {
  PUBLISHED: "bg-emerald-400",
  DRAFT: "bg-amber-400",
  CANCELLED: "bg-rose-400",
  ARCHIVED: "bg-white/40",
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ jy?: string; jm?: string }>;
}) {
  const session = await requireAdmin("/admin/calendar");
  const scope = await getAllowedEventIds(session);
  const scoped = scope !== null;

  const sp = await searchParams;
  const today = jalaliTodayParts();
  const jy = clampInt(sp.jy, today.jy, 1300, 1500);
  const jm = clampInt(sp.jm, today.jm, 1, 12);

  const grid = buildMonthGrid(jy, jm);
  const prev = jalaliAddMonths(jy, jm, -1);
  const next = jalaliAddMonths(jy, jm, 1);

  // رویدادهای داخل بازهٔ همین ماه شمسی
  const events = await db.event.findMany({
    where: {
      startsAt: { gte: grid.rangeStart, lt: grid.rangeEnd },
      ...(scope ? { id: { in: scope } } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      venueCity: true,
    },
  });

  // مقالات منتشرشدهٔ مجله در همین ماه — فقط مدیر ارشد
  const posts =
    session.role === "SUPER_ADMIN"
      ? await db.journalPost.findMany({
          where: { publishedAt: { gte: grid.rangeStart, lt: grid.rangeEnd } },
          orderBy: { publishedAt: "asc" },
          select: { id: true, slug: true, title: true, publishedAt: true },
        })
      : [];

  // نقشهٔ روزِ ماه → آیتم‌ها
  type Item =
    | { kind: "event"; title: string; status: string; time: string; href: string }
    | { kind: "post"; title: string; time: string; href: string };
  const byDay = new Map<number, Item[]>();
  const push = (d: Date, item: Item) => {
    const jd = jalaliDayOfMonth(d, jy, jm);
    if (jd === null) return;
    const list = byDay.get(jd) ?? [];
    list.push(item);
    byDay.set(jd, list);
  };
  for (const ev of events) {
    push(ev.startsAt, {
      kind: "event",
      title: ev.title,
      status: ev.status,
      time: formatTimeFa(ev.startsAt),
      href: `/admin/events/${ev.id}`,
    });
  }
  for (const p of posts) {
    if (p.publishedAt)
      push(p.publishedAt, {
        kind: "post",
        title: p.title,
        time: formatTimeFa(p.publishedAt),
        href: `/journal/${p.slug}`,
      });
  }

  const navCls =
    "inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition";

  return (
    <div className="space-y-6">
      {/* سربرگ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black">
            <CalendarDays className="size-7 text-[#d4af37]" aria-hidden="true" />
            تقویم رویدادها
          </h1>
          <p className="mt-2 text-white/60">
            نمای ماهانهٔ شمسی — رویدادها و مقالات منتشرشده در یک نگاه.
          </p>
          {scoped && (
            <p className="mt-3 inline-block rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs text-[#d4af37]">
              🔒 فقط رویدادهای تخصیص‌یافتهٔ شما نمایش داده می‌شود.
            </p>
          )}
        </div>

        {/* ناوبری ماه */}
        <div className="flex items-center gap-2">
          <Link href={`/admin/calendar?jy=${prev.jy}&jm=${prev.jm}`} className={navCls}>
            <ChevronRight className="size-4" aria-hidden="true" />
            ماه قبل
          </Link>
          <span className="min-w-[110px] text-center text-sm font-bold text-[#d4af37]">
            {grid.label}
          </span>
          <Link href={`/admin/calendar?jy=${next.jy}&jm=${next.jm}`} className={navCls}>
            ماه بعد
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
          {(jy !== today.jy || jm !== today.jm) && (
            <Link href="/admin/calendar" className={navCls}>
              امروز
            </Link>
          )}
        </div>
      </div>

      {/* شبکهٔ تقویم */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-3">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_HEADERS.map((w) => (
              <div
                key={w}
                className="rounded-lg bg-[#12121a] py-2 text-center text-[11px] font-bold text-white/50"
              >
                {w}
              </div>
            ))}
            {grid.weeks.flat().map((cell, i) =>
              cell === null ? (
                <div key={i} className="min-h-[96px] rounded-lg bg-[#0d0d14]/60" />
              ) : (
                <div
                  key={i}
                  className={`min-h-[96px] rounded-lg bg-[#12121a] p-1.5 ${
                    cell.isToday ? "ring-1 ring-inset ring-[#d4af37]/70" : ""
                  }`}
                >
                  <div className={`text-xs font-black ${cell.isToday ? "text-[#d4af37]" : "text-white/75"}`}>
                    {toPersianDigits(cell.jd)}
                    {cell.isToday && (
                      <span className="ms-1 text-[9px] font-normal text-[#d4af37]/70">امروز</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {(byDay.get(cell.jd) ?? []).map((item, k) =>
                      item.kind === "event" ? (
                        <Link
                          key={k}
                          href={item.href}
                          title={`${item.title} — ${item.time}`}
                          className={`block truncate rounded-md border px-1.5 py-0.5 text-[10px] leading-4 transition hover:brightness-125 ${EVENT_CHIP[item.status] ?? EVENT_CHIP.ARCHIVED}`}
                        >
                          <span className="tabular-nums">{item.time}</span> · {item.title}
                        </Link>
                      ) : (
                        <Link
                          key={k}
                          href={item.href}
                          target="_blank"
                          title={`مقاله: ${item.title}`}
                          className="block truncate rounded-md border border-[#d4af37]/30 bg-[#d4af37]/10 px-1.5 py-0.5 text-[10px] leading-4 text-[#d4af37] transition hover:brightness-125"
                        >
                          📰 {item.title}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* راهنمای رنگ‌ها */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50">
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`inline-block size-2 rounded-full ${STATUS_DOT[k]}`} />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <Newspaper className="size-3 text-[#d4af37]" aria-hidden="true" />
          مقالهٔ مجله
        </span>
      </div>

      {/* دستور کار ماه */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
        <h2 className="mb-4 font-bold">دستور کار {grid.label}</h2>
        {events.length === 0 && posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            رویداد و مقاله‌ای در این ماه ثبت نشده — با دکمه‌های «ماه قبل/بعد» ماه‌های دیگر را ببینید.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/admin/events/${ev.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm transition hover:bg-white/[0.03]"
                >
                  <span className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOT[ev.status] ?? STATUS_DOT.ARCHIVED}`} />
                  <span className="font-bold">{ev.title}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {formatTimeFa(ev.startsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {ev.venueCity}
                  </span>
                  <span className="text-xs text-white/40">{formatJalaliShort(ev.startsAt)}</span>
                  <span className="ms-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/60">
                    {STATUS_LABEL[ev.status] ?? ev.status}
                  </span>
                </Link>
              </li>
            ))}
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/journal/${p.slug}`}
                  target="_blank"
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm transition hover:bg-white/[0.03]"
                >
                  <Newspaper className="size-4 shrink-0 text-[#d4af37]" aria-hidden="true" />
                  <span className="font-bold">{p.title}</span>
                  <span className="text-xs text-white/40">
                    انتشار: {p.publishedAt ? formatJalaliShort(p.publishedAt) : "-"}
                  </span>
                  <span className="ms-auto rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-0.5 text-[10px] text-[#d4af37]">
                    مجله
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** عدد صحیح امن از کوئری‌استرینگ با محدودهٔ مجاز */
function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}
