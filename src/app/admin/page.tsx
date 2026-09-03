import Link from "next/link";
import { adminEventRows, globalCounts, fmtFa } from "@/lib/avahub/admin-data";
import { adminNotifications } from "@/lib/avahub/admin-notifications";
import { EventStatus } from "@prisma/client";
import { cloneEventAction } from "@/app/admin/events/actions";

// ─────────────────────────────────────────────────────────────
// داشبورد پنل ادمین — فاز ۵
// آمار کلی + جدول همه ایونت‌ها با شمارش قطعی/انتظار/انصراف/لغو
// ─────────────────────────────────────────────────────────────

const EVENT_STATUS_FA: Record<EventStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشر شده",
  CANCELLED: "لغو شده",
  ARCHIVED: "آرشیو",
};

const EVENT_STATUS_CLASS: Record<EventStatus, string> = {
  DRAFT: "bg-white/10 text-white/70 border-white/20",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  ARCHIVED: "bg-white/5 text-white/50 border-white/10",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string; q?: string; cloned?: string }>;
}) {
  const sp = await searchParams;
  const [g, allRows, notes] = await Promise.all([globalCounts(), adminEventRows(), adminNotifications()]);

  // فاز E: فیلتر وضعیت / شهر / جستجو
  const rows = allRows.filter((e) => {
    if (sp.status && e.status !== (sp.status as EventStatus)) return false;
    if (sp.city && e.venueCity !== sp.city) return false;
    if (sp.q && !(e.title + e.slug).toLowerCase().includes(sp.q.toLowerCase())) return false;
    return true;
  });

  const cities = Array.from(new Set(allRows.map((e) => e.venueCity))).filter(Boolean);

  const kpis = [
    { label: "ثبت‌نام قطعی", value: g.confirmed, tone: "text-emerald-300", ring: "border-emerald-500/30" },
    { label: "لیست انتظار فعال", value: g.activeWaitlist, tone: "text-sky-300", ring: "border-sky-500/30" },
    { label: "انصراف کاربر", value: g.withdrawnByUser, tone: "text-rose-300", ring: "border-rose-500/30" },
    { label: "لغو ادمین", value: g.cancelledByAdmin, tone: "text-rose-400", ring: "border-rose-700/40" },
    { label: "رویداد آینده", value: g.upcomingEvents, tone: "text-[#d4af37]", ring: "border-[#d4af37]/40" },
    { label: "کل ایونت‌ها", value: g.totalEvents, tone: "text-white", ring: "border-white/20" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">داشبورد</h1>
        <p className="mt-2 text-white/60">
          نمای کلی ثبت‌نام‌ها و رویدادها — برای جزئیات و استخراج شماره‌ها وارد صفحه هر رویداد شوید.
        </p>
        {sp.cloned && (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            ✅ رویداد کپی شد — در حالت پیش‌نویس؛ تاریخ و جزئیات را ویرایش کنید.
          </p>
        )}
      </div>

      {/* اعلان‌ها — فاز G */}
      {notes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {notes.map((n) => {
            const toneCls =
              n.tone === "gold"
                ? "border-[#d4af37]/40 bg-[#d4af37]/[0.07]"
                : n.tone === "emerald"
                  ? "border-emerald-500/30 bg-emerald-500/[0.07]"
                  : n.tone === "sky"
                    ? "border-sky-500/30 bg-sky-500/[0.07]"
                    : "border-rose-500/30 bg-rose-500/[0.07]";
            const textCls =
              n.tone === "gold"
                ? "text-[#d4af37]"
                : n.tone === "emerald"
                  ? "text-emerald-300"
                  : n.tone === "sky"
                    ? "text-sky-300"
                    : "text-rose-300";
            return (
              <Link
                key={n.title}
                href={n.href}
                className={`rounded-2xl border p-4 transition hover:brightness-125 ${toneCls}`}
              >
                <p className={`text-xs font-black ${textCls}`}>{n.title}</p>
                <p className="mt-1.5 text-lg font-black text-white">{n.value}</p>
                <p className="mt-1 text-[10px] text-white/40">{n.cta} ←</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* فیلترها — فاز E */}
      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#12121a] p-4" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="جستجوی عنوان…"
          className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[#d4af37]/60"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm outline-none"
        >
          <option value="">همهٔ وضعیت‌ها</option>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشر شده</option>
          <option value="CANCELLED">لغو شده</option>
          <option value="ARCHIVED">آرشیو</option>
        </select>
        <select
          name="city"
          defaultValue={sp.city ?? ""}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm outline-none"
        >
          <option value="">همهٔ شهرها</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-sm font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20">
          اعمال فیلتر
        </button>
        <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5">
          حذف فیلتر
        </Link>
      </form>

      {/* KPIها */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl border ${k.ring} bg-[#12121a] p-4`}>
            <div className={`text-3xl font-black ${k.tone} tabular-nums`}>{k.value.toLocaleString("fa-IR")}</div>
            <div className="mt-1 text-xs text-white/60">{k.label}</div>
          </div>
        ))}
      </div>

      {/* جدول ایونت‌ها */}
      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h2 className="font-bold">رویدادها و شمارش ثبت‌نام</h2>
          <Link
            href="/admin/events/new"
            className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
          >
            + رویداد جدید
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-right text-white/50 border-b border-white/10">
                <th className="px-5 py-3 font-medium">رویداد</th>
                <th className="px-3 py-3 font-medium">زمان</th>
                <th className="px-3 py-3 font-medium">وضعیت</th>
                <th className="px-3 py-3 font-medium">قطعی</th>
                <th className="px-3 py-3 font-medium">انتظار</th>
                <th className="px-3 py-3 font-medium">انصراف</th>
                <th className="px-3 py-3 font-medium">لغو ادمین</th>
                <th className="px-3 py-3 font-medium">پرشدن ظرفیت</th>
                <th className="px-5 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const fill =
                  e.capacity > 0 ? Math.min(100, Math.round((e.counts.confirmed / e.capacity) * 100)) : null;
                return (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3">
                      <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-[#d4af37] transition">
                        {e.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-white/40" dir="ltr">
                        /events/{e.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-white/70">{fmtFa(e.startsAt)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${EVENT_STATUS_CLASS[e.status]}`}
                      >
                        {EVENT_STATUS_FA[e.status]}
                      </span>
                      {e.isFeatured && (
                        <span className="ml-1 inline-block rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-2 py-0.5 text-[10px] text-[#d4af37]">
                          ویژه
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-bold text-emerald-300 tabular-nums">
                      {e.counts.confirmed.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-3 py-3 text-sky-300 tabular-nums">
                      {e.counts.waitlist.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-3 py-3 text-rose-300 tabular-nums">
                      {e.counts.withdrawnByUser.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-3 py-3 text-rose-400 tabular-nums">
                      {e.counts.cancelledByAdmin.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-3 py-3">
                      {fill === null ? (
                        <span className="text-white/40">بدون محدودیت</span>
                      ) : (
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${fill >= 100 ? "bg-rose-400" : "bg-[#d4af37]"}`}
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/60 tabular-nums">{fill.toLocaleString("fa-IR")}٪</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/${e.id}`}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                        >
                          مدیریت
                        </Link>
                        <Link
                          href={`/admin/events/${e.id}/edit`}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                        >
                          ویرایش
                        </Link>
                        <Link
                          href={`/admin/events/${e.id}#qr`}
                          title="کد QR ثبت‌نام برای پوستر و چاپ"
                          className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-bold text-[#d4af37] hover:bg-[#d4af37]/20 transition"
                        >
                          QR
                        </Link>
                        {/* فاز E: کلون ایونت */}
                        <form action={cloneEventAction}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            title="ساخت کپی از این رویداد (پیش‌نویس)"
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                          >
                            کپی
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-white/50">
                    هنوز رویدادی ساخته نشده — با دکمه «رویداد جدید» شروع کنید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
