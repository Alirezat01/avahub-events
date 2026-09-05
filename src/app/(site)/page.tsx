import type { Metadata } from "next";
import { Hero } from "@/components/avahub/hero";
import { ServicesSection } from "@/components/avahub/sections";
import { FeaturedEvents } from "@/components/avahub/featured-events";
import { WhyAvahub } from "@/components/avahub/why-avahub";
import { JsonLd } from "@/components/avahub/json-ld";
import { SITE_URL } from "@/lib/avahub/site";

// ── فاز E (سئو): متادیتای اختصاصی صفحهٔ اصلی + WebSite/Organization Schema ──
export const metadata: Metadata = {
  // absolute: چون برند داخل عنوان است، قالب «%s | آواهاب ایونتس» دوبار تکرارش نمی‌کند
  title: { absolute: "آواهاب ایونتس | برگزاری رویداد، همایش و کنفرانس در تهران" },
  description:
    "آواهاب ایونتس — زیرمجموعه مؤسسه آوای شباهنگ؛ برگزاری همایش، کنفرانس، سمینار و رویداد سازمانی در تهران و چند شهر، همراه با تبلیغات دیجیتال، برندسازی و ثبت‌حضور آنلاین رایگان.",
  keywords: [
    "برگزاری رویداد",
    "برگزاری همایش",
    "برگزاری کنفرانس",
    "برگزاری سمینار",
    "ایونت سازمانی",
    "رویداد در تهران",
    "تبلیغات دیجیتال",
    "برندسازی رویداد",
    "ثبت حضور آنلاین رویداد",
    "آواهاب ایونتس",
    "آوای شباهنگ",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: "آواهاب ایونتس",
    title: "آواهاب ایونتس | برگزاری رویداد، همایش و کنفرانس در تهران",
    description:
      "از ایده تا اجرا؛ همایش، کنفرانس و رویداد سازمانی + تبلیغات دیجیتال و برندسازی — ثبت‌حضور آنلاین رایگان.",
    images: [
      {
        url: "/images/hero-bg.png",
        width: 1344,
        height: 768,
        alt: "پلتفرم رویداد آواهاب ایونتس",
      },
    ],
  },
};

// فقط WebSite — Organization از قبل در layout.tsx سراسری است (بدون تکرار)
const homeJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "آواهاب ایونتس",
  alternateName: "AVA HUB EVENTS",
  url: SITE_URL,
  inLanguage: "fa-IR",
};

export default function Home() {
  return (
    <>
      <JsonLd data={homeJsonLd} />
      <Hero />
      <ServicesSection />
      <FeaturedEvents />
      <WhyAvahub />
    </>
  );
}
