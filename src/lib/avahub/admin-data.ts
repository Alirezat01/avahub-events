import { db } from "@/lib/db";
import type { EventStatus, RegistrationStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// پرس‌وجوهای پنل ادمین — فاز ۵
// برچسب‌های وضعیت و شمارش‌ها دقیقاً طبق خواسته کاربر:
// قطعی / لیست انتظار / انصراف کاربر / لغو ادمین / در انتظار
// ─────────────────────────────────────────────────────────────

export type RegistrationRowView = {
  id: string;
  status: RegistrationStatus;
  createdAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  consentVersion: string | null;
  consentAcceptedAt: Date | null;
  utmSource: string | null;
  notes: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
};

/** برچسب فارسی وضعیت ثبت‌نام — با تفکیک مسئول لغو */
export function registrationLabel(
  status: RegistrationStatus,
  cancelledBy: string | null
): string {
  if (status === "CONFIRMED") return "قطعی";
  if (status === "PENDING") return "در انتظار تأیید";
  if (status === "CANCELLED") return cancelledBy === "admin" ? "لغو ادمین" : "انصراف کاربر";
  return status;
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  "قطعی": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "در انتظار تأیید": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "انصراف کاربر": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "لغو ادمین": "bg-rose-700/20 text-rose-300 border-rose-700/40",
  "لیست انتظار": "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

/** شمارش ثبت‌نام‌های یک ایونت به تفکیک وضعیت (با تفکیک انصراف کاربر/ادمین) */
export async function eventCounts(eventId: string) {
  const rows = await db.registration.groupBy({
    by: ["status", "cancelledBy"],
    where: { eventId },
    _count: { _all: true },
  });
  const out = {
    confirmed: 0,
    pending: 0,
    withdrawnByUser: 0,
    cancelledByAdmin: 0,
    waitlist: 0,
  };
  for (const r of rows) {
    const n = r._count._all;
    if (r.status === "CONFIRMED") out.confirmed += n;
    else if (r.status === "PENDING") out.pending += n;
    else if (r.status === "CANCELLED") {
      if (r.cancelledBy === "admin") out.cancelledByAdmin += n;
      else out.withdrawnByUser += n;
    }
  }
  const wl = await db.waitlist.count({ where: { eventId, status: "ACTIVE" } });
  out.waitlist = wl;
  return out;
}

/** آمار کلی داشبورد — همه ایونت‌ها */
export async function globalCounts() {
  const [totalEvents, publishedEvents, upcomingEvents, regRows, activeWaitlist] =
    await Promise.all([
      db.event.count(),
      db.event.count({ where: { status: "PUBLISHED" } }),
      db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date() } } }),
      db.registration.groupBy({ by: ["status", "cancelledBy"], _count: { _all: true } }),
      db.waitlist.count({ where: { status: "ACTIVE" } }),
    ]);

  const reg = { confirmed: 0, pending: 0, withdrawnByUser: 0, cancelledByAdmin: 0 };
  for (const r of regRows) {
    const n = r._count._all;
    if (r.status === "CONFIRMED") reg.confirmed += n;
    else if (r.status === "PENDING") reg.pending += n;
    else if (r.status === "CANCELLED") {
      if (r.cancelledBy === "admin") reg.cancelledByAdmin += n;
      else reg.withdrawnByUser += n;
    }
  }
  return { totalEvents, publishedEvents, upcomingEvents, activeWaitlist, ...reg };
}

/** ردیف‌های جدول داشبورد: هر ایونت + شمارش‌هایش */
export async function adminEventRows() {
  const events = await db.event.findMany({
    orderBy: [{ startsAt: "desc" }],
    select: {
      id: true, slug: true, title: true, startsAt: true, capacity: true,
      status: true, isFeatured: true, venueCity: true,
    },
  });
  const regRows = await db.registration.groupBy({
    by: ["eventId", "status", "cancelledBy"],
    _count: { _all: true },
  });
  const wlRows = await db.waitlist.groupBy({
    by: ["eventId", "status"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  return events.map((e) => {
    const c = { confirmed: 0, pending: 0, withdrawnByUser: 0, cancelledByAdmin: 0, waitlist: 0 };
    for (const r of regRows) {
      if (r.eventId !== e.id) continue;
      const n = r._count._all;
      if (r.status === "CONFIRMED") c.confirmed += n;
      else if (r.status === "PENDING") c.pending += n;
      else if (r.status === "CANCELLED") {
        if (r.cancelledBy === "admin") c.cancelledByAdmin += n;
        else c.withdrawnByUser += n;
      }
    }
    for (const w of wlRows) if (w.eventId === e.id) c.waitlist += w._count._all;
    return { ...e, counts: c };
  });
}

/** لیست ثبت‌نامی‌های یک ایونت (JOIN پروفایل) */
export async function eventRegistrants(eventId: string): Promise<RegistrationRowView[]> {
  const rows = await db.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, status: true, createdAt: true, confirmedAt: true,
      cancelledAt: true, cancelledBy: true, consentVersion: true,
      consentAcceptedAt: true, utmSource: true, notes: true,
      profile: {
        select: { fullName: true, email: true, phone: true, city: true },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    confirmedAt: r.confirmedAt,
    cancelledAt: r.cancelledAt,
    cancelledBy: r.cancelledBy,
    consentVersion: r.consentVersion,
    consentAcceptedAt: r.consentAcceptedAt,
    utmSource: r.utmSource,
    notes: r.notes,
    fullName: r.profile.fullName,
    email: r.profile.email,
    phone: r.profile.phone,
    city: r.profile.city,
  }));
}

/** لیست انتظار یک ایونت */
export async function eventWaitlist(eventId: string) {
  return db.waitlist.findMany({
    where: { eventId },
    orderBy: { position: "asc" },
    select: {
      id: true, position: true, status: true, createdAt: true,
      profile: { select: { fullName: true, email: true, phone: true } },
    },
  });
}

/** تغییر وضعیت انتشار ایونت */
export async function setEventStatus(eventId: string, status: EventStatus) {
  await db.event.update({ where: { id: eventId }, data: { status } });
}

/** فرمت تاریخ شمسی/ساده برای نمایش در پنل */
export function fmtFa(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(d);
}
