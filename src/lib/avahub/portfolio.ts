import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// لایهٔ داده نمونه‌کارها — فاز ۶ + فاز E (کیس‌استادی + سئو)
// تا وقتی ادمین نمونه‌کار واقعی ثبت نکرده، چیدمان ثابت فعلی
// (تصاویر آماده) نمایش داده می‌شود تا سایت خالی نماند
// ─────────────────────────────────────────────────────────────

export type PortfolioView = {
  image: string;
  title: string;
  tag: string;
};

export type PortfolioCase = PortfolioView & {
  id: string;
  slug: string | null;
  description: string | null;
  client: string | null;
  projectType: string | null;
  projectDate: string | null;
  servicesUsed: string[];
  results: string | null;
  gallery: string[];
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  altText: string | null;
};

/** چیدمان پیش‌فرض — همان نمونه‌کارهای آمادهٔ فعلی سایت */
export const PORTFOLIO_FALLBACK: PortfolioView[] = [
  { image: "/images/event-seminar.png", title: "کنفرانس و سمینار تخصصی", tag: "کنفرانس" },
  { image: "/images/event-conference.png", title: "همایش و کنفرانس", tag: "همایش" },
  { image: "/images/about-backstage.png", title: "پشت‌صحنه رویداد", tag: "پشت‌صحنه" },
  { image: "/images/event-panel.png", title: "نشست تخصصی و پنل برند", tag: "سمینار" },
  { image: "/images/portfolio-branding.png", title: "هویت بصری رویداد", tag: "برندینگ" },
  { image: "/images/hero-bg.png", title: "رویداد بزرگ سالان", tag: "رویداد ویژه" },
];

/** نمونه‌کارهای فعال سایت — از دیتابیس؛ اگر خالی بود، چیدمان پیش‌فرض */
export async function getActivePortfolioItems(): Promise<{
  items: PortfolioView[];
  fromDb: boolean;
}> {
  const rows = await db.portfolioItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { title: true, tag: true, coverImage: true },
  });

  if (rows.length === 0) return { items: PORTFOLIO_FALLBACK, fromDb: false };

  return {
    items: rows.map((r) => ({
      image: r.coverImage,
      title: r.title,
      tag: r.tag ?? "نمونه‌کار",
    })),
    fromDb: true,
  };
}

/** فاز E — کیس‌استادی‌های فعال با همهٔ فیلدها (featured اول) */
export async function getPortfolioCases(): Promise<{
  cases: PortfolioCase[];
  fromDb: boolean;
}> {
  const rows = await db.portfolioItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      tag: true,
      coverImage: true,
      slug: true,
      description: true,
      client: true,
      projectType: true,
      projectDate: true,
      servicesUsed: true,
      results: true,
      gallery: true,
      isFeatured: true,
      seoTitle: true,
      seoDescription: true,
      altText: true,
    },
  });

  if (rows.length === 0) return { cases: [], fromDb: false };

  const cases: PortfolioCase[] = rows.map((r) => ({
    id: r.id,
    image: r.coverImage,
    title: r.title,
    tag: r.tag ?? "نمونه‌کار",
    slug: r.slug,
    description: r.description,
    client: r.client,
    projectType: r.projectType,
    projectDate: r.projectDate,
    servicesUsed: r.servicesUsed ?? [],
    results: r.results,
    gallery: r.gallery ?? [],
    isFeatured: r.isFeatured,
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
    altText: r.altText,
  }));

  // ویژه‌ها اول
  cases.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  return { cases, fromDb: true };
}

/** یک کیس‌استادی با اسلاگ — برای صفحهٔ جزئیات */
export async function getPortfolioCaseBySlug(slug: string): Promise<PortfolioCase | null> {
  const row = await db.portfolioItem
    .findFirst({
      where: { isActive: true, slug },
      select: {
        id: true,
        title: true,
        tag: true,
        coverImage: true,
        slug: true,
        description: true,
        client: true,
        projectType: true,
        projectDate: true,
        servicesUsed: true,
        results: true,
        gallery: true,
        isFeatured: true,
        seoTitle: true,
        seoDescription: true,
        altText: true,
      },
    })
    .catch(() => null);
  if (!row) return null;
  return {
    id: row.id,
    image: row.coverImage,
    title: row.title,
    tag: row.tag ?? "نمونه‌کار",
    slug: row.slug,
    description: row.description,
    client: row.client,
    projectType: row.projectType,
    projectDate: row.projectDate,
    servicesUsed: row.servicesUsed ?? [],
    results: row.results,
    gallery: row.gallery ?? [],
    isFeatured: row.isFeatured,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    altText: row.altText,
  };
}
