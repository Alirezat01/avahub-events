"use server";

// ─────────────────────────────────────────────────────────────
// Server Actions ثبت‌حضور و انصراف — فاز ۴
// احراز هویت: نشست سونابیس. منطق دیتابیس: src/lib/avahub/registration.ts
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  cancelMyRegistration,
  isValidIranMobile,
  normalizePhone,
  registerForEvent,
} from "@/lib/avahub/registration";
import { CONSENT_VERSION } from "@/lib/avahub/consent";
import { sendRegistrationEmail } from "@/lib/avahub/email";
import { formatJalaliDate, formatTimeFa } from "@/lib/avahub/jalali";

export type RegisterState = {
  status: "idle" | "success" | "waitlisted" | "error";
  message?: string;
};

export async function submitRegistration(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const slug = String(formData.get("slug") ?? "");
  const rawPhone = String(formData.get("phone") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const consent = formData.get("consent");
  const utm = {
    source: String(formData.get("utm_source") ?? "") || null,
    medium: String(formData.get("utm_medium") ?? "") || null,
    campaign: String(formData.get("utm_campaign") ?? "") || null,
  };

  if (!slug) return { status: "error", message: "رویداد مشخص نیست." };
  if (!consent) {
    return {
      status: "error",
      message: "برای ثبت‌نام، پذیرش توافق‌نامه الزامی است.",
    };
  }
  if (!isValidIranMobile(rawPhone)) {
    return {
      status: "error",
      message: "شماره موبایل معتبر نیست — با فرمت 09123456789 وارد کنید.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        status: "error",
        message: "نشست شما منقضی شده؛ دوباره وارد شوید.",
      };
    }

    const profile = await db.profile.findFirst({
      where: { authUserId: user.id },
      select: { id: true, email: true, fullName: true },
    });
    if (!profile) {
      return {
        status: "error",
        message: "پروفایل شما پیدا نشد؛ یک‌بار دیگر وارد حساب شوید.",
      };
    }

    const event = await db.event.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        venueName: true,
        venueCity: true,
      },
    });
    if (!event) {
      return { status: "error", message: "رویداد یافت نشد یا منتشر نشده است." };
    }

    const result = await registerForEvent({
      eventId: event.id,
      slug,
      profileId: profile.id,
      phone: normalizePhone(rawPhone),
      city: city || null,
      consentVersion: CONSENT_VERSION,
      utm,
    });

    if (!result.ok) return { status: "error", message: result.message };

    const emailSent = await sendRegistrationEmail({
      to: profile.email,
      name: profile.fullName,
      eventTitle: event.title,
      eventDateFa: formatJalaliDate(event.startsAt),
      eventTimeFa: formatTimeFa(event.startsAt),
      venue: event.venueName ?? event.venueCity,
      kind: result.kind === "waitlisted" ? "waitlisted" : "registered",
      eventUrl: `https://www.avahubevents.com/events/${slug}`,
    }).catch(() => false);

    revalidatePath("/account");
    revalidatePath(`/events/${slug}`);
    revalidatePath(`/events/${slug}/register`);

    if (result.kind === "waitlisted") {
      return {
        status: "waitlisted",
        message:
          "ظرفیت این رویداد تکمیل شده است؛ درخواست شما در لیست انتظار ثبت شد و به‌محض باز شدن جایگاه خبر می‌دهیم.",
      };
    }
    return {
      status: "success",
      message: emailSent
        ? "ثبت‌حضور شما قطعی شد؛ ایمیل تأیید برایتان ارسال شد. ✅"
        : "ثبت‌حضور شما قطعی شد. ✅",
    };
  } catch {
    return {
      status: "error",
      message: "خطای غیرمنتظره پیش آمد؛ لطفاً دوباره تلاش کنید.",
    };
  }
}

export async function cancelRegistrationAction(
  registrationId: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "ابتدا وارد حساب خود شوید." };

    const profile = await db.profile.findFirst({
      where: { authUserId: user.id },
      select: { id: true, email: true, fullName: true },
    });
    if (!profile) return { ok: false, message: "پروفایل پیدا نشد." };

    const reg = await db.registration.findFirst({
      where: { id: registrationId, profileId: profile.id },
      include: {
        event: {
          select: {
            slug: true,
            title: true,
            startsAt: true,
            venueName: true,
            venueCity: true,
          },
        },
      },
    });
    if (!reg) return { ok: false, message: "ثبت‌نام پیدا نشد." };
    if (reg.status === "CANCELLED")
      return { ok: true, message: "قبلاً از این رویداد انصراف داده‌اید." };
    if (reg.event.startsAt.getTime() < Date.now()) {
      return { ok: false, message: "این رویداد برگزار شده است." };
    }

    const ok = await cancelMyRegistration(registrationId, profile.id);
    if (!ok) return { ok: false, message: "انصراف انجام نشد؛ دوباره تلاش کنید." };

    await sendRegistrationEmail({
      to: profile.email,
      name: profile.fullName,
      eventTitle: reg.event.title,
      eventDateFa: formatJalaliDate(reg.event.startsAt),
      venue: reg.event.venueName ?? reg.event.venueCity,
      kind: "cancelled",
      eventUrl: `https://www.avahubevents.com/events`,
    }).catch(() => false);

    revalidatePath("/account");
    revalidatePath(`/events/${reg.event.slug}`);
    return {
      ok: true,
      message: "انصراف شما ثبت شد؛ جایگاه برای نفر بعدی لیست انتظار آزاد می‌شود.",
    };
  } catch {
    return { ok: false, message: "خطای غیرمنتظره؛ دوباره تلاش کنید." };
  }
}
