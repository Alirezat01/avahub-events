import type { Metadata } from "next";

// لایوت سروری صفحه ورود — page.tsx کلاینت-کامپوننت است و نمی‌تواند metadata صادر کند.
// فاز د۲ (SEO): صفحه ورود نباید در گوگل ایندکس شود.
export const metadata: Metadata = {
  title: "ورود و ثبت‌نام",
  description: "ورود و ثبت‌نام در آواهاب ایونتس برای ثبت‌حضور رویدادها.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
