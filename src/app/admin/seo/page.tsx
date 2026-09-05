import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, SearchCheck, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/avahub/admin";
import { SERVICES } from "@/lib/avahub/services";
import { EVENT_TYPE_LANDINGS } from "@/lib/avahub/event-types";
import { SITE_URL } from "@/lib/avahub/site";
import { ConfirmSubmit } from "@/components/avahub/confirm-submit";
import { autoFillMetaAction } from "./actions";

// ─────────────────────────────────────────────────────────────
// SEO Command Center — فاز M
// ممیزی زندهٔ همهٔ صفحات ایندکس‌شدنی + کنترل کیفیت خودکار متا
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type MetaStatus = "ok" | "warn" | "missing";

function judgeTitle(v: string | null | undefined): MetaStatus {
  const t = (v ?? "").trim();
  if (!t) return "missing";
  if (t.length < 20 || t.length > 65) return "warn";
  return "ok";
}
function judgeDesc(v: string | null | undefined): MetaStatus {
  const t = (v ?? "").trim();
  if (!t) return "missing";
  if (t.length < 50 || t.length > 165) return "warn";
  return "ok";
}

const STATUS_ICON: Record<MetaStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="size-4 text-emerald-400" aria-label="مناسب" />,
  warn: <AlertTriangle className="size-4 text-amber-400" aria-label="نیازمند بهبود" />,
  missing: <XCircle className="size-4 text-rose-400" aria-label="خالی" />,
};

type Row = {
  kind: string;
  title: string;
  url: string;
  titleStatus: MetaStatus;
  descStatus: MetaStatus;
  hasImage: boolean;
  slugNote?: string;
};

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireSuperAdmin("/admin/seo");
  const sp = await searchParams;

  // فاز H/M — قطعی لحظه‌ای دیتابیس، صفحه را نمی‌شکند (ردیف‌های خالی + هشدار)
  let events: Array<{ slug: string; title: string; coverImage: string | null; metaTitle: string | null; metaDescription: string | null }> = [];
  let cases: Array<{ slug: string | null; title: string; coverImage: string | null; seoTitle: string | null; seoDescription: string | null }> = [];
  let posts: Array<{ slug: string; title: string; coverImage: string | null; metaTitle: string | null; metaDescription: string | null }> = [];
  let dbError = false;
  try {
    [events, cases, posts] = await Promise.all([
      db.event.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { startsAt: "desc" },
        select: { slug: true, title: true, coverImage: true, metaTitle: true, metaDescription: true },
      }),
      db.portfolioItem.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        select: { slug: true, title: true, coverImage: true, seoTitle: true, seoDescription: true },
      }),
      db.journalPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { slug: true, title: true, coverImage: true, metaTitle: true, metaDescription: true },
      }),
    ]);
  } catch {
    dbError = true;
  }

  const rows: Row[] = [
    ...events.map((e) => ({
      kind: "رویداد",
      title: e.title,
      url: `/events/${e.slug}`,
      titleStatus: judgeTitle(e.metaTitle),
      descStatus: judgeDesc(e.metaDescription),
      hasImage: Boolean(e.coverImage),
      slugNote: /^event-[a-z0-9]+$/.test(e.slug) ? "اسلاگ خودکار — بهتر است دستی اصلاح شود" : undefined,
    })),
    ...cases.map((c) => ({
      kind: "نمونه‌کار",
      title: c.title,
      url: c.slug ? `/portfolio/${c.slug}` : "— بدون اسلاگ",
      titleStatus: judgeTitle(c.seoTitle),
      descStatus: judgeDesc(c.seoDescription),
      hasImage: Boolean(c.coverImage),
      slugNote: c.slug ? undefined : "بدون اسلاگ — صفحهٔ کیس‌استادی ندارد",
    })),
    ...posts.map((p) => ({
      kind: "مجله",
      title: p.title,
      url: `/journal/${p.slug}`,
      titleStatus: judgeTitle(p.metaTitle),
      descStatus: judgeDesc(p.metaDescription),
      hasImage: Boolean(p.coverImage),
    })),
    ...SERVICES.map((s) => ({
      kind: "خدمت",
      title: s.title,
      url: `/services/${s.slug}`,
      titleStatus: judgeTitle(s.seoTitle),
      descStatus: judgeDesc(s.seoDescription),
      hasImage: true,
    })),
    ...EVENT_TYPE_LANDINGS.map((t) => ({
      kind: "لندینگ نوع",
      title: t.h1,
      url: `/event-types/${t.slug}`,
      titleStatus: judgeTitle(t.seoTitle),
      descStatus: judgeDesc(t.seoDescription),
      hasImage: true,
    })),
  ];

  const scored = rows.filter((r) => r.titleStatus !== "missing" || r.descStatus !== "missing");
  const score = Math.round(
    (rows.reduce(
      (acc, r) => acc + (r.titleStatus === "ok" ? 1 : r.titleStatus === "warn" ? 0.5 : 0) + (r.descStatus === "ok" ? 1 : r.descStatus === "warn" ? 0.5 : 0),
      0,
    ) /
      (rows.length * 2)) *
      100,
  );
  const missingCount = rows.length - scored.length;
  const warnCount = rows.filter((r) => r.titleStatus === "warn" || r.descStatus === "warn").length;

  const cards = [
    { label: "امتیاز سلامت متا", value: `${score.toLocaleString("fa-IR")}٪`, tone: score >= 80 ? "text-emerald-300 border-emerald-500/30" : score >= 50 ? "text-amber-300 border-amber-500/30" : "text-rose-300 border-rose-500/30" },
    { label: "صفحات ایندکس‌شدنی", value: rows.length.toLocaleString("fa-IR"), tone: "text-white border-white/20" },
    { label: "متای خالی", value: missingCount.toLocaleString("fa-IR"), tone: missingCount ? "text-rose-300 border-rose-500/30" : "text-emerald-300 border-emerald-500/30" },
    { label: "نیازمند بهبود", value: warnCount.toLocaleString("fa-IR"), tone: warnCount ? "text-amber-300 border-amber-500/30" : "text-emerald-300 border-emerald-500/30" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black">
            <SearchCheck className="size-7 text-[#d4af37]" aria-hidden="true" />
            مرکز فرماندهی سئو
          </h1>
          <p className="mt-2 max-w-2xl text-white/60">
            ممیزی زندهٔ همهٔ صفحات ایندکس‌شدنی سایت — کیفیت متا، اسلاگ و تصویر. با یک دکمه، متاهای خالی به‌صورت خودکار از محتوای واقعی ساخته می‌شوند.
          </p>
        </div>
        <form action={autoFillMetaAction}>
          <ConfirmSubmit
            message="متاهای خالی به‌صورت خودکار از عنوان و خلاصهٔ محتوا ساخته شوند؟ (متاهای پرشده دست نمی‌خورند)"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2.5 text-sm font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20"
          >
            <Zap className="size-4" aria-hidden="true" />
            پرکردن خودکار متاهای خالی
          </ConfirmSubmit>
        </form>
      </div>

      {sp.ok !== undefined && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          ✓ {Number(sp.ok || 0).toLocaleString("fa-IR")} مورد اصلاح شد.
        </p>
      )}

      {dbError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          ⚠ موقتاً به دیتابیس دسترسی نیست — فقط صفحات ثابت (خدمات و لندینگ انواع) ممیزی شده‌اند. چند لحظه بعد رفرش کنید.
        </p>
      )}

      {/* کارت‌های وضعیت */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border ${c.tone} bg-[#12121a] p-4`}>
            <div className="text-2xl font-black tabular-nums">{c.value}</div>
            <div className="mt-1 text-[11px] text-white/60">{c.label}</div>
          </div>
        ))}
      </div>

      {/* جدول ممیزی */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5">
        <h2 className="mb-4 font-bold">ممیزی کامل صفحات</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] text-white/50">
                <th className="pb-2 font-normal">نوع</th>
                <th className="pb-2 font-normal">عنوان</th>
                <th className="pb-2 font-normal">آدرس</th>
                <th className="pb-2 font-normal">متا تیتر</th>
                <th className="pb-2 font-normal">متا توضیح</th>
                <th className="pb-2 font-normal">تصویر OG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={`${r.kind}-${r.url}`} className="align-middle">
                  <td className="py-2.5 text-[11px] text-white/50">{r.kind}</td>
                  <td className="max-w-[220px] truncate py-2.5 font-bold">
                    {r.title}
                    {r.slugNote && (
                      <span className="ms-2 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-normal text-amber-300" title={r.slugNote}>
                        ⚠ اسلاگ
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {r.url.startsWith("/") ? (
                      <Link href={r.url} target="_blank" dir="ltr" className="block max-w-[220px] truncate text-[11px] text-sky-300/80 hover:text-sky-300">
                        {r.url}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-rose-300/80">{r.url}</span>
                    )}
                  </td>
                  <td className="py-2.5">{STATUS_ICON[r.titleStatus]}</td>
                  <td className="py-2.5">{STATUS_ICON[r.descStatus]}</td>
                  <td className="py-2.5">{r.hasImage ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* راهنما */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 text-xs leading-6 text-white/50">
        <p>
          <b className="text-white/70">راهنما:</b> تیک سبز = در محدودهٔ استاندارد گوگل (تیتر ۲۰-۶۵ و توضیح ۵۰-۱۶۵ نویسه).
          مثلث کهربایی = موجود ولی کوتاه/بلند. ضربدر قرمز = خالی (با دکمهٔ «پرکردن خودکار» اصلاح می‌شود).
          Sitemap فعلی شامل {rows.length.toLocaleString("fa-IR")} صفحه از {SITE_URL} است.
        </p>
      </section>
    </div>
  );
}
