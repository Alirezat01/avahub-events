import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// لایهٔ داده مجله آواهاب — فاز ۶
// تا انتشار اولین مقالهٔ واقعی از پنل، سه کارت تیزر فعلی
// نمایش داده می‌شود تا صفحه خالی نماند
// ─────────────────────────────────────────────────────────────

export type JournalCardView = {
  slug?: string;
  title: string;
  excerpt: string;
  date: string | null;
  dateObj: Date | null;
  gradient: string;
  icon: string;
  coverImage: string | null;
  tags: string[];
  category: string | null;
  isFeatured: boolean;
};

const GRADIENTS = [
  "from-[#7b4ddf]/50 via-[#4a2d92]/40 to-transparent",
  "from-[#d4af37]/50 via-[#8a6d2f]/40 to-transparent",
  "from-[#a855f7]/40 via-[#5b35ad]/40 to-transparent",
];

/** کارت‌های تیزر فعلی — تا وقتی مقالهٔ واقعی منتشر نشده */
export const JOURNAL_FALLBACK: JournalCardView[] = [
  {
    title: "راهنمای کامل برگزاری همایش‌های شرکتی در ۱۴۰۵",
    excerpt:
      "از انتخاب سالن و چیدمان پلات اجرا تا پذیرایی و گزارش پایانی؛ هر آن‌چه برای برگزاری یک همایش حرفه‌ای نیاز دارید.",
    date: "۱۴۰۵/۰۶/۱۵",
    dateObj: null,
    gradient: GRADIENTS[0],
    icon: "🏢",
    coverImage: null,
    tags: [],
    category: "رویدادها",
    isFeatured: false,
  },
  {
    title: "۵ تکنیک برای درخشش برند در رویدادها",
    excerpt:
      "برند شما نباید فقط حاضر باشد؛ باید دیده شود و بماند. پنج تکنیک عملی برای تبدیل حضور در رویداد به بازدهی ماندگار.",
    date: "۱۴۰۵/۰۶/۰۸",
    dateObj: null,
    gradient: GRADIENTS[1],
    icon: "✨",
    coverImage: null,
    tags: [],
    category: "برندسازی",
    isFeatured: false,
  },
  {
    title: "پشت صحنه یک همایش موفق؛ از ایده تا اجرا",
    excerpt:
      "سفری به پشت صحنه‌ی یکی از همایش‌های اخیر آواهاب؛ از جلسه اول شناخت تا لحظه خاموش‌شدن نور آخر شب.",
    date: "۱۴۰۵/۰۵/۳۰",
    dateObj: null,
    gradient: GRADIENTS[2],
    icon: "🎤",
    coverImage: null,
    tags: [],
    category: "رویدادها",
    isFeatured: false,
  },
];

/** مقالات منتشرشده برای صفحهٔ مجله */
export async function getPublishedPosts(): Promise<{
  posts: JournalCardView[];
  fromDb: boolean;
}> {
  const rows = await db.journalPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  if (rows.length === 0) return { posts: JOURNAL_FALLBACK, fromDb: false };

  return {
    fromDb: true,
    posts: rows.map((p, i) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? p.content.slice(0, 150),
      date: p.publishedAt
        ? new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
            timeZone: "Asia/Tehran",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(p.publishedAt)
        : null,
      dateObj: p.publishedAt,
      gradient: p.gradient || GRADIENTS[i % GRADIENTS.length],
      icon: p.icon || "✨",
      coverImage: p.coverImage,
      tags: p.tags,
      category: (p as { category?: string | null }).category ?? null,
      isFeatured: (p as { isFeatured?: boolean }).isFeatured ?? false,
    })),
  };
}
