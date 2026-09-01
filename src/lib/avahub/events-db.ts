import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// لایه داده رویدادها — فاز ۳
// صفحات عمومی از دیتابیس واقعی (Supabase) می‌خوانند.
// فقط رویدادهای PUBLISHED و آینده برای عموم نمایش داده می‌شود.
// ─────────────────────────────────────────────────────────────

export type EventCardData = {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  summary: string | null;
  coverImage: string | null;
  startsAt: string; // ISO
  venueName: string | null;
  venueCity: string;
  isFeatured: boolean;
  badge?: string;
};

export type CategoryData = {
  slug: string;
  title: string;
};

/** بج نمایشی کارت بر اساس فاصله زمانی و ویژه بودن */
function computeBadge(startsAt: Date, isFeatured: boolean): string | undefined {
  const days = (startsAt.getTime() - Date.now()) / 86_400_000;
  if (days > 45) return "به‌زودی";
  if (isFeatured) return "ویژه";
  if (days <= 30) return "ثبت‌نام باز";
  return undefined;
}

/** رویدادهای منتشرشده و آینده — مرتب از نزدیک به دور */
export async function getUpcomingPublishedEvents(limit?: number): Promise<EventCardData[]> {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    ...(limit ? { take: limit } : {}),
    include: { category: { select: { slug: true, title: true } } },
  });

  return events.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category?.title ?? "رویداد",
    categorySlug: e.category?.slug ?? "",
    summary: e.summary,
    coverImage: e.coverImage,
    startsAt: e.startsAt.toISOString(),
    venueName: e.venueName,
    venueCity: e.venueCity,
    isFeatured: e.isFeatured,
    badge: computeBadge(e.startsAt, e.isFeatured),
  }));
}

/** دسته‌بندی‌های فعال (برای فیلتر صفحه رویدادها) */
export async function getActiveCategories(): Promise<CategoryData[]> {
  const cats = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, title: true },
  });
  return cats;
}

/** جزئیات کامل یک رویداد برای صفحه اختصاصی */
export async function getEventBySlug(slug: string) {
  return db.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: { select: { slug: true, title: true } } },
  });
}

/** رویدادهای مرتبط (همان دسته، به‌جز خودش) */
export async function getRelatedEvents(
  slug: string,
  categoryId: number | null,
  limit = 4,
): Promise<EventCardData[]> {
  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date() },
      slug: { not: slug },
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: { category: { select: { slug: true, title: true } } },
  });

  return events.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category?.title ?? "رویداد",
    categorySlug: e.category?.slug ?? "",
    summary: e.summary,
    coverImage: e.coverImage,
    startsAt: e.startsAt.toISOString(),
    venueName: e.venueName,
    venueCity: e.venueCity,
    isFeatured: e.isFeatured,
    badge: computeBadge(e.startsAt, e.isFeatured),
  }));
}
