import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { ArrowRight, Clock3, PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { formatJalaliShort } from "@/lib/avahub/jalali";
import { JsonLd } from "@/components/avahub/json-ld";
import { SITE_URL, absoluteImageUrl } from "@/lib/avahub/site";
import { SERVICES } from "@/lib/avahub/services";

// ─────────────────────────────────────────────────────────────
// صفحهٔ مقالهٔ مجله — فاز ۶
// فقط مقاله‌های PUBLISHED عمومی هستند؛ پیش‌نویس → 404
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  // فاز H: خطای لحظه‌ای DB → 404 به‌جای 500 (گوگل صفحهٔ خطا ایندکس نمی‌کند)
  try {
    const post = await db.journalPost.findUnique({ where: { slug } });
    if (!post || post.status !== "PUBLISHED") return null;
    return post;
  } catch {
    return null;
  }
}

/** تطبیق هوشمند خدمات مرتبط با موضوع مقاله — فاز د۲ (لینک‌سازی داخلی) */
function pickRelatedServices(title: string, tags: string[]): string[] {
  const hay = `${title} ${tags.join(" ")}`;
  const rules: Array<[RegExp, string]> = [
    [/همایش|کنفرانس|سمینار|رویداد|ایونت|جشن/, "grand-event-house"],
    [/تبلیغ|کمپین|گوگل|اینستاگرام|مارکتینگ|رسانه/, "novin-ad-studio"],
    [/محتوا|ویدیو|تیزر|عکاسی|موشن/, "content-atelier"],
    [/برند|هویت بصری|لوگو/, "brand-forge"],
    [/استراتژی|مشاوره|برنامه‌ریزی/, "strategy-room"],
  ];
  const picked: string[] = [];
  for (const [re, slug] of rules) {
    if (re.test(hay)) picked.push(slug);
    if (picked.length === 2) break;
  }
  return picked;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "مقاله پیدا نشد" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // فاز E: فهرست مطالب خودکار از تیترهای سطح ۲
  const tocItems = (post.content ?? "")
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.replace(/^##\s+/, "").trim())
    .slice(0, 12);

  // اسکیمای Article — فاز د (SEO)
  const coverUrl = absoluteImageUrl(post.coverImage);
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: coverUrl ? [coverUrl] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "fa-IR",
    author: {
      "@type": "Organization",
      name: post.authorName || "آواهاب ایونتس",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "آواهاب ایونتس",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo-full.png`,
      },
    },
    mainEntityOfPage: `${SITE_URL}/journal/${post.slug}`,
  };

  // اسکیمای BreadcrumbList — فاز د۲ (SEO)
  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "مجله", item: `${SITE_URL}/journal` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/journal/${post.slug}` },
    ],
  };

  const relatedSlugs = pickRelatedServices(post.title, post.tags);
  const relatedServices = relatedSlugs
    .map((slug) => SERVICES.find((s) => s.slug === slug))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* هدر مقاله */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple/10 blur-[130px]"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:px-6">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-gold-soft"
          >
            <ArrowRight className="size-3.5" aria-hidden="true" />
            بازگشت به مجله
          </Link>
          <h1 className="mt-5 text-3xl font-black leading-[1.4] sm:text-4xl sm:leading-[1.4]">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-foreground/50">
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-gold/70" aria-hidden="true" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatJalaliShort(post.publishedAt)}
                </time>
              </span>
            )}
            {post.authorName && (
              <span className="inline-flex items-center gap-1.5">
                <PenLine className="size-3.5 text-gold/70" aria-hidden="true" />
                {post.authorName}
              </span>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-bold text-gold-soft"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* کاور */}
      {post.coverImage && (
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-border">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
              priority
              unoptimized={post.coverImage.startsWith("http")}
            />
          </div>
        </div>
      )}

      {/* متن مقاله */}
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* فهرست مطالب خودکار — فاز E: از تیترهای ## مقاله */}
        {tocItems.length >= 3 && (
          <nav aria-label="فهرست مطالب" className="mb-8 rounded-2xl border border-border bg-card/50 p-5">
            <p className="mb-3 text-sm font-black">فهرست مطالب</p>
            <ol className="space-y-1.5 text-sm">
              {tocItems.map((t, i) => (
                <li key={i} className="flex gap-2 text-foreground/65">
                  <span className="text-gold/70" aria-hidden="true">{(i + 1).toLocaleString("fa-IR")}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="max-w-none text-[15px] leading-9 text-foreground/75 [&_a]:font-medium [&_a]:text-gold-soft [&_a]:underline [&_a]:decoration-gold/40 [&_a]:underline-offset-4 [&_blockquote]:my-5 [&_blockquote]:border-r-2 [&_blockquote]:border-gold/40 [&_blockquote]:bg-card/40 [&_blockquote]:py-1 [&_blockquote]:pe-4 [&_blockquote]:ps-4 [&_blockquote]:text-foreground/60 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-foreground [&_hr]:my-8 [&_hr]:border-border [&_img]:rounded-2xl [&_li]:my-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pe-6 [&_p]:my-4 [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pe-6">
          <Markdown>{post.content || post.excerpt || ""}</Markdown>
        </div>

        {/* پایان مقاله — امضای برند */}
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center">
          <p className="text-sm leading-7 text-foreground/60">
            این مقاله توسط تیم <span className="font-bold text-gold-soft">آواهاب ایونتس</span> نوشته شده است —
            اینجا ایده‌های شما تبدیل به تجربه می‌شود.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground shadow-[0_0_24px_rgba(212,175,55,0.25)] transition-shadow hover:shadow-[0_0_40px_rgba(212,175,55,0.45)]"
          >
            دیدن رویدادهای پیش‌رو
          </Link>
        </div>
      </article>

      {/* خدمات مرتبط — فاز د۲ (لینک‌سازی داخلی خدمات و مجله) */}
      <section
        aria-labelledby="related-services"
        className="mx-auto max-w-3xl px-4 pb-16 sm:px-6"
      >
        <h2
          id="related-services"
          className="flex items-center gap-3 text-lg font-black"
        >
          <span aria-hidden="true" className="h-5 w-1 rounded-full bg-gradient-to-b from-gold to-purple" />
          خدمات مرتبط آواهاب
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {relatedServices.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:border-gold/40"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <Image
                  src={service.icon}
                  alt={service.title}
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
              </span>
              <span>
                <span className="block text-sm font-black transition-colors group-hover:text-gold-soft">
                  {service.title}
                </span>
                <span className="mt-1 block text-xs leading-6 text-foreground/55">
                  {service.short}
                </span>
              </span>
            </Link>
          ))}
          <Link
            href="/services"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-card/30 p-4 transition-colors hover:border-gold/40 sm:col-span-2"
          >
            <span className="text-sm font-bold text-foreground/75 transition-colors group-hover:text-gold-soft">
              همه خدمات آواهاب ایونتس — از ایده تا اجرا
            </span>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-soft">
              مشاهده خدمات
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
