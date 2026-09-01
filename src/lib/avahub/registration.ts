import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// منطق ثبت‌حضور — فاز ۴
// ⭐ قلب نیازمندی کاربر: جمع‌آوری شماره موبایل (یکتا) + رضایت
//    توافق‌نامه + ظرفیت/لیست انتظار + انصراف
// توابع مستقل از Auth هستند تا قابل تست باشند؛ احراز هویت در
// لایه Server Action (صفحه ثبت‌نام / حساب کاربری) انجام می‌شود.
// ─────────────────────────────────────────────────────────────

/** وضعیت‌هایی که جایگاه را اشغال می‌کنند */
export const OCCUPYING_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** تبدیل ارقام فارسی/عربی به لاتین + حذف فاصله و خط */
export function normalizePhone(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
    .replace(/[\s\-()+]/g, "");
}

/** اعتبارسنجی شماره موبایل ایران — 09XXXXXXXXX */
export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(phone));
}

/** تعداد جایگاه‌های اشغال‌شده (PENDING + CONFIRMED) */
export async function getSeatsTaken(eventId: string): Promise<number> {
  return db.registration.count({
    where: { eventId, status: { in: [...OCCUPYING_STATUSES] } },
  });
}

/** آیا ظرفیت رویداد تکمیل شده است؟ (capacity=0 یعنی بدون محدودیت) */
export function isCapacityFull(capacity: number, seatsTaken: number): boolean {
  return capacity > 0 && seatsTaken >= capacity;
}

/** ثبت‌نام فعال (یا آخرین وضعیت) کاربر در یک رویداد */
export async function getUserRegistration(
  eventId: string,
  profileId: string,
) {
  return db.registration.findFirst({
    where: { eventId, profileId },
    orderBy: { createdAt: "desc" },
  });
}

/** ردیف لیست انتظار کاربر در یک رویداد */
export async function getUserWaitlistEntry(
  eventId: string,
  profileId: string,
) {
  return db.waitlist.findFirst({
    where: { eventId, profileId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export type RegisterOutcome =
  | { ok: true; kind: "registered" | "waitlisted"; emailSent: boolean }
  | {
      ok: false;
      code:
        | "not_found"
        | "closed"
        | "duplicate"
        | "phone_taken"
        | "no_waitlist"
        | "error";
      message: string;
    };

export type RegisterInput = {
  eventId: string;
  slug: string;
  profileId: string;
  phone: string; // نرمال‌شده
  city?: string | null;
  consentVersion: string;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
};

/**
 * ثبت‌نام کاربر در رویداد (یا عضویت در لیست انتظار)
 * - ثبت‌نام قطعی: status = CONFIRMED (بدون درگاه پرداخت — رایگان)
 * - تکراری فعال → duplicate
 * - ظرفیت پر → لیست انتظار (در صورت فعال بودن)
 * - انصراف قبلی → فعال‌سازی مجدد همان ردیف
 */
export async function registerForEvent(input: RegisterInput): Promise<RegisterOutcome> {
  try {
    const event = await db.event.findFirst({
      where: { id: input.eventId, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        capacity: true,
        waitlistEnabled: true,
        startsAt: true,
      },
    });
    if (!event) {
      return { ok: false, code: "not_found", message: "رویداد یافت نشد." };
    }
    if (event.startsAt.getTime() < Date.now()) {
      return {
        ok: false,
        code: "closed",
        message: "زمان ثبت‌نام این رویداد به پایان رسیده است.",
      };
    }

    // شماره موبایل — قلب دیتابیس مخاطبان (یکتا)
    const conflicting = await db.profile.findFirst({
      where: { phone: input.phone, NOT: { id: input.profileId } },
      select: { id: true },
    });
    if (conflicting) {
      return {
        ok: false,
        code: "phone_taken",
        message:
          "این شماره موبایل قبلاً با حساب دیگری ثبت شده است. با شماره دیگری ادامه دهید یا با پشتیبانی تماس بگیرید.",
      };
    }

    // ذخیره شماره و شهر روی پروفایل (برای استخراج پنل ادمین)
    await db.profile.update({
      where: { id: input.profileId },
      data: {
        phone: input.phone,
        ...(input.city?.trim() ? { city: input.city.trim() } : {}),
      },
    });

    const existing = await getUserRegistration(event.id, input.profileId);
    if (existing && existing.status !== "CANCELLED") {
      return {
        ok: false,
        code: "duplicate",
        message: "شما قبلاً در این رویداد ثبت‌نام کرده‌اید.",
      };
    }

    const taken = await getSeatsTaken(event.id);
    const full = isCapacityFull(event.capacity, taken);

    const consentData = {
      consentVersion: input.consentVersion,
      consentAcceptedAt: new Date(),
    };

    if (full) {
      if (!event.waitlistEnabled) {
        return {
          ok: false,
          code: "no_waitlist",
          message: "ظرفیت این رویداد تکمیل شده است.",
        };
      }
      // فعال‌سازی مجدد ردیف قبلی لیست انتظار یا عضویت تازه
      const prior = await getUserWaitlistEntry(event.id, input.profileId);
      if (!prior) {
        const queue = await db.waitlist.count({
          where: { eventId: event.id, status: "ACTIVE" },
        });
        await db.waitlist.create({
          data: {
            eventId: event.id,
            profileId: input.profileId,
            position: queue + 1,
            status: "ACTIVE",
          },
        });
      }
      return { ok: true, kind: "waitlisted", emailSent: false };
    }

    if (existing) {
      // فعال‌سازی مجدد پس از انصراف
      await db.registration.update({
        where: { id: existing.id },
        data: {
          status: "CONFIRMED",
          cancelledAt: null,
          cancelledBy: null,
          confirmedAt: new Date(),
          utmSource: input.utm?.source ?? existing.utmSource,
          utmMedium: input.utm?.medium ?? existing.utmMedium,
          utmCampaign: input.utm?.campaign ?? existing.utmCampaign,
          ...consentData,
        },
      });
    } else {
      await db.registration.create({
        data: {
          eventId: event.id,
          profileId: input.profileId,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          utmSource: input.utm?.source ?? null,
          utmMedium: input.utm?.medium ?? null,
          utmCampaign: input.utm?.campaign ?? null,
          ...consentData,
        },
      });
    }

    // با ثبت‌نام موفق، ردیف‌های فعال لیست انتظار او بسته می‌شود
    await db.waitlist.updateMany({
      where: { eventId: event.id, profileId: input.profileId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    return { ok: true, kind: "registered", emailSent: false };
  } catch {
    return {
      ok: false,
      code: "error",
      message: "خطای غیرمنتظره در ثبت‌نام پیش آمد؛ لطفاً دوباره تلاش کنید.",
    };
  }
}

/** انصراف کاربر از رویداد (فقط ردیف خودش) */
export async function cancelMyRegistration(
  registrationId: string,
  profileId: string,
): Promise<boolean> {
  try {
    const result = await db.registration.updateMany({
      where: {
        id: registrationId,
        profileId,
        status: { in: [...OCCUPYING_STATUSES] },
      },
      data: { status: "CANCELLED", cancelledBy: "USER", cancelledAt: new Date() },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

/** خلاصه وضعیت ثبت‌نامی‌های یک رویداد — برای نمایش عمومی ظرفیت */
export async function getEventCapacitySummary(eventId: string, capacity: number) {
  const taken = await getSeatsTaken(eventId);
  const remaining = capacity > 0 ? Math.max(capacity - taken, 0) : null;
  return { taken, remaining, full: isCapacityFull(capacity, taken) };
}
