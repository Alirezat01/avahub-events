import { requireAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { UtmBuilder } from "./utm-builder";
import { formatJalaliDate } from "@/lib/avahub/jalali";
import { toPersianDigits } from "@/lib/avahub/jalali";

// ─────────────────────────────────────────────────────────────
// فاز G — کمپین‌ها و لینک‌ساز UTM
// عملکرد هر کمپین از روی ثبت‌نام‌ها (campaignId) + لینک تبلیغاتی
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireAdmin();

  const [campaigns, regGroups, events] = await Promise.all([
    db.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.registration.groupBy({
      by: ["campaignId", "status"],
      _count: { _all: true },
      where: { campaignId: { not: null } },
    }),
    db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, title: true },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
  ]);

  const stats = new Map<
    string,
    { total: number; confirmed: number; cancelled: number; pending: number }
  >();
  for (const g of regGroups) {
    if (!g.campaignId) continue;
    const s = stats.get(g.campaignId) ?? { total: 0, confirmed: 0, cancelled: 0, pending: 0 };
    s.total += g._count._all;
    if (g.status === "CONFIRMED") s.confirmed += g._count._all;
    if (g.status === "CANCELLED") s.cancelled += g._count._all;
    if (g.status === "PENDING") s.pending += g._count._all;
    stats.set(g.campaignId, s);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-black">کمپین‌ها و لینک UTM</h1>
        <p className="mt-1 text-xs leading-6 text-white/50">
          عملکرد هر کمپین از روی ثبت‌نام‌های واقعی + لینک‌ساز تبلیغاتی برای شمردن منبع ورودی‌ها
        </p>
      </div>

      {/* لینک‌ساز UTM */}
      <div className="mb-8">
        <UtmBuilder
          events={events.map((e) => ({ slug: e.slug, title: e.title }))}
          campaigns={campaigns.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name, utmCampaign: c.utmCampaign, source: c.source, medium: c.medium }))}
        />
      </div>

      {/* فهرست کمپین‌ها */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
          کمپینی ثبت نشده است. کمپین‌ها از دیتابیس (جدول campaigns) خوانده می‌شوند.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-white/10 bg-white/[0.04] text-white/50">
              <tr>
                <th className="px-4 py-3 font-bold">کمپین</th>
                <th className="px-4 py-3 font-bold">منبع / نوع</th>
                <th className="px-4 py-3 font-bold">ثبت‌نام</th>
                <th className="px-4 py-3 font-bold">قطعی</th>
                <th className="px-4 py-3 font-bold">در انتظار</th>
                <th className="px-4 py-3 font-bold">انصراف</th>
                <th className="px-4 py-3 font-bold">نرخ تبدیل</th>
                <th className="px-4 py-3 font-bold">ساخته</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const s = stats.get(c.id) ?? { total: 0, confirmed: 0, cancelled: 0, pending: 0 };
                const rate = s.total > 0 ? Math.round((s.confirmed / s.total) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white/90">{c.name}</div>
                      {c.utmCampaign && (
                        <code dir="ltr" className="text-[10px] text-white/35">
                          {c.utmCampaign}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {c.source}
                      {c.medium ? ` / ${c.medium}` : ""}
                    </td>
                    <td className="px-4 py-3 font-black text-white">{toPersianDigits(s.total)}</td>
                    <td className="px-4 py-3 text-emerald-300">{toPersianDigits(s.confirmed)}</td>
                    <td className="px-4 py-3 text-sky-300">{toPersianDigits(s.pending)}</td>
                    <td className="px-4 py-3 text-rose-300">{toPersianDigits(s.cancelled)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          rate >= 50
                            ? "bg-emerald-500/15 text-emerald-300"
                            : rate >= 25
                              ? "bg-[#d4af37]/15 text-[#d4af37]"
                              : "bg-white/5 text-white/50"
                        }`}
                      >
                        {toPersianDigits(rate)}٪
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/35">{formatJalaliDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
