import type { Metadata } from "next";
import Image from "next/image";
import { Award, Layers, MapPin } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { CountUp } from "@/components/avahub/count-up";
import { JsonLd, makeBreadcrumbJsonLd } from "@/components/avahub/json-ld";

export const metadata: Metadata = {
  title: "درباره آواهاب ایونتس | میراث آوای شباهنگ، اجرای حرفه‌ای رویداد",
  description:
    "آواهاب ایونتس از ۱۴۰۰ با تکیه بر میراث ۴۰ ساله مؤسسه آوای شباهنگ، رویداد و تبلیغات را با تیم فنی داخلی، خدمات یکپارچه و پوشش چندشهری اجرا می‌کند.",
  alternates: { canonical: "/about" },
};

const STATS = [
  { value: 26, label: "رویداد اجراشده" },
  { value: 3, label: "شهر فعال" },
  { value: 7563, prefix: "+", label: "مخاطب جمع‌آوری‌شده" },
  { value: 5, prefix: "+", label: "سال تجربه آواهاب" },
];

const WHY = [
  {
    icon: Award,
    title: "تیم فنی داخلی",
    desc: "صدا، نور و تصویر با تجهیزات و نیروی متخصص خودمان؛ کنترل کیفیت بدون واسطه، از تست اول تا اجرای نهایی.",
  },
  {
    icon: Layers,
    title: "خدمات یکپارچه",
    desc: "استراتژی، تولید محتوا، تبلیغات و اجرای رویداد زیر یک سقف؛ نتیجه‌اش پیام یکدست و اجرای بدون درز است.",
  },
  {
    icon: MapPin,
    title: "پوشش چندشهری",
    desc: "تجربه اجرای رویداد در چند شهر با ساختار تیم‌های اجرایی هم‌استاندارد؛ برند شما در هر شهری یک‌جور می‌درخشد.",
  },
];

const STEPS = [
  { title: "شناخت", desc: "هدف، مخاطب و چشم‌انداز شما را می‌شنویم و داده‌ها را جمع می‌کنیم." },
  { title: "طراحی", desc: "مفهوم، بودجه شفاف و نقشه اجرایی دقیق طراحی و تأیید می‌شود." },
  { title: "اجرا", desc: "تیم فنی و اجرایی آماده می‌شود؛ رویداد بی‌نقص روی صحنه می‌رود." },
  { title: "گزارش", desc: "نتایج با اعداد روشن تحویل می‌شود تا قدم بعدی محکم‌تر باشد." },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={makeBreadcrumbJsonLd([
          { name: "خانه", href: "/" },
          { name: "درباره ما", href: "/about" },
        ])}
      />
      <PageHero
        eyebrow="ABOUT AVAHUB"
        title="ما ایده‌ها را به تجربه تبدیل می‌کنیم"
        sub="آواهاب ایونتس، خانهٔ رویداد و پروموشن؛ وارث تجربه چنددهه‌ای آوای شباهنگ در دنیای فرهنگ و هنر."
      />

      {/* Story */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <Image
                src="/images/about-backstage.png"
                alt="پشت‌صحنه اجرای رویداد توسط تیم آواهاب"
                width={1344}
                height={768}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/70 via-transparent to-transparent"
              />
              <p className="absolute bottom-4 right-4 rounded-full border border-gold/40 bg-[#0a0a0f]/70 px-4 py-1.5 text-xs font-bold text-gold-soft backdrop-blur">
                پشت‌صحنه؛ جایی که جادو ساخته می‌شود
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <h2 className="text-2xl font-black leading-relaxed sm:text-3xl">
              از دل <span className="text-gradient-gold">آوای شباهنگ</span>؛ برای
              نسل امروز
            </h2>
            <p className="mt-5 text-[15px] leading-9 text-foreground/65">
              مؤسسه فرهنگی هنری آوای شباهنگ بیش از چهار دهه است در برگزاری
              رویدادهای فرهنگی و هنری نامی مطمئن است. آواهاب ایونتس از سال ۱۴۰۰ با
              همان ریشه‌ها اما با رویکردی تازه متولد شد: رویدادی که بعد از
              شب اجرا هم ادامه دارد. ما
              باور داریم رویداد با تجربه زنده تمام نمی‌شود؛ با داده، محتوا و
              مخاطبی ادامه پیدا می‌کند که بعد از رویداد هم همراه شما می‌ماند.
            </p>
            <p className="mt-4 text-[15px] leading-9 text-foreground/65">
              در این مسیر، بیش از بیست‌وشش رویداد در سه شهر اجرا کرده‌ایم و
              هزاران مخاطب را به برندها افزوده‌ایم. هر رویداد برای ما یک پروژه
              نیست؛ یک تجربه ماندگار است که باید هم برای مخاطب زیبا باشد و هم
              برای برند شما قابل اندازه‌گیری.
            </p>
          </Reveal>
        </div>

        {/* Real stats */}
        <Reveal delay={0.1}>
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5 bg-charcoal/80 px-4 py-7">
                <dd className="text-3xl font-black text-gradient-gold sm:text-4xl">
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <CountUp value={stat.value} />
                </dd>
                <dt className="text-xs text-foreground/55 sm:text-sm">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* Why us */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
              WHY AVAHUB
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">چرا آواهاب؟</h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {WHY.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="group h-full rounded-2xl border border-border bg-card/60 p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-[0_16px_45px_-18px_rgba(212,175,55,0.3)]">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="size-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/55">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process timeline */}
      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-gold-soft/90">
              OUR PROCESS
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">روند کار ما در چهار قدم</h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden="true"
              className="absolute inset-x-16 top-7 hidden h-px bg-gradient-to-l from-purple/40 via-gold/40 to-purple/40 lg:block"
            />
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12} className="relative text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-gold/40 bg-charcoal text-lg font-black text-gradient-gold shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                  {(i + 1).toLocaleString("fa-IR")}
                </div>
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-60 text-sm leading-7 text-foreground/55">
                  {step.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
