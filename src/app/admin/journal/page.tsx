import Link from "next/link";
import { requireSuperAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { deleteJournalAction, toggleJournalStatusAction } from "./actions";
import { fmtFa } from "@/lib/avahub/admin-data";
import { formatJalaliShort } from "@/lib/avahub/jalali";

// ─────────────────────────────────────────────────────────────
// مدیریت مجله آواهاب — فاز ۶
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  await requireSuperAdmin("/admin/journal");
  const sp = await searchParams;
  const posts = await db.journalPost.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">مجله آواهاب</h1>
          <p className="mt-2 text-white/60">
            مقالات آموزشی و تحلیلی — بنویسید، پیش‌نویس بگذارید و وقتی آماده شد منتشر کنید.
          </p>
        </div>
        <Link
          href="/admin/journal/new"
          className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
        >
          + مقاله جدید
        </Link>
      </div>

      {sp.created && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          مقاله ساخته شد — ادامهٔ ویرایش و انتشار از همین صفحه.
        </div>
      )}
      {sp.updated && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          تغییرات ذخیره شد.
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#12121a] px-6 py-12 text-center text-white/50">
          هنوز مقاله‌ای نوشته نشده است. سایت فعلاً کارت‌های تیزر را نشان می‌دهد — با اولین
          مقالهٔ منتشرشده، مقاله‌های واقعی جای آن‌ها را می‌گیرند.
          <div className="mt-4">
            <Link
              href="/admin/journal/new"
              className="inline-block rounded-xl bg-[#d4af37] px-5 py-2 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
            >
              نوشتن اولین مقاله
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-right text-white/50 border-b border-white/10">
                  <th className="px-5 py-3 font-medium">عنوان</th>
                  <th className="px-3 py-3 font-medium">وضعیت</th>
                  <th className="px-3 py-3 font-medium">انتشار</th>
                  <th className="px-3 py-3 font-medium">برچسب‌ها</th>
                  <th className="px-5 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03] transition">
                    <td className="px-5 py-3">
                      <Link href={`/admin/journal/${p.id}/edit`} className="font-medium hover:text-[#d4af37] transition">
                        {p.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-white/40" dir="ltr">
                        /journal/{p.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                          p.status === "PUBLISHED"
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-white/20 bg-white/10 text-white/70"
                        }`}
                      >
                        {p.status === "PUBLISHED" ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-white/70 text-xs">
                      {p.publishedAt ? formatJalaliShort(p.publishedAt) : "—"}
                      <div className="text-white/35 text-[10px]">{fmtFa(p.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.length === 0 && <span className="text-white/30 text-xs">—</span>}
                        {p.tags.map((t) => (
                          <span key={t} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/journal/${p.id}/edit`}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                        >
                          ویرایش
                        </Link>
                        <form action={toggleJournalStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                              p.status === "PUBLISHED"
                                ? "border-white/15 text-white/60 hover:bg-white/5"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {p.status === "PUBLISHED" ? "پیش‌نویس کن" : "انتشار"}
                          </button>
                        </form>
                        {p.status === "PUBLISHED" && (
                          <Link
                            href={`/journal/${p.slug}`}
                            target="_blank"
                            className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-bold text-[#d4af37] hover:bg-[#d4af37]/20 transition"
                          >
                            دیدن ↗
                          </Link>
                        )}
                        <form action={deleteJournalAction} className="ms-auto">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
                            title="حذف قطعی"
                          >
                            حذف
                          </button>
                        </form>
                      </div>
                    </td>
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
