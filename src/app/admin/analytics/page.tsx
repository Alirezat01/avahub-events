import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/avahub/admin";
import {
  analyticsTotals,
  checkinRate,
  cityBreakdown,
  dailyRegistrations,
  sourceBreakdown,
  statusDistribution,
  topEventsByConfirmed,
} from "@/lib/avahub/analytics-data";
import {
  CheckinPie,
  EventsBarChart,
  RegistrationsAreaChart,
  SourcesBarChart,
  StatusDonut,
} from "./charts";

// ─────────────────────────────────────────────────────────────
// آمار گرافیکی — فاز ۶ (C5)
// منبع فعلی: دیتابیس (ثبت‌نام/مخاطب/منبع/چک‌این)
// آمار بازدید صفحات: اتصال GA4 در فاز د به همین صفحه اضافه می‌شود
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const kpiTone = [
  { ring: "border-[#d4af37]/40", tone: "text-[#d4af37]" },
  { ring: "border-emerald-500/30", tone: "text-emerald-300" },
  { ring: "border-amber-500/30", tone: "text-amber-300" },
  { ring: "border-sky-500/30", tone: "text-sky-300" },
  { ring: "border-purple-500/30", tone: "text-purple-300" },
  { ring: "border-white/20", tone: "text-white" },
  { ring: "border-white/20", tone: "text-white" },
  { ring: "border-white/20", tone: "text-white" },
];

export default async function AdminAnalyticsPage() {
  const [totals, daily, status, topEvents, sources, cities, checkin] = await Promise.all([
    analyticsTotals(),
    dailyRegistrations(30),
    statusDistribution(),
    topEventsByConfirmed(),
    sourceBreakdown(),
    cityBreakdown(),
    checkinRate(),
  ]);

  const kpis = [
    { label: "مخاطبان (پروفایل)", value: totals.profiles },
    { label: "ثبت‌نام قطعی", value: totals.confirmed },
    { label: "در انتظار تأیید", value: totals.pending },
    { label: "لیست انتظار فعال", value: totals.waitlist },
    { label: "چک‌این (حضور)", value: totals.checkins },
    { label: "مقالهٔ منتشرشده", value: totals.posts },
    { label: "نمونه‌کار فعال", value: totals.portfolio },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black">
          <BarChart3 className="size-7 text-[#d4af37]" aria-hidden="true" />
          آمار و تحلیل
        </h1>
        <p className="mt-2 text-white/60">
          نمای گرافیکی داده‌های پلتفرم — ثبت‌نام‌ها، منابع جذب، حضور و محتوا.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className={`rounded-2xl border ${kpiTone[i].ring} bg-[#12121a] p-4`}>
            <div className={`text-2xl font-black ${kpiTone[i].tone} tabular-nums`}>
              {k.value.toLocaleString("fa-IR")}
            </div>
            <div className="mt-1 text-[11px] text-white/60">{k.label}</div>
          </div>
        ))}
      </div>

      {/* روند ثبت‌نام */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold">روند ثبت‌نام — ۳۰ روز اخیر</h2>
          <span className="text-[11px] text-white/40">به وقت تهران</span>
        </div>
        <RegistrationsAreaChart data={daily} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* وضعیت ثبت‌نام‌ها */}
        <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
          <h2 className="mb-4 font-bold">وضعیت ثبت‌نام‌ها</h2>
          <StatusDonut data={status} />
        </section>

        {/* منابع ثبت‌نام */}
        <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
          <h2 className="mb-4 font-bold">منابع ثبت‌نام (UTM)</h2>
          {sources.some((s) => s.value > 0) ? (
            <SourcesBarChart data={sources} />
          ) : (
            <p className="py-10 text-center text-sm text-white/40">
              هنوز دادهٔ منبعی ثبت نشده — کمپین‌های UTM و QR پوسترها اینجا دیده می‌شوند.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* رویدادهای پرفروش */}
        <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
          <h2 className="mb-4 font-bold">پرثبت‌نام‌ترین رویدادها (قطعی)</h2>
          {topEvents.length > 0 ? (
            <EventsBarChart data={topEvents} />
          ) : (
            <p className="py-10 text-center text-sm text-white/40">هنوز ثبت‌نام قطعی وجود ندارد.</p>
          )}
        </section>

        {/* حضور */}
        <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
          <h2 className="mb-4 font-bold">حضور در رویدادها (چک‌این)</h2>
          {checkin.some((c) => c.value > 0) ? (
            <CheckinPie data={checkin} />
          ) : (
            <p className="py-10 text-center text-sm text-white/40">
              هنوز چک‌ینی ثبت نشده — اسکن QR در ورود رویداد اینجا جمع می‌شود.
            </p>
          )}
          <div className="mt-2 text-center text-[11px] text-white/40">
            نسبت حاضران به ثبت‌نام‌های قطعی — سنجهٔ کیفیت جذب
          </div>
        </section>
      </div>

      {/* شهرها */}
      {cities.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
          <h2 className="mb-4 font-bold">شهرهای مخاطبان</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <span
                key={c.name}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/75"
              >
                {c.name}
                <span className="ms-1.5 tabular-nums text-[#d4af37]">{c.value.toLocaleString("fa-IR")}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* جایگاه GA4 */}
      <section className="rounded-2xl border border-[#7b4ddf]/30 bg-[#7b4ddf]/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-purple-200">آمار بازدید صفحات — Google Analytics 4</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-7 text-white/65">
              اتصال GA4 برای بازدید صفحات، کاربران و مسیر ورود/خروج در فاز بعدی (سئو) فعال
              می‌شود و کارت بازدیدها همین‌جا به این بخش اضافه خواهد شد.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-400/40 px-4 py-2 text-xs text-purple-200 transition hover:bg-purple-500/10"
          >
            داشبورد
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
