import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Phone, ExternalLink, MapPin } from "lucide-react";
import { SERVICES } from "@/lib/avahub/services";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.38-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

const SOCIALS = [
  {
    label: "اینستاگرام آواهاب",
    href: "https://instagram.com/avahubevents",
    icon: Instagram,
  },
  {
    label: "فیسبوک آواهاب",
    href: "https://facebook.com/avahubevents",
    icon: Facebook,
  },
  {
    label: "واتساپ آواهاب",
    href: "https://wa.me/989351077947",
    icon: WhatsAppIcon,
  },
];

const QUICK_LINKS = [
  { label: "خانه", href: "/" },
  { label: "رویدادها", href: "/events" },
  { label: "خدمات", href: "/services" },
  { label: "نمونه‌کارها", href: "/portfolio" },
  { label: "مجله", href: "/journal" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-8 border-t border-border bg-[#07070b]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px gold-line" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand — لوگوی واقعی آواهاب */}
          <div>
            <Link href="/" aria-label="آواهاب ایونتس — خانه">
              <Image
                src="/images/logo-full.png"
                alt="آواهاب ایونتس"
                width={657}
                height={625}
                className="h-20 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-foreground/55">
              زیرمجموعه مؤسسه فرهنگی هنری آوای شباهنگ — اینجا ایده‌های شما
              تبدیل به تجربه می‌شود.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition-all hover:-translate-y-1 hover:border-gold/50 hover:text-gold"
                >
                  <social.icon className="size-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="لینک‌های فوتر">
            <h3 className="mb-4 text-sm font-bold tracking-wide text-foreground/85">
              دسترسی سریع
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/55 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="col-span-2">
                <a
                  href="https://www.avayeshabahang.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-foreground/55 transition-colors hover:text-gold"
                >
                  مؤسسه آوای شباهنگ
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>

          {/* Services (SEO internal links) */}
          <nav aria-label="خدمات آواهاب">
            <h3 className="mb-4 text-sm font-bold tracking-wide text-foreground/85">
              خدمات ما
            </h3>
            <ul className="space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-sm text-foreground/55 transition-colors hover:text-gold"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-foreground/85">
              ارتباط با ما
            </h3>
            <ul className="space-y-3 text-sm text-foreground/55">
              <li>
                <a
                  href="tel:+989351077947"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <Phone className="size-4 text-gold" aria-hidden="true" />
                  <span dir="ltr">۰۹۳۵ ۱۰۷ ۷۹۴۷</span>
                </a>
              </li>
              <li className="flex items-start gap-2 leading-7">
                <MapPin className="mt-1.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  تهران، خیابان کریم‌خان زند،
                  <br />
                  خیابان حسینی، پلاک ۶۱، طبقه سوم
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-foreground/40 sm:flex-row">
          <p>
            © ۱۴۰۵ آواهاب ایونتس — تمامی حقوق محفوظ است.{" "}
            <Link
              href="/terms"
              className="transition-colors hover:text-gold"
            >
              توافق‌نامه کاربر و حریم خصوصی
            </Link>
          </p>
          <p className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-gold" />
            اینجا ایده‌های شما تبدیل به تجربه می‌شود
          </p>
        </div>
      </div>

      {/* spacer for mobile bottom nav */}
      <div aria-hidden="true" className="h-[72px] md:hidden" />
    </footer>
  );
}
