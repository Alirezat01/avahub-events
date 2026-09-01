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
            <nav className="flex items-center gap-1 sm:gap-2 text-sm text-white/70">
              <Link href="/admin" className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition">
                داشبورد
              </Link>
              <Link
                href="/admin/events/new"
                className="px-2 py-1 rounded-md hover:bg-white/5 hover:text-white transition"
              >
                رویداد جدید
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
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        پنل مدیریت آواهاب ایونتس — فاز ۵
      </footer>
    </div>
  );
}
