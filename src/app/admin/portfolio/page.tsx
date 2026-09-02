import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { deletePortfolioAction, togglePortfolioActiveAction } from "./actions";
import { fmtFa } from "@/lib/avahub/admin-data";

// ─────────────────────────────────────────────────────────────
// مدیریت نمونه‌کارها — فاز ۶
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  await requireAdmin("/admin/portfolio");
  const sp = await searchParams;
  const items = await db.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">نمونه‌کارها</h1>
          <p className="mt-2 text-white/60">
            نمونه‌کارهای صفحهٔ «نمونه‌کارها»ی سایت — ترتیب، عکس و فعال/غیرفعال بودن را اینجا کنترل کنید.
          </p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
        >
          + نمونه‌کار جدید
        </Link>
      </div>

      {sp.created && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          نمونه‌کار با موفقیت ساخته شد.
        </div>
      )}
      {sp.updated && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          تغییرات ذخیره شد.
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#12121a] px-6 py-12 text-center text-white/50">
          هنوز نمونه‌کاری ثبت نشده است. سایت فعلاً چیدمان پیش‌فرض (تصاویر آماده) را نشان می‌دهد —
          با اولین نمونه‌کار، همان نمایش داده می‌شود.
          <div className="mt-4">
            <Link
              href="/admin/portfolio/new"
              className="inline-block rounded-xl bg-[#d4af37] px-5 py-2 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
            >
              ثبت اولین نمونه‌کار
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.id}
              className={`overflow-hidden rounded-2xl border bg-[#12121a] ${it.isActive ? "border-white/10" : "border-white/5 opacity-60"}`}
            >
              <div className="relative aspect-[16/9] bg-white/[0.03]">
                {it.coverImage ? (
                  <Image
                    src={it.coverImage}
                    alt={it.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, 50vw"
                    className="object-cover"
                    unoptimized={it.coverImage.startsWith("http")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/30">بدون عکس</div>
                )}
                {it.tag && (
                  <span className="absolute right-3 top-3 rounded-full border border-gold/40 bg-[#0a0a0f]/70 px-2.5 py-0.5 text-[10px] font-bold text-[#d4af37] backdrop-blur">
                    {it.tag}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-6">{it.title}</h3>
                  <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50 tabular-nums">
                    ترتیب {it.sortOrder.toLocaleString("fa-IR")}
                  </span>
                </div>
                {it.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/50">{it.description}</p>
                )}
                <div className="mt-2 text-[11px] text-white/35">ساخته: {fmtFa(it.createdAt)}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/portfolio/${it.id}/edit`}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                  >
                    ویرایش
                  </Link>
                  <form action={togglePortfolioActiveAction}>
                    <input type="hidden" name="id" value={it.id} />
                    <button
                      type="submit"
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                        it.isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "border-white/15 text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {it.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </form>
                  <form action={deletePortfolioAction} className="ms-auto">
                    <input type="hidden" name="id" value={it.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
                      title="حذف قطعی"
                    >
                      حذف
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
