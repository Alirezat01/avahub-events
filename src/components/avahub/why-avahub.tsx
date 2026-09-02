import Link from "next/link";
import {
  CalendarCheck,
  Megaphone,
  PartyPopper,
  TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// بلاک متن معرفی «چرا آواهاب» — فاز د۲ (SEO)
// محتوای متنی قابل ایندکس برای صفحه اصلی + لینک‌سازی داخلی
// ─────────────────────────────────────────────────────────────

const points = [
  {
    icon: PartyPopper,
    title: "برگزاری کامل رویداد",
    desc: "همایش، سمینار، کنفرانس و رویداد سازمانی — از ایده و برنامه‌ریزی تا اجرای روز رویداد.",
  },
  {
    icon: Megaphone,
    title: "برندسازی و تبلیغات",
    desc: "استراتژی برند، هویت بصری و کمپین‌های هدفمند در شبکه‌های اجتماعی و گوگل.",
  },
  {
    icon: CalendarCheck,
    title: "ثبت‌حضور آنلاین",
    desc: "سیستم رزرو و ثبت‌نام رایگان مهمانان با لیست انتظار خودکار و مدیریت ظرفیت.",
  },
  {
    icon: TrendingUp,
    title: "گزارش و آمار زنده",
    desc: "داشبورد اختصاصی برای برگزارکننده‌ها؛ آمار ثبت‌نام و حضور در لحظه در دسترس است.",
  },
];

export function WhyAvahub() {
  return (
    <section
      aria-labelledby="why-avahub"
      className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 h-64 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_65%)]"
      />
      <div className="relative">
        <p className="text-xs font-bold tracking-[0.3em] text-gold-soft/90">
          WHY AVAHUB
        </p>
        <h2 id="why-avahub" className="mt-3 text-2xl font-black sm:text-3xl">
          از ایده تا اجرا؛ همراه شما در هر مرحله
        </h2>

        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-8 text-foreground/70 sm:text-[15px] sm:leading-9">
          <p>
            آواهاب ایونتس، زیرمجموعه مؤسسه فرهنگی هنری آوای شباهنگ، از ایده تا
            اجرا کنار شماست. ما با تیمی متخصص از برنامه‌ریزان، طراحان و مجریان،
            برگزاری همایش، سمینار، کنفرانس و رویدادهای سازمانی را به تجربه‌ای
            دقیق و بی‌دغدغه تبدیل می‌کنیم؛ از طراحی مفهوم و کمپین اطلاع‌رسانی تا
            اجرای روز رویداد و گزارش پایانی. هر پروژه برای ما یک داستان است؛
            داستانی که باید در ذهن مخاطب ماندگار شود.
          </p>
          <p>
            در کنار رویدادسازی، خدمات برندسازی و تبلیغات ما — از استراتژی برند و
            طراحی هویت بصری تا تولید محتوا و مدیریت کمپین‌های اینستاگرام و گوگل —
            کسب‌وکار شما را در مسیر رشد همراهی می‌کند. سیستم ثبت‌حضور آنلاین
            آواهاب هم ثبت‌نام مهمانان را ساده می‌کند و هم به برگزارکننده‌ها آمار
            زنده شرکت‌کنندگان می‌دهد تا تصمیم‌ها بر پایه داده گرفته شود.
          </p>
          <p>
            اگر به‌دنبال تیمی هستید که رویداد شما را متفاوت، منظم و ماندگار برگزار
            کند،{" "}
            <Link
              href="/events"
              className="font-bold text-gold-soft underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold"
            >
              تقویم رویدادهای پیش رو
            </Link>{" "}
            را ببینید یا{" "}
            <Link
              href="/services"
              className="font-bold text-gold-soft underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold"
            >
              خدمات آواهاب
            </Link>{" "}
            را بررسی کنید.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:border-gold/35"
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <point.icon className="size-5 text-gold" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-black">{point.title}</h3>
              <p className="mt-2 text-xs leading-6 text-foreground/55">
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
