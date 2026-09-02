import { SiteHeader } from "@/components/avahub/header";
import { SiteFooter } from "@/components/avahub/footer";
import { BottomNav } from "@/components/avahub/bottom-nav";

// ─────────────────────────────────────────────────────────────
// چیدمان بخش عمومی سایت (route group «(site)»)
// هدر/فوتر/نویگیشن موبایل فقط برای صفحات عمومی رندر می‌شوند —
// پنل ادمین بیرون این گروه است و دیگر هدر سایت را نمی‌گیرد (رفع C1)
// ─────────────────────────────────────────────────────────────

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
