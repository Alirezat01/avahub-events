// ─────────────────────────────────────────────────────────────
// تقویم شمسی ماهانه — فاز L (تقویم ادمین)
// بدون کتابخانهٔ خارجی — فقط Intl داخلی + تقویم persian
// نکتهٔ زمان: هر «روز تقویمی» با Date در ساعت ۱۲:۰۰ UTC نگهداری
// می‌شود تا در منطقهٔ تهران (UTC+3:30) مرز روز جابه‌جا نشود.
// ─────────────────────────────────────────────────────────────

const TZ = "Asia/Tehran";
/** فاصلهٔ ظهر UTC تا نیمه‌شب تهران: ۱۲:۰۰ UTC = ۱۵:۳۰ تهران */
const TEHRAN_NOON_OFFSET_MS = 15.5 * 3600_000;
const DAY_MS = 86_400_000;

export const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
] as const;

/** تبدیل ارقام لاتین به فارسی (کپی سبک از jalali.ts برای بی‌وابستگی) */
function toPersianDigits(value: string | number): string {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}

/** سرستون‌های تقویم — از شنبه */
export const WEEKDAY_HEADERS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه",
] as const;

/** اجزای شمسی یک لحظه (به وقت تهران) */
function jalaliParts(d: Date): { y: number; m: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value?.replace(/[^\d]/g, "") ?? "0");
  return { y: get("year"), m: get("month"), day: get("day") };
}

/** امروز به وقت تهران */
export function jalaliTodayParts(): { jy: number; jm: number; jd: number } {
  const p = jalaliParts(new Date());
  return { jy: p.y, jm: p.m, jd: p.day };
}

/** تبدیل روز شمسی → Date (ظهر UTC همان روز تقویمی تهران) */
export function gregorianOfJalaliDay(jy: number, jm: number, jd: number): Date {
  // تخمین اولیه: نوروز ≈ ۲۱ مارس؛ طول ماه‌ها: ۱-۶ ← ۳۱، ۷-۱۱ ← ۳۰
  const march21 = Date.UTC(jy + 621, 2, 21, 12, 0, 0);
  const offset = jm <= 7 ? (jm - 1) * 31 : 6 * 31 + (jm - 7) * 30;
  let t = march21 + offset * DAY_MS;
  // اصلاح همگرا: تا رسیدن به روز مقصد جابه‌جا کن
  for (let i = 0; i < 12; i++) {
    const p = jalaliParts(new Date(t));
    if (p.y === jy && p.m === jm && p.day === jd) return new Date(t);
    const diff = (p.y - jy) * 365 + (p.m - jm) * 30 + (p.day - jd);
    if (diff === 0) return new Date(t);
    t -= diff * DAY_MS;
  }
  // fallback ایمن — گام روزانه
  for (let i = 0; i < 45; i++) {
    const p = jalaliParts(new Date(t));
    if (p.y === jy && p.m === jm && p.day === jd) return new Date(t);
    t -= DAY_MS;
  }
  return new Date(t);
}

/** طول ماه شمسی: ۱-۶ ← ۳۱ | ۷-۱۱ ← ۳۰ | ۱۲ ← ۲۹ یا ۳۰ (کبیسه) */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // روز ۳۰ اسفند اگر افتاد در ماه بعد یعنی این سال کبیسه نیست
  return jalaliParts(gregorianOfJalaliDay(jy, 12, 30)).day === 30 ? 30 : 29;
}

/** ایندکس روز هفته با مبنای شنبه=۰ … جمعه=۶ */
export function weekdaySatIndex(d: Date): number {
  return (d.getUTCDay() + 1) % 7;
}

/** بازهٔ UTC یک روز تقویمی تهران — برای کوئری دیتابیس [start, end) */
export function tehranDayRange(dayNoon: Date): { start: Date; end: Date } {
  const start = new Date(dayNoon.getTime() - TEHRAN_NOON_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** اگر لحظهٔ داده‌شده در ماه شمسی (jy,jm) بود، روزِ ماه را بده؛ وگرنه null */
export function jalaliDayOfMonth(
  d: Date,
  jy: number,
  jm: number,
): number | null {
  const p = jalaliParts(d);
  return p.y === jy && p.m === jm ? p.day : null;
}

export type CalendarCell =
  | null
  | { date: Date; jd: number; inMonth: true; isToday: boolean };

export type MonthGrid = {
  jy: number;
  jm: number;
  label: string;
  weeks: CalendarCell[][];
  /** شروع ماه به وقت تهران ( UTC ) — مرز کوئری */
  rangeStart: Date;
  /** پایان ماه (انحصاری) به وقت تهران */
  rangeEnd: Date;
};

/** برچسب فارسی ماه: «شهریور ۱۴۰۵» */
export function jalaliMonthLabel(jy: number, jm: number): string {
  return `${JALALI_MONTH_NAMES[jm - 1] ?? ""} ${toPersianDigits(jy)}`;
}

/** ساخت شبکهٔ ماه — هفته‌های ۷ ستونی از شنبه */
export function buildMonthGrid(jy: number, jm: number): MonthGrid {
  const len = jalaliMonthLength(jy, jm);
  const first = gregorianOfJalaliDay(jy, jm, 1);
  const padStart = weekdaySatIndex(first);
  const today = jalaliTodayParts();

  const slots: CalendarCell[] = [];
  for (let i = 0; i < padStart; i++) slots.push(null);
  for (let d = 1; d <= len; d++) {
    const date = gregorianOfJalaliDay(jy, jm, d);
    slots.push({
      date,
      jd: d,
      inMonth: true,
      isToday: today.jy === jy && today.jm === jm && today.jd === d,
    });
  }
  while (slots.length % 7 !== 0) slots.push(null);

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7));

  const monthRange = tehranDayRange(first);
  const lastNoon = gregorianOfJalaliDay(jy, jm, len);
  const endOfLast = tehranDayRange(lastNoon).end;

  return {
    jy,
    jm,
    label: jalaliMonthLabel(jy, jm),
    weeks,
    rangeStart: monthRange.start,
    rangeEnd: endOfLast,
  };
}

/** جابه‌جایی ماه شمسی با رعایت سال */
export function jalaliAddMonths(
  jy: number,
  jm: number,
  delta: number,
): { jy: number; jm: number } {
  const t = jy * 12 + (jm - 1) + delta;
  return { jy: Math.floor(t / 12), jm: (t % 12) + 1 };
}
