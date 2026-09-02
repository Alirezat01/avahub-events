import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// داده‌های آمار پنل ادمین — فاز ۶ (C5)
// منبع: دیتابیس (ثبت‌نام‌ها، مخاطبان، منابع UTM، چک‌این‌ها)
// آمار بازدید صفحات با GA4 در فاز د به همین صفحه وصل می‌شود
// ─────────────────────────────────────────────────────────────

export type DailyPoint = { label: string; count: number };
export type NamedCount = { name: string; value: number };

const TEHRAN = "Asia/Tehran";

function faDay(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
    timeZone: TEHRAN,
    day: "numeric",
    month: "short",
  }).format(date);
}

/** ثبت‌نام‌های ۳۰ روز اخیر به تفکیک روز (به وقت تهران) */
export async function dailyRegistrations(days = 30): Promise<DailyPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.registration.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  // سطل روزانه به وقت تهران
  const buckets = new Map<string, { label: string; count: number; sort: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: TEHRAN,
    }).format(d);
    buckets.set(key, { label: faDay(d), count: 0, sort: days - 1 - i });
  }
  for (const r of rows) {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: TEHRAN,
    }).format(r.createdAt);
    const b = buckets.get(key);
    if (b) b.count += 1;
  }
  return [...buckets.values()].sort((a, b) => a.sort - b.sort).map(({ label, count }) => ({ label, count }));
}

/** وضعیت همهٔ ثبت‌نام‌ها */
export async function statusDistribution(): Promise<NamedCount[]> {
  const rows = await db.registration.groupBy({
    by: ["status", "cancelledBy"],
    _count: { _all: true },
  });
  const out = { confirmed: 0, pending: 0, withdrawn: 0, cancelledByAdmin: 0 };
  for (const r of rows) {
    const n = r._count._all;
    if (r.status === "CONFIRMED") out.confirmed += n;
    else if (r.status === "PENDING") out.pending += n;
    else if (r.status === "CANCELLED") {
      if (r.cancelledBy === "admin") out.cancelledByAdmin += n;
      else out.withdrawn += n;
    }
  }
  return [
    { name: "قطعی", value: out.confirmed },
    { name: "در انتظار تأیید", value: out.pending },
    { name: "انصراف کاربر", value: out.withdrawn },
    { name: "لغو ادمین", value: out.cancelledByAdmin },
  ];
}

/** پرفروش‌ترین رویدادها بر اساس ثبت‌نام قطعی */
export async function topEventsByConfirmed(limit = 8): Promise<NamedCount[]> {
  const events = await db.event.findMany({
    select: { id: true, title: true },
  });
  const rows = await db.registration.groupBy({
    by: ["eventId"],
    where: { status: "CONFIRMED" },
    _count: { _all: true },
  });
  const titleOf = new Map(events.map((e) => [e.id, e.title]));
  return rows
    .map((r) => ({ name: titleOf.get(r.eventId) ?? "—", value: r._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** منابع ثبت‌نام (UTM) — بدون مقدار = «مستقیم/QR» */
export async function sourceBreakdown(): Promise<NamedCount[]> {
  const rows = await db.registration.groupBy({
    by: ["utmSource"],
    _count: { _all: true },
  });
  return rows
    .map((r) => ({
      name: r.utmSource ? r.utmSource : "مستقیم / QR",
      value: r._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/** شهرهای مخاطبان */
export async function cityBreakdown(): Promise<NamedCount[]> {
  const rows = await db.profile.groupBy({
    by: ["city"],
    _count: { _all: true },
    where: { city: { not: null } },
  });
  return rows
    .map((r) => ({ name: r.city ?? "نامشخص", value: r._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/** شمارنده‌های کلی */
export async function analyticsTotals() {
  const [profiles, confirmed, pending, waitlist, checkins, posts, portfolio] =
    await Promise.all([
      db.profile.count(),
      db.registration.count({ where: { status: "CONFIRMED" } }),
      db.registration.count({ where: { status: "PENDING" } }),
      db.waitlist.count({ where: { status: "ACTIVE" } }),
      db.checkin.count(),
      db.journalPost.count({ where: { status: "PUBLISHED" } }),
      db.portfolioItem.count({ where: { isActive: true } }),
    ]);
  return { profiles, confirmed, pending, waitlist, checkins, posts, portfolio };
}

/** ثبت‌نام‌های چک‌این‌شده برای نمودار حضور */
export async function checkinRate(): Promise<{ name: string; value: number }[]> {
  const [confirmed, checkedIn] = await Promise.all([
    db.registration.count({ where: { status: "CONFIRMED" } }),
    db.checkin.count(),
  ]);
  const notYet = Math.max(0, confirmed - checkedIn);
  return [
    { name: "حاضر (چک‌این)", value: checkedIn },
    { name: "قطعی اما حاضر نشده", value: notYet },
  ];
}
