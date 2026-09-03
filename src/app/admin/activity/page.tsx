import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { formatJalaliDate } from "@/lib/avahub/jalali";

// ─────────────────────────────────────────────────────────────
// فاز G — لاگ فعالیت (فقط SUPER_ADMIN)
// تاریخچهٔ اقدام‌های مهم ادمین و رویدادهای سیستم
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const ACTION_FA: Record<string, string> = {
  LEAD_NEW: "سرنخ جدید",
  LEAD_STATUS: "تغییر وضعیت سرنخ",
  LEAD_DELETE: "حذف سرنخ",
  REDIRECT_SAVE: "ذخیره ریدایرکت",
  REDIRECT_DELETE: "حذف ریدایرکت",
  EVENT_CLONE: "کپی رویداد",
  EVENT_SAVE: "ذخیره رویداد",
  JOURNAL_SAVE: "ذخیره مقاله",
  PORTFOLIO_SAVE: "ذخیره نمونه‌کار",
};

const ENTITY_FA: Record<string, string> = {
  lead: "سرنخ",
  event: "رویداد",
  redirect: "ریدایرکت",
  journal: "مقاله",
  portfolio: "نمونه‌کار",
};

const TONE: Record<string, string> = {
  lead: "text-[#d4af37]",
  event: "text-sky-300",
  redirect: "text-violet-300",
  journal: "text-emerald-300",
  portfolio: "text-orange-300",
};

export default async function AdminActivityPage() {
  const session = await requireAdmin("/admin/activity");
  if (session.role !== "SUPER_ADMIN") redirect("/admin/forbidden");

  const rows = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-black">لاگ فعالیت</h1>
        <p className="mt-1 text-xs text-white/50">
          تاریخچهٔ اقدام‌های مهم — فقط برای مدیر ارشد
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
          هنوز فعالیتی ثبت نشده است. اقدام‌های پنل (سرنخ‌ها، ریدایرکت‌ها، کپی رویداد…) اینجا ثبت
          می‌شوند.
        </div>
      ) : (
        <ol className="relative space-y-3 border-r border-white/10 pr-4">
          {rows.map((r) => (
            <li key={r.id} className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="absolute -right-[21px] top-5 size-2 rounded-full bg-white/25" />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`font-black ${TONE[r.entity] ?? "text-white/80"}`}>
                  {ACTION_FA[r.action] ?? r.action}
                </span>
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                  {ENTITY_FA[r.entity] ?? r.entity}
                </span>
                {r.detail && (
                  <span className="text-white/60" dir="auto">
                    {r.detail}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-white/35">
                <span>{r.adminName ?? "سایت (عمومی)"}</span>
                <span>•</span>
                <span>{formatJalaliDate(r.createdAt)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
