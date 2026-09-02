import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// لایهٔ داده نمونه‌کارها — فاز ۶
// تا وقتی ادمین نمونه‌کار واقعی ثبت نکرده، چیدمان ثابت فعلی
// (تصاویر آماده) نمایش داده می‌شود تا سایت خالی نماند
// ─────────────────────────────────────────────────────────────

export type PortfolioView = {
  image: string;
  title: string;
  tag: string;
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
