import type { Metadata } from "next";
import { PageHero } from "@/components/avahub/page-hero";
import { EventExplorer } from "@/components/avahub/event-explorer";
import { CtaBanner } from "@/components/avahub/sections";
import { getUpcomingPublishedEvents, getActiveCategories } from "@/lib/avahub/events-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "رویدادهای پیش رو | همایش، سمینار و کنفرانس",
  description:
    "تقویم رویدادهای پیش رو آواهاب ایونتس؛ همایش، سمینار، کنفرانس و کارگاه‌های تخصصی با ثبت حضور آنلاین. رویداد بعدی خود را همین حالا پیدا کنید.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getUpcomingPublishedEvents>> = [];
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  let dbError = false;

  try {
    [events, categories] = await Promise.all([
      getUpcomingPublishedEvents(),
      getActiveCategories(),
    ]);
  } catch {
    dbError = true;
  }

  return (
    <>
      <PageHero
        eyebrow="UPCOMING EVENTS"
        title="رویدادهای پیش رو"
        sub="از همایش و کنفرانس تا سمینار و کارگاه تخصصی — رویداد بعدی خود را پیدا کنید و رزرو را از دست ندهید."
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {dbError ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center">
            <p className="text-lg font-bold text-foreground/60">
              موقتاً در دسترس نیست
            </p>
            <p className="mt-2 text-sm text-foreground/40">
              در بارگذاری تقویم رویدادها مشکلی پیش آمد؛ چند لحظه دیگر دوباره تلاش کنید.
            </p>
          </div>
        ) : (
          <EventExplorer events={events} categories={categories} />
        )}
        {!dbError && events.length > 0 && (
          <p className="mt-10 text-center text-xs text-foreground/40">
            ثبت‌حضور آنلاین فعال است — از صفحه هر رویداد جایگاه خود را رایگان رزرو کنید.
          </p>
        )}
      </section>
      <CtaBanner />
    </>
  );
}
