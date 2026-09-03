import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// چیدمان پنل مدیریت — فاز ۵
// گارد در سطح layout: هر مسیر زیر /admin فقط برای SUPER_ADMIN
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "پنل مدیریت | آواهاب ایونتس",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f5f5f0]">
      <header className="border-b border-white/10 bg-[#12121a]/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="flex items-center gap-2 font-bold whitespace-nowrap">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37] text-[#0a0a0f] text-sm font-black">
                A
              </span>
              <span className="hidden sm:inline">پنل مدیریت آواهاب</span>
              <span className="sm:hidden">پنل</span>
            </Link>
            <nav className="flex items-center gap-1 text-xs sm:gap-1.5 sm:text-sm text-white/70 overflow-x-auto">
              <Link href="/admin" className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                داشبورد
              </Link>
              <Link
                href="/admin/events/new"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                رویداد جدید
              </Link>
              <Link
                href="/admin/journal"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                مجله
              </Link>
              <Link
                href="/admin/portfolio"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                نمونه‌کارها
              </Link>
              <Link
                href="/admin/leads"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                سرنخ‌ها
              </Link>
              <Link
                href="/admin/campaigns"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                کمپین‌ها
              </Link>
              <Link
                href="/admin/redirects"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                ریدایرکت‌ها
              </Link>
              {admin.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin/activity"
                  className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
                >
                  فعالیت
                </Link>
              )}
              <Link
                href="/admin/media"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                رسانه‌ها
              </Link>
              <Link
                href="/admin/analytics"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition whitespace-nowrap"
              >
                آمار
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition whitespace-nowrap"
              title="مشاهده سایت"
            >
              مشاهده سایت ↗
            </Link>
            <span
              className="hidden md:inline-block max-w-[220px] truncate rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-[#d4af37]"
              title={admin.email}
            >
              {admin.fullName ?? admin.email}
            </span>
            <span
              className="hidden lg:inline-block rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] text-white/60"
              title="نقش شما در پنل"
            >
              {admin.role === "SUPER_ADMIN" ? "مدیر ارشد" : admin.role === "EVENT_MANAGER" ? "مدیر رویداد" : "کارمند"}
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        پنل مدیریت آواهاب ایونتس — فاز ۶
      </footer>
    </div>
  );
}
