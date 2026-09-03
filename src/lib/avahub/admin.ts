import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { AdminRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// گارد پنل ادمین — فاز ۵
// زنجیره: نشست سونابیس → پروفایل → رکورد ادمین فعال
// فقط SUPER_ADMIN اجازه ورود به پنل را دارد (طبق طرح تأییدشده)
// ─────────────────────────────────────────────────────────────

export type AdminSession = {
  profileId: string;
  authUserId: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  adminId: string; /// شناسهٔ رکورد ادمین (فاز K — برای مدیریت تیم)
};

/**
 * شناسایی ادمین از روی نشست فعلی — بدون ریدایرکت.
 * null یعنی یا لاگین نیست یا ادمین نیست.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // پروفایل را با authUserId یا ایمیل پیدا کن (و در صورت نیاز پیوند بزن)
  let profile = await db.profile.findFirst({
    where: { OR: [{ authUserId: user.id }, { email: user.email }] },
    select: { id: true, authUserId: true, email: true, fullName: true },
  });

  if (!profile) return null;
  if (!profile.authUserId) {
    // پیوند خودکار پروفایل موجود با حساب auth فعلی
    await db.profile.update({ where: { id: profile.id }, data: { authUserId: user.id } });
  }

  const admin = await db.admin.findFirst({
    where: { profileId: profile.id, isActive: true },
    select: { id: true, role: true },
  });
  if (!admin) return null;

  return {
    profileId: profile.id,
    authUserId: user.id,
    email: profile.email,
    fullName: profile.fullName,
    role: admin.role,
    adminId: admin.id,
  };
}

/**
 * برای Server Components — اگر ادمین نبود، ریدایرکت:
 * مهمان → /login?next=... | لاگین‌شده غیرادمین → صفحه ممنوع
 */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    redirect("/admin/forbidden");
  }
  return session;
}

/** برای Server Actions / Route Handlers — خطا به‌جای ریدایرکت */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED_ADMIN");
  return session;
}

// ───────────────────── فاز K — دسترسی رویدادی ─────────────────────

/** صفحات فقط-مدیرارشد: غیر SUPER_ADMIN → صفحه ممنوع */
export async function requireSuperAdmin(nextPath = "/admin"): Promise<AdminSession> {
  const session = await requireAdmin(nextPath);
  if (session.role !== "SUPER_ADMIN") redirect("/admin/forbidden");
  return session;
}

/** نسخهٔ Server Action — خطا به‌جای ریدایرکت */
export async function assertSuperAdmin(): Promise<AdminSession> {
  const session = await assertAdmin();
  if (session.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN_SUPER_ADMIN_ONLY");
  return session;
}

/**
 * رویدادهای مجاز ادمین فعلی:
 *  null  → همهٔ رویدادها (مدیر ارشد)
 *  []    → هیچ (هنوز رویدادی تخصیص نیافته)
 *  [...] → فقط رویدادهای تخصیص‌یافته (مدیر رویداد / کارمند)
 */
export async function getAllowedEventIds(session: AdminSession): Promise<string[] | null> {
  if (session.role === "SUPER_ADMIN") return null;
  const rows = await db.eventAdmin.findMany({
    where: { admin: { profileId: session.profileId, isActive: true } },
    select: { eventId: true },
  });
  return rows.map((r) => r.eventId);
}

/** آیا این ادمین به این رویداد دسترسی دارد؟ (برای صفحات [id] و روت‌ها) */
export async function canAccessEvent(session: AdminSession, eventId: string): Promise<boolean> {
  const allowed = await getAllowedEventIds(session);
  return allowed === null || allowed.includes(eventId);
}
