import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/avahub/services";
import { getUpcomingPublishedEvents } from "@/lib/avahub/events-db";

const BASE = "https://www.avahubevents.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ([
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/portfolio`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/journal`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((route) => ({ ...route, lastModified: now }));

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.map((service) => ({
    url: `${BASE}/services/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // رویدادهای منتشرشده — فاز ۳
  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await getUpcomingPublishedEvents();
    eventRoutes = events.map((event) => ({
      url: `${BASE}/events/${event.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    eventRoutes = [];
  }

  return [...staticRoutes, ...serviceRoutes, ...eventRoutes];
}
