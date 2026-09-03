import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// فاز G — اعلان‌های داشبورد ادمین
// محاسبه سبک سمت سرور؛ بدون جدول جدید — از داده واقعی می‌خواند
// ─────────────────────────────────────────────────────────────

export type AdminNotification = {
  tone: "gold" | "sky" | "rose" | "emerald";
  title: string;
  value: string;
  href: string;
  cta: string;
};

export async function adminNotifications(): Promise<AdminNotification[]> {
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [newLeads, pendingRegs, activeWaitlist, upcoming] = await Promise.all([
    db.lead.count({ where: { status: "NEW" } }),
    db.registration.count({ where: { status: "PENDING" } }),
    db.waitlist.count({ where: { status: "ACTIVE" } }),
    db.event.count({
      where: { status: "PUBLISHED", startsAt: { gte: now, lte: in7d } },
    }),
  ]);

  const out: AdminNotification[] = [];
  if (newLeads > 0)
    out.push({
      tone: "gold",
      title: "سرنخ تازه در انتظار تماس",
      value: `${newLeads} سرنخ`,
      href: "/admin/leads?status=NEW",
      cta: "پیگیری سرنخ‌ها",
    });
  if (upcoming > 0)
    out.push({
      tone: "emerald",
      title: "رویداد در ۷ روز آینده",
      value: `${upcoming} رویداد`,
      href: "/admin",
      cta: "مشاهده داشبورد",
    });
  if (pendingRegs > 0)
    out.push({
      tone: "sky",
      title: "ثبت‌نام در انتظار تأیید",
      value: `${pendingRegs} ثبت‌نام`,
      href: "/admin",
      cta: "بررسی ثبت‌نام‌ها",
    });
  if (activeWaitlist > 0)
    out.push({
      tone: "rose",
      title: "لیست انتظار فعال",
      value: `${activeWaitlist} نفر`,
      href: "/admin",
      cta: "مدیریت انتظار",
    });
  return out;
}
