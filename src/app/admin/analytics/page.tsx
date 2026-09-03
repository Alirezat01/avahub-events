import { BarChart3, Eye, Globe } from "lucide-react";
import { requireAdmin, getAllowedEventIds } from "@/lib/avahub/admin";
import { ga4Overview } from "@/lib/avahub/ga4";
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
// آمار گرافیکی — فاز ۶ (C5) + فاز L (GA4 زنده)
// منبع: دیتابیس (ثبت‌نام/مخاطب/منبع/چک‌این) + GA4 Data API (بازدید)
// GA4 فقط برای مدیر ارشد — با متغیرهای GA4_* فعال می‌شود
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
  // فاز K — مدیر رویداد فقط آمار رویدادهای تخصیص‌یافته را می‌بیند
  const session = await requireAdmin("/admin/analytics");
  const scope = await getAllowedEventIds(session);
  const scoped = scope !== null;
  const [totals, daily, status, topEvents, sources, cities, checkin] = await Promise.all([
    analyticsTotals(scope),
    dailyRegistrations(30, scope),
    statusDistribution(scope),
    topEventsByConfirmed(8, scope),
    sourceBreakdown(scope),
    cityBreakdown(scope),
    checkinRate(scope),
  ]);
  // فاز L — بازدید واقعی GA4 فقط برای مدیر ارشد؛ اگر متغیرها ست نباشد کارت راهنما می‌آید
  const ga4 = scoped ? ({ configured: false } as const) : await ga4Overview();

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
        {scoped && (
          <p className="mt-3 inline-block rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs text-[#d4af37]">
            🔒 نمایش فقط رویدادهای تخصیص‌یافتهٔ شما — آمار سراسری سایت برای مدیر ارشد است.
          </p>
        )}
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

      {/* بازدید سایت — GA4 زنده (فاز L) — فقط مدیر ارشد */}
      {!scoped && (
        <section className="rounded-2xl border border-[#7b4ddf]/30 bg-[#7b4ddf]/10 p-5">
          <h2 className="flex items-center gap-2 font-bold text-purple-200">
            <Eye className="size-5" aria-hidden="true" />
            بازدید سایت — Google Analytics 4 (۲۸ روز اخیر)
          </h2>

          {ga4.configured === false ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-7 text-white/65">
                برای دیدن آمار بازدید واقعی سایت (کاربر فعال، نشست، بازدید صفحه و پربازدیدترین صفحات)،
                این ۴ قدم را در گوگل و Vercel انجام دهید:
              </p>
              <ol className="space-y-2 text-xs leading-6 text-white/60">
                <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <b className="text-white/85">۱) GA4:</b> در analytics.google.com یک Property و یک Data Stream بسازید و Property ID عددی را بردارید (Admin → Property Settings).
                </li>
                <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <b className="text-white/85">۲) گوگل‌کلاود:</b> یک Service Account بسازید و کلید JSON (نقش فقط‌خواندن) بگیرید؛ سپس در Cloud Console، «Google Analytics Data API» را Enable کنید.
                </li>
                <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <b className="text-white/85">۳) دسترسی:</b> در GA4 → Admin → Property Access Management، ایمیل سرویس‌اکانت را با نقش <b>Viewer</b> اضافه کنید.
                </li>
                <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <b className="text-white/85">۴) Vercel:</b> سه متغیر <code dir="ltr" className="rounded bg-white/10 px-1">GA4_PROPERTY_ID</code>، <code dir="ltr" className="rounded bg-white/10 px-1">GA4_CLIENT_EMAIL</code>، <code dir="ltr" className="rounded bg-white/10 px-1">GA4_PRIVATE_KEY</code> را در Production بگذارید و Redeploy بزنید.
                </li>
              </ol>
              <p className="text-[11px] text-white/40">
                راهنمای کامل قدم‌به‌قدم داخل فایل README-KL بستهٔ تحویلی آمده است.
              </p>
            </div>
          ) : "error" in ga4 ? (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs leading-6 text-rose-300">
              اتصال GA4 برقرار نشد: {ga4.error}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "کاربر فعال", value: ga4.data.activeUsers, tone: "text-sky-300", ring: "border-sky-500/30" },
                  { label: "نشست", value: ga4.data.sessions, tone: "text-emerald-300", ring: "border-emerald-500/30" },
                  { label: "بازدید صفحه", value: ga4.data.pageViews, tone: "text-[#d4af37]", ring: "border-[#d4af37]/40" },
                ].map((k) => (
                  <div key={k.label} className={`rounded-2xl border ${k.ring} bg-black/20 p-4`}>
                    <div className={`text-2xl font-black tabular-nums ${k.tone}`}>
                      {k.value.toLocaleString("fa-IR")}
                    </div>
                    <div className="mt-1 text-[11px] text-white/60">{k.label}</div>
                  </div>
                ))}
              </div>
              {ga4.data.pages.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/70">
                    <Globe className="size-3.5" aria-hidden="true" />
                    پربازدیدترین صفحات
                  </h3>
                  <div className="space-y-1">
                    {ga4.data.pages.map((p) => (
                      <div key={p.path} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <code dir="ltr" className="truncate text-[11px] text-white/75">{p.path}</code>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-[#d4af37]">
                          {p.views.toLocaleString("fa-IR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
