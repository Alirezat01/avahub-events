import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// کارت ورود QR — فاز ۴ب
// قول صفحهٔ ثبت‌نام: «بلیت ورود پس از تأیید صادر می‌شود»
// QR محتوایش آدرس مطلق همین کارت است؛ با اسکن، صفحهٔ کارت
// باز می‌شود و وضعیت (قطعی/باطل) همان‌جا دیده می‌شود.
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** اعتبارشناسی شناسهٔ کارت در مسیرها */
export function isValidPassId(id: string): boolean {
  return UUID_RE.test(id);
}

/** مسیر نسبی کارت */
export function passPath(registrationId: string): string {
  return `/pass/${registrationId}`;
}

/**
 * مبدأ سایت برای ساخت لینک مطلق داخل صفحه‌های سروری.
 * از هدر درخواست می‌خواند تا روی هر دامنه‌ای (vercel.app یا دامنهٔ اصلی
 * بعد از اتصال) QR درست کار کند.
 */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "avahub-events.vercel.app";
  const isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * مبدأ برای لینک‌های ایمیل (خارج از چرخهٔ درخواست کاربر).
 * اگر NEXT_PUBLIC_SITE_URL تنظیم شده باشد از آن استفاده می‌شود؛
 * وگرنه آدرس فعلی پروداکشن.
 */
export function emailSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://avahub-events.vercel.app";
}

/** آدرس مطلق کارت برای ایمیل */
export function emailPassUrl(registrationId: string): string {
  return `${emailSiteOrigin()}${passPath(registrationId)}`;
}

/**
 * تولید QR به‌صورت Data URL (PNG) — سمت سرور.
 * کنتراست بالا برای اسکن راحت با دوربین موبایل.
 */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#0f0f16", light: "#ffffff" },
  });
}

export type PassData = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  cancelledBy: string | null;
  createdAt: Date;
  consentVersion: string | null;
  attendeeName: string | null;
  attendeePhone: string | null;
  event: {
    title: string;
    slug: string;
    startsAt: Date;
    status: string;
    venueName: string | null;
    venueCity: string | null;
  };
};

/** بارگذاری دادهٔ کارت از DB — null یعنی چنین کارتی وجود ندارد */
export async function getPassData(registrationId: string): Promise<PassData | null> {
  if (!isValidPassId(registrationId)) return null;
  const reg = await db.registration
    .findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        status: true,
        cancelledBy: true,
        createdAt: true,
        consentVersion: true,
        profile: { select: { fullName: true, phone: true } },
        event: {
          select: {
            title: true,
            slug: true,
            startsAt: true,
            status: true,
            venueName: true,
            venueCity: true,
          },
        },
      },
    })
    .catch(() => null);
  if (!reg) return null;
  return {
    id: reg.id,
    status: reg.status,
    cancelledBy: reg.cancelledBy,
    createdAt: reg.createdAt,
    consentVersion: reg.consentVersion,
    attendeeName: reg.profile.fullName,
    attendeePhone: reg.profile.phone,
    event: reg.event,
  };
}

/** وضعیت مؤثر کارت — رویداد لغو شده کارت را هم باطل می‌کند */
export function passValidity(p: PassData): "valid" | "pending" | "invalid" {
  if (p.event.status === "CANCELLED") return "invalid";
  if (p.status === "CONFIRMED") return "valid";
  if (p.status === "PENDING") return "pending";
  return "invalid";
}
