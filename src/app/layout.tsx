import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/avahub/header";
import { SiteFooter } from "@/components/avahub/footer";
import { BottomNav } from "@/components/avahub/bottom-nav";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
  display: "swap",
});

const SITE_URL = "https://www.avahubevents.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "آواهاب ایونتس | رویداد، پروموشن و برندسازی",
    template: "%s | آواهاب ایونتس",
  },
  description:
    "آواهاب ایونتس؛ از ایده تا اجرا کنار شماست — برگزاری رویداد، پروموشن و برندسازی؛ زیرمجموعه مؤسسه فرهنگی هنری آوای شباهنگ. اینجا ایده‌های شما تبدیل به تجربه می‌شود.",
  keywords: [
    "آواهاب",
    "آواهاب ایونتس",
    "رویداد",
    "همایش",
    "سمینار",
    "کنفرانس",
    "ثبت حضور رویداد",
    "تبلیغات و برندسازی",
    "مدیریت رویداد",
    "آوای شباهنگ",
  ],
  authors: [{ name: "Avahub Events" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: "آواهاب ایونتس",
    title: "آواهاب ایونتس | اینجا ایده‌های شما تبدیل به تجربه می‌شود",
    description:
      "کشف رویدادها، ثبت حضور آنلاین و تجربه‌ای سینمایی از دنیای رویداد — آواهاب ایونتس.",
    images: [
      {
        url: "/images/hero-bg.png",
        width: 1344,
        height: 768,
        alt: "پلتفرم رویداد آواهاب ایونتس",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "آواهاب ایونتس | اینجا ایده‌های شما تبدیل به تجربه می‌شود",
    description:
      "کشف رویدادها، ثبت حضور آنلاین و تجربه‌ای سینمایی از دنیای رویداد.",
    images: ["/images/hero-bg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "آواهاب ایونتس",
    alternateName: "Avahub Events",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-full.png`,
    description:
      "برگزاری رویداد، پروموشن و برندسازی؛ زیرمجموعه مؤسسه فرهنگی هنری آوای شباهنگ",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IR",
      addressLocality: "تهران",
      streetAddress: "خیابان کریم‌خان زند، خیابان حسینی، پلاک ۶۱، طبقه سوم",
    },
    telephone: "+989351077947",
    sameAs: [
      "https://instagram.com/avahubevents",
      "https://facebook.com/avahubevents",
      "https://www.avayeshabahang.com",
    ],
  };

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazir.variable} flex min-h-screen flex-col font-sans antialiased bg-background text-foreground`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <BottomNav />
        <Toaster />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
