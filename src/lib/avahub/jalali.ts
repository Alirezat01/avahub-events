// ─────────────────────────────────────────────────────────────
// ابزار تاریخ شمسی (جلالی) — بدون کتابخانه خارجی
// با Intl داخلی Node/مرورگر + منطقه زمانی تهران
// ─────────────────────────────────────────────────────────────

const TZ = "Asia/Tehran";

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
] as const;

/** تبدیل ارقام لاتین به فارسی */
export function toPersianDigits(value: string | number): string {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}

/** «پنجشنبه ۹ مهر ۱۴۰۵» */
export function formatJalaliDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** «۹ مهر ۱۴۰۵» — بدون روز هفته */
export function formatJalaliShort(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** اجزای جدا برای بج کارت: { day: "۰۹", month: "مهر" } */
export function toJalaliBadgeParts(date: Date): { day: string; month: string } {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    timeZone: TZ,
    day: "2-digit",
    month: "numeric",
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const monthIndex = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;

  return {
    day: toPersianDigits(day),
    month: JALALI_MONTHS[monthIndex] ?? "",
  };
}

/** «۱۴:۰۰» */
export function formatTimeFa(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-nu-arabext", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
