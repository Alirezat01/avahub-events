import type { Metadata } from "next";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { ContactForm } from "@/components/avahub/contact-form";
import { WhatsAppIcon } from "@/components/avahub/whatsapp-icon";

export const metadata: Metadata = {
  title: "تماس با آواهاب ایونتس | مشاوره رایگان رویداد و تبلیغات",
  description:
    "ارتباط با آواهاب ایونتس؛ تهران، کریم‌خان زند، خیابان حسینی، پلاک ۶۱. تلفن ۰۹۳۵۱۰۷۷۹۴۷ — درخواست مشاوره رایگان رویداد و تبلیغات.",
  alternates: { canonical: "/contact" },
};

const INFO = [
  {
    icon: Phone,
    title: "تلفن تماس",
    value: "۰۹۳۵ ۱۰۷ ۷۹۴۷",
    href: "tel:+989351077947",
    external: false,
  },
  {
    icon: WhatsAppIcon,
    title: "واتساپ",
    value: "گفتگوی مستقیم با تیم",
    href: "https://wa.me/989351077947",
    external: true,
  },
  {
    icon: Instagram,
    title: "اینستاگرام",
    value: "avahubevents@",
    href: "https://instagram.com/avahubevents",
    external: true,
  },
  {
    icon: Facebook,
    title: "فیسبوک",
    value: "avahubevents",
    href: "https://facebook.com/avahubevents",
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="CONTACT US"
        title="بیایید صحبت کنیم"
        sub="یک جلسه مشاوره رایگان؛ درباره رویداد یا برند شما حرف می‌زنیم و مسیر درخشش را روشن می‌کنیم."
      />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Info side */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Reveal>
              <div className="rounded-3xl border border-border bg-charcoal/60 p-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                  <MapPin className="size-6" aria-hidden="true" />
                </div>
                <h2 className="font-black">دفتر آواهاب</h2>
                <p className="mt-3 text-sm leading-8 text-foreground/60">
                  تهران، خیابان کریم‌خان زند،
                  <br />
                  خیابان حسینی، پلاک ۶۱، طبقه سوم
                </p>
                <p className="mt-3 text-xs leading-6 text-foreground/40">
                  پاسخگویی: شنبه تا پنجشنبه، ۹ صبح تا ۶ عصر
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-4">
              {INFO.map((item, i) => (
                <Reveal key={item.title} delay={0.08 * (i + 1)}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35"
                  >
                    <item.icon
                      className="mb-3 size-5 text-gold transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-foreground/80">
                      {item.title}
                    </span>
                    <span className="mt-1 text-[11px] text-foreground/50" dir={item.title === "تلفن تماس" ? "rtl" : undefined}>
                      {item.value}
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Form side */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
