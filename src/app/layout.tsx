import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/avahub/site";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
  display: "swap",
});

// تأیید مالکیت Google Search Console — اگر NEXT_PUBLIC_GOOGLE_VERIFICATION ست شود، متا تگ رندر می‌شود (فاز د)
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...(GOOGLE_VERIFICATION
    ? { verification: { google: GOOGLE_VERIFICATION } }
    : {}),
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
        {/* هدر/فوتر در گروه مسیر (site)/layout.tsx است — پنل ادمین بیرون آن، بدون هدر تکراری (C1) */}
        {children}
        <Toaster />

        {/* Google Analytics 4 — فقط وقتی NEXT_PUBLIC_GA_ID در ورسل ست شده باشد لود می‌شود (فاز د) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });`}
            </Script>
          </>
        )}
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
