import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/avahub/services";
import { SITE_URL } from "@/lib/avahub/site";
import { EVENT_TYPE_LANDINGS } from "@/lib/avahub/event-types";
import { db } from "@/lib/db";

const BASE = SITE_URL;

// sitemap باید همیشه تازه باشد — ایونت/مقالهٔ جدید بدون redeploy ظاهر شود (فاز د)
export const dynamic = "force-dynamic";

// فاز E: تاریخ واقعی آخرین تغییر صفحات خدمات (به‌جای «الان»)
const SERVICES_LAST_UPDATED = new Date("2026-09-03T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // فاز E: lastModified واقعی صفحات = آخرین تغییر محتوای واقعی سایت
  let contentUpdatedAt = SERVICES_LAST_UPDATED;
  try {
    const [lastEvent, lastPost] = await Promise.all([
      db.event.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      db.journalPost.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    ]);
    for (const d of [lastEvent?.updatedAt, lastPost?.updatedAt]) {
      if (d && d > contentUpdatedAt) contentUpdatedAt = d;
    }
  } catch (e) {
    // فاز M: خطای دیتابیس دیگر بی‌صدا نادیده گرفته نمی‌شود — در لاگ سرور ثبت می‌شود
    console.error("[sitemap] خطای خواندن lastModified از دیتابیس:", e);
  }

  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/portfolio`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/journal`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((route) => ({ ...route, lastModified: contentUpdatedAt }));

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: `${BASE}/services/${service.slug}`,
    lastModified: SERVICES_LAST_UPDATED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // رویدادهای منتشرشده — فاز ۳ | فاز د۲: lastModified واقعی از updatedAt
  // فاز E: رویدادهای گذشته هم آرشیو می‌شوند (پوشش کامل سئو)
  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    eventRoutes = events.map((event) => ({
      url: `${BASE}/events/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error("[sitemap] خطای خواندن رویدادها:", e);
    eventRoutes = [];
  }

  // مقالات منتشرشدهٔ مجله — فاز د (SEO)
  let journalRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.journalPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    journalRoutes = posts.map((post) => ({
      url: `${BASE}/journal/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("[sitemap] خطای خواندن مقالات:", e);
    journalRoutes = [];
  }

  // فاز E: کیس‌استادی‌های پورتفولیو (صفحات جزئیات)
  let portfolioRoutes: MetadataRoute.Sitemap = [];
  try {
    const cases = await db.portfolioItem.findMany({
      where: { isActive: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    });
    portfolioRoutes = cases.map((c) => ({
      url: `${BASE}/portfolio/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("[sitemap] خطای خواندن نمونه‌کارها:", e);
    portfolioRoutes = [];
  }

  // فاز M: لندینگ‌های اختصاصی انواع رویداد — صفحات کلیدی Content SEO
  const eventTypeRoutes: MetadataRoute.Sitemap = EVENT_TYPE_LANDINGS.map((t) => ({
    url: `${BASE}/event-types/${t.slug}`,
    lastModified: contentUpdatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...eventTypeRoutes,
    ...eventRoutes,
    ...journalRoutes,
    ...portfolioRoutes,
  ];
}
