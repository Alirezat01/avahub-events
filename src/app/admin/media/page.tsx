import { requireAdmin } from "@/lib/avahub/admin";
import { listMediaObjects, isMediaConfigured } from "@/lib/avahub/media";
import { AdminMediaManager } from "@/components/avahub/admin-media-manager";

// ─────────────────────────────────────────────────────────────
// Media Manager — فاز ۶
// کتابخانهٔ رسانه‌های سایت (Supabase Storage باکت media)
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdmin("/admin/media");

  const configured = isMediaConfigured();
  const items = configured ? await listMediaObjects() : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">رسانه‌ها</h1>
        <p className="mt-2 text-white/60">
          کتابخانهٔ تصاویر سایت — عکس‌های رویدادها، مجله و نمونه‌کارها را اینجا آپلود، تعویض یا حذف کنید.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-6 text-sm leading-7 text-amber-200">
          <p className="font-bold text-amber-300">یک قدم تا فعال‌سازی رسانه‌ها</p>
          <p className="mt-2">
            برای آپلود عکس، کلید <code dir="ltr" className="rounded bg-black/30 px-1.5 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> باید
            در تنظیمات محیط (لوکال: فایل <code dir="ltr">.env</code> / ورکسل: Environment Variables) اضافه شود.
            کلید را از داشبورد سونابیس → Project Settings → API → <span dir="ltr">service_role</span> بردارید.
            این کلید فقط سمت سرور استفاده می‌شود و هرگز به مرورگر نمی‌رود.
          </p>
        </div>
      ) : items === null ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-6 text-sm text-rose-300">
          اتصال به رسانه‌ها برقرار نشد — تنظیمات سونابیس را بررسی کنید.
        </div>
      ) : (
        <AdminMediaManager initialItems={items} />
      )}
    </div>
  );
}
