import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// فاز G — لاگ فعالیت (Activity Log)
// ثبت اقدام‌های مهم ادمین و رویدادهای عمومی برای پیگیری
// best-effort: هیچ‌وقت جریان اصلی را نمی‌شکند
// ─────────────────────────────────────────────────────────────

export async function logActivity(entry: {
  adminProfileId?: string | null;
  adminName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        adminProfileId: entry.adminProfileId ?? null,
        adminName: entry.adminName ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        detail: entry.detail ?? null,
      },
    });
  } catch {
    // لاگ نباید هیچ‌وقت عملیات اصلی را fail کند
  }
}
