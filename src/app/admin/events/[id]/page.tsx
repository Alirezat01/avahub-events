import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { setEventStatusAction } from "@/app/admin/events/actions";
import {
  eventCounts,
  eventRegistrants,
  eventWaitlist,
  fmtFa,
  registrationLabel,
  STATUS_BADGE_CLASS,
} from "@/lib/avahub/admin-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────────────────────
// صفحه مدیریتی هر رویداد — فاز ۵
// شمارش زنده وضعیت‌ها + لیست ثبت‌نامی‌ها + لیست انتظار
// ⭐ دکمه‌های استخراج CSV شماره‌ها با فیلتر وضعیت
// ─────────────────────────────────────────────────────────────

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const ev = await db.event.findUnique({
    where: { id },
    select: {
      id: true, slug: true, title: true, startsAt: true,
      status: true, venueCity: true, venueName: true,
    },
  });
  if (!ev) notFound();

  const [counts, registrants, waitlist] = await Promise.all([
    eventCounts(id),
    eventRegistrants(id),
    eventWaitlist(id),
  ]);

  const active = ev.status === "PUBLISHED";
  const flash =
    sp.created === "1" ? "رویداد با موفقیت ساخته شد." : sp.updated === "1" ? "تغییرات ذخیره شد." : null;

  const csvBase = `/admin/events/${id}/export`;
  const exportBtn =
    "rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-2 text-xs font-bold text-[#d4af37] hover:bg-[#d4af37]/20 transition";

  return (
    <div className="space-y-8">
      {flash && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {flash}
        </div>
      )}

      {/* سربرگ ایونت */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black">{ev.title}</h1>
          <p className="mt-2 text-sm text-white/60">
            {fmtFa(ev.startsAt)} — {ev.venueCity}
            {ev.venueName ? `، ${ev.venueName}` : ""}
          </p>
          <p className="mt-1 text-xs text-white/40" dir="ltr">
            /events/{ev.slug}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/events/${id}/edit`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            ویرایش رویداد
          </Link>
          <Link
            href={`/events/${ev.slug}`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            مشاهده در سایت ↗
          </Link>
        </div>
      </div>

      {/* کنترل انتشار */}
      <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">وضعیت فعلی:</span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              active
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : ev.status === "DRAFT"
                  ? "border-white/20 bg-white/10 text-white/70"
                  : "border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            {active ? "منتشر شده" : ev.status === "DRAFT" ? "پیش‌نویس" : ev.status === "CANCELLED" ? "لغو شده" : "آرشیو"}
          </span>

          <form action={setEventStatusAction} className="inline">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={active ? "DRAFT" : "PUBLISHED"} />
            <button
              type="submit"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                active
                  ? "border border-white/15 hover:bg-white/5"
                  : "bg-emerald-500 text-[#0a0a0f] hover:brightness-110"
              }`}
            >
              {active ? "پنهان کردن از سایت" : "انتشار در سایت"}
            </button>
          </form>

          <form action={setEventStatusAction} className="inline">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="CANCELLED" />
            <button
              type="submit"
              className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10"
            >
              لغو رویداد
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-white/40 leading-6">
          برای اطلاع‌رسانی کنسلی، شماره‌های «قطعی» را از دکمه‌های استخراج پایین صفحه بگیرید.
        </p>
      </div>

      {/* شمارش وضعیت‌ها */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "قطعی", value: counts.confirmed, cls: "text-emerald-300 border-emerald-500/30" },
          { label: "لیست انتظار", value: counts.waitlist, cls: "text-sky-300 border-sky-500/30" },
          { label: "انصراف کاربر", value: counts.withdrawnByUser, cls: "text-rose-300 border-rose-500/30" },
          { label: "لغو ادمین", value: counts.cancelledByAdmin, cls: "text-rose-400 border-rose-700/40" },
          { label: "در انتظار تأیید", value: counts.pending, cls: "text-amber-300 border-amber-500/30" },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl border ${c.cls} bg-[#12121a] p-4`}>
            <div className={`text-3xl font-black tabular-nums ${c.cls.split(" ")[0]}`}>
              {c.value.toLocaleString("fa-IR")}
            </div>
            <div className="mt-1 text-xs text-white/60">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ⭐ استخراج CSV */}
      <div className="rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/[0.04] p-5">
        <h2 className="font-bold text-[#d4af37]">استخراج شماره‌ها (CSV — سازگار با اکسل)</h2>
        <p className="mt-1 text-xs text-white/60 leading-6">
          خروجی شامل نام، ایمیل، موبایل، وضعیت، زمان ثبت‌نام و اطلاعات توافق‌نامه است و مستقیم برای
          پنل پیامک قابل استفاده می‌باشد.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a className={exportBtn} href={`${csvBase}?status=CONFIRMED`}>
            ⬇ فقط قطعی‌ها (برای اطلاع‌رسانی)
          </a>
          <a className={exportBtn} href={`${csvBase}?status=WAITLIST`}>
            ⬇ لیست انتظار
          </a>
          <a className={exportBtn} href={`${csvBase}?status=CANCELLED`}>
            ⬇ انصراف/لغو شده‌ها
          </a>
          <a className={exportBtn} href={`${csvBase}?status=ALL`}>
            ⬇ همه ثبت‌نامی‌ها
          </a>
        </div>
      </div>

      {/* جدول ثبت‌نامی‌ها */}
      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 font-bold">ثبت‌نامی‌ها ({registrants.length.toLocaleString("fa-IR")} نفر)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-right text-white/50 border-b border-white/10">
                <th className="px-5 py-3 font-medium">نام</th>
                <th className="px-3 py-3 font-medium">موبایل</th>
                <th className="px-3 py-3 font-medium">ایمیل</th>
                <th className="px-3 py-3 font-medium">وضعیت</th>
                <th className="px-3 py-3 font-medium">زمان ثبت</th>
                <th className="px-3 py-3 font-medium">توافق‌نامه</th>
                <th className="px-5 py-3 font-medium">منبع</th>
              </tr>
            </thead>
            <tbody>
              {registrants.map((r) => {
                const label = registrationLabel(r.status, r.cancelledBy);
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3">{r.fullName ?? <span className="text-white/40">—</span>}</td>
                    <td className="px-3 py-3 tabular-nums" dir="ltr">
                      {r.phone ?? <span className="text-white/40">—</span>}
                    </td>
                    <td className="px-3 py-3 text-white/70" dir="ltr">
                      {r.email}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                          STATUS_BADGE_CLASS[label] ?? "border-white/20 bg-white/10 text-white/70"
                        }`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-white/70">{fmtFa(r.createdAt)}</td>
                    <td className="px-3 py-3 text-xs text-white/60 whitespace-nowrap">
                      {r.consentVersion ? (
                        <span title={fmtFa(r.consentAcceptedAt)}>
                          ✓ {r.consentVersion}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/50" dir="ltr">
                      {r.utmSource ?? "direct"}
                    </td>
                  </tr>
                );
              })}
              {registrants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-white/50">
                    هنوز ثبت‌نامی برای این رویداد انجام نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* لیست انتظار */}
      {waitlist.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 font-bold">
            لیست انتظار ({waitlist.length.toLocaleString("fa-IR")} نفر)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-right text-white/50 border-b border-white/10">
                  <th className="px-5 py-3 font-medium">نوبت</th>
                  <th className="px-3 py-3 font-medium">نام</th>
                  <th className="px-3 py-3 font-medium">موبایل</th>
                  <th className="px-3 py-3 font-medium">ایمیل</th>
                  <th className="px-5 py-3 font-medium">زمان درخواست</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w) => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="px-5 py-3 font-bold text-sky-300 tabular-nums">
                      {w.position.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-3 py-3">{w.profile.fullName ?? "—"}</td>
                    <td className="px-3 py-3 tabular-nums" dir="ltr">
                      {w.profile.phone ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-white/70" dir="ltr">
                      {w.profile.email}
                    </td>
                    <td className="px-5 py-3 text-white/70 whitespace-nowrap">{fmtFa(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

