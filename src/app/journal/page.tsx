import type { Metadata } from "next";
import { BookOpen, Clock3 } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";

export const metadata: Metadata = {
  title: "مجله آواهاب | آموزش و تحلیل دنیای رویداد و تبلیغات",
  description:
    "مجله آواهاب ایونتس؛ مقالات آموزشی و تحلیلی درباره برگزاری رویداد، تبلیغات، برندسازی و تولید محتوا.",
  alternates: { canonical: "/journal" },
};

const ARTICLES = [
  {
    title: "راهنمای کامل برگزاری همایش‌های شرکتی در ۱۴۰۵",
    excerpt:
      "از انتخاب سالن و چیدمان پلات اجرا تا پذیرایی و گزارش پایانی؛ هر آن‌چه برای برگزاری یک همایش حرفه‌ای نیاز دارید.",
    date: "۱۴۰۵/۰۶/۱۵",
    gradient: "from-[#7b4ddf]/50 via-[#4a2d92]/40 to-transparent",
    icon: "🏢",
  },
  {
    title: "۵ تکنیک برای درخشش برند در رویدادها",
    excerpt:
      "برند شما نباید فقط حاضر باشد؛ باید دیده شود و بماند. پنج تکنیک عملی برای تبدیل حضور در رویداد به بازدهی ماندگار.",
    date: "۱۴۰۵/۰۶/۰۸",
    gradient: "from-[#d4af37]/50 via-[#8a6d2f]/40 to-transparent",
    icon: "✨",
  },
  {
    title: "پشت صحنه یک همایش موفق؛ از ایده تا اجرا",
    excerpt:
      "سفری به پشت صحنه‌ی یکی از همایش‌های اخیر آواهاب؛ از جلسه اول شناخت تا لحظه خاموش‌شدن نور آخر شب.",
    date: "۱۴۰۵/۰۵/۳۰",
    gradient: "from-[#a855f7]/40 via-[#5b35ad]/40 to-transparent",
    icon: "🎤",
  },
];

export default function JournalPage() {
  return (
    <>
      <PageHero
        eyebrow="JOURNAL"
        title="مجله آواهاب"
        sub="یادداشت‌ها، آموزش‌ها و روایت‌های تیم آواهاب از دنیای رویداد، تبلیغات و برند."
      />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {ARTICLES.map((article, i) => (
            <Reveal key={article.title} delay={i * 0.08}>
              <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-[0_18px_50px_-18px_rgba(212,175,55,0.25)]">
                {/* cover */}
                <div className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${article.gradient}`}>
                  <span className="text-5xl transition-transform duration-500 group-hover:scale-125" aria-hidden="true">
                    {article.icon}
                  </span>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-[#0a0a0f]/70 px-2.5 py-1 text-[10px] font-bold text-gold-soft backdrop-blur">
                    <Clock3 className="size-3" aria-hidden="true" />
                    به‌زودی
                  </span>
                </div>
                <div className="p-5">
                  <time className="text-[11px] text-foreground/40">{article.date}</time>
                  <h2 className="mt-2 text-[15px] font-black leading-7 transition-colors group-hover:text-gold-soft">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-xs leading-6 text-foreground/55">
                    {article.excerpt}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center">
            <BookOpen className="size-6 text-gold/70" aria-hidden="true" />
            <p className="max-w-xl text-sm leading-7 text-foreground/50">
              موتور مجله در فاز مدیریت محتوا فعال می‌شود؛ اولین مقالات واقعی با
              سئوی اختصاصی از طریق پنل مدیریت منتشر خواهد شد.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
