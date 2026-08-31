import type { Metadata } from "next";
import { PageHero } from "@/components/avahub/page-hero";
import { EventExplorer } from "@/components/avahub/event-explorer";
import { CtaBanner } from "@/components/avahub/sections";

export const metadata: Metadata = {
  title: "رویدادهای پیش رو | کنسرت، همایش و فستیوال",
  description:
    "تقویم رویدادهای پیش رو آواهاب ایونتس؛ کنسرت، همایش، فستیوال و کارگاه‌های تخصصی با ثبت حضور آنلاین. رویداد بعدی خود را همین حالا پیدا کنید.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="UPCOMING EVENTS"
        title="رویدادهای پیش رو"
        sub="از کنسرت و فستیوال تا همایش و کارگاه تخصصی — رویداد بعدی خود را پیدا کنید و رزرو را از دست ندهید."
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <EventExplorer />
        <p className="mt-10 text-center text-xs text-foreground/40">
          نمونه‌های اولیه — پس از فعال‌سازی پنل مدیریت، رویدادهای واقعی و سیستم
          ثبت حضور آنلاین از همین صفحه در دسترس قرار می‌گیرد.
        </p>
      </section>
      <CtaBanner />
    </>
  );
}
