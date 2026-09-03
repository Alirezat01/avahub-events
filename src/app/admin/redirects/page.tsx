import Link from "next/link";
import { requireSuperAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import {
  createRedirectAction,
  updateRedirectAction,
  deleteRedirectAction,
} from "./actions";

// ─────────────────────────────────────────────────────────────
// فاز G — مدیریت ریدایرکت‌های ۳۰۱
// مسیرهای قدیمی سایت قبلی → صفحات جدید، بدون از دست دادن سئو
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const rows = await db.redirect.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-black">ریدایرکت‌ها (۳۰۱)</h1>
        <p className="mt-1 text-xs leading-6 text-white/50">
          مسیرهای قدیمی را به صفحات جدید وصل کنید تا بازدیدکننده و اعتبار گوگل از دست نرود.
          مثلاً <code dir="ltr" className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">/events.html</code> →{" "}
          <code dir="ltr" className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">/events</code>
        </p>
      </div>

      {sp.ok && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          ✓ ذخیره شد — چند ثانیه بعد روی سایت فعال می‌شود.
        </p>
      )}
      {sp.err && (
        <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
          {sp.err}
        </p>
      )}

      {/* فرم افزودن */}
      <form
        action={createRedirectAction}
        className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <h2 className="mb-4 text-sm font-black">ریدایرکت جدید</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-white/50">از مسیر (قدیمی)</label>
            <input
              name="fromPath"
              dir="ltr"
              placeholder="/old-page.html"
              className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-left font-mono text-xs text-white placeholder:text-white/25 focus:border-[#d4af37]/40 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-white/50">به مقصد (جدید)</label>
            <input
              name="toPath"
              dir="ltr"
              placeholder="/events"
              className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-left font-mono text-xs text-white placeholder:text-white/25 focus:border-[#d4af37]/40 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-white/50">نوع</label>
            <select
              name="statusCode"
              className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="301">۳۰۱ دائمی</option>
              <option value="302">۳۰۲ موقت</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="h-[38px] whitespace-nowrap rounded-full bg-[#d4af37] px-5 text-xs font-black text-[#0a0a0f] transition hover:brightness-110">
              افزودن
            </button>
          </div>
        </div>
      </form>

      {/* فهرست */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
          هنوز ریدایرکتی ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-4 transition ${
                r.isActive
                  ? "border-white/10 bg-white/[0.03] hover:border-white/20"
                  : "border-white/5 bg-white/[0.01] opacity-60"
              }`}
            >
              <form action={updateRedirectAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <code
                  dir="ltr"
                  className="rounded-md bg-white/5 px-2.5 py-1 font-mono text-xs text-[#d4af37]"
                >
                  {r.fromPath}
                </code>
                <span className="text-white/30">→</span>
                <input
                  name="toPath"
                  dir="ltr"
                  defaultValue={r.toPath}
                  className="w-48 rounded-lg border border-white/10 bg-[#12121a] px-2.5 py-1.5 text-left font-mono text-xs text-white focus:border-[#d4af37]/40 focus:outline-none"
                />
                <select
                  name="statusCode"
                  defaultValue={String(r.statusCode)}
                  className="rounded-lg border border-white/10 bg-[#12121a] px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="301">۳۰۱</option>
                  <option value="302">۳۰۲</option>
                </select>
                <label className="flex items-center gap-1.5 text-[11px] text-white/60">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={r.isActive}
                    className="size-3.5 accent-[#d4af37]"
                  />
                  فعال
                </label>
                <button className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/20">
                  ذخیره
                </button>
                <Link
                  href={r.toPath.startsWith("http") ? r.toPath : r.toPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-white/30 hover:text-white/60"
                >
                  تست مقصد
                </Link>
              </form>
              <form action={deleteRedirectAction} className="mt-2">
                <input type="hidden" name="id" value={r.id} />
                <button className="text-[10px] text-white/25 transition hover:text-rose-400">
                  حذف
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
