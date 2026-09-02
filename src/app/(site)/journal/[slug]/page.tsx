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

// ─────────────────────────────────────────────────────────────
// صفحهٔ مقالهٔ مجله — فاز ۶
// فقط مقاله‌های PUBLISHED عمومی هستند؛ پیش‌نویس → 404
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const post = await db.journalPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") return null;
  return post;
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

  return (
    <>
      <JsonLd data={articleJsonLd} />
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
    </>
  );
}
