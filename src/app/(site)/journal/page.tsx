import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { getPublishedPosts, type JournalCardView } from "@/lib/avahub/journal";
import { JsonLd, makeBreadcrumbJsonLd } from "@/components/avahub/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله آواهاب | آموزش برگزاری رویداد، برندسازی و تبلیغات",
  description:
    "مجله آواهاب ایونتس؛ مقالات آموزشی و تحلیلی درباره برگزاری رویداد و همایش، برندسازی، تبلیغات دیجیتال و تولید محتوا — دسته‌بندی‌شده و به‌روز.",
  alternates: { canonical: "/journal" },
};

/** کارت مقاله — فاز E: دسته + featured */
function ArticleCard({
  article,
  index,
  fromDb,
}: {
  article: JournalCardView;
  index: number;
  fromDb: boolean;
}) {
  const inner = (
    <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-[0_18px_50px_-18px_rgba(212,175,55,0.25)]">
      {/* cover */}
      <div className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${article.gradient}`}>
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized={article.coverImage.startsWith("http")}
          />
        ) : (
          <span className="text-5xl transition-transform duration-500 group-hover:scale-125" aria-hidden="true">
            {article.icon}
          </span>
        )}
        {(fromDb && article.tags.length > 0) && (
          <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-[#0a0a0f]/70 px-2.5 py-1 text-[10px] font-bold text-gold-soft backdrop-blur">
            {article.tags[0]}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2">
          {article.category && (
            <span className="rounded-full border border-purple/40 bg-purple/10 px-2.5 py-0.5 text-[10px] font-bold text-purple">
              {article.category}
            </span>
          )}
          {article.date && <time className="text-[11px] text-foreground/40">{article.date}</time>}
        </div>
        <h2 className="mt-2 text-[15px] font-black leading-7 transition-colors group-hover:text-gold-soft">
          {article.title}
        </h2>
        <p className="mt-3 text-xs leading-6 text-foreground/55 line-clamp-3">
          {article.excerpt}
        </p>
      </div>
    </article>
  );

  return (
    <Reveal key={`${article.title}-${index}`} delay={index * 0.08}>
      {article.slug ? (
        <Link href={`/journal/${article.slug}`} className="block h-full">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Reveal>
  );
}

export default async function JournalPage() {
  const { posts, fromDb } = await getPublishedPosts();

  const featured = fromDb ? posts.find((p) => p.isFeatured && p.slug) : undefined;
  const gridPosts = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;

  return (
    <>
      <JsonLd
        data={makeBreadcrumbJsonLd([
          { name: "خانه", href: "/" },
          { name: "مجله", href: "/journal" },
        ])}
      />
      <PageHero
        eyebrow="JOURNAL"
        title="مجله آواهاب"
        sub="یادداشت‌ها، آموزش‌ها و روایت‌های تیم آواهاب از دنیای رویداد، تبلیغات و برند."
      />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* مقالهٔ ویژه — فاز E */}
        {featured && (
          <Reveal>
            <Link
              href={`/journal/${featured.slug}`}
              className="group grid gap-0 overflow-hidden rounded-3xl border border-border bg-card/50 lg:grid-cols-2"
            >
              <div className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br lg:aspect-auto lg:min-h-[320px] ${featured.gradient}`}>
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized={featured.coverImage.startsWith("http")}
                  />
                ) : (
                  <span className="text-6xl" aria-hidden="true">{featured.icon}</span>
                )}
              </div>
              <div className="flex flex-col justify-center gap-3 p-7 sm:p-9">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-bold text-gold-soft">
                  <Star className="size-3" aria-hidden="true" />
                  مقالهٔ ویژه
                </span>
                <h2 className="text-xl font-black leading-relaxed transition-colors group-hover:text-gold-soft sm:text-2xl">
                  {featured.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-8 text-foreground/60">{featured.excerpt}</p>
                {featured.date && <time className="text-[11px] text-foreground/40">{featured.date}</time>}
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {gridPosts.map((article, i) => (
            <ArticleCard key={`${article.title}-${i}`} article={article} index={i} fromDb={fromDb} />
          ))}
        </div>

        {!fromDb && (
          <Reveal className="mt-10">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center">
              <BookOpen className="size-6 text-gold/70" aria-hidden="true" />
              <p className="max-w-xl text-sm leading-7 text-foreground/50">
                مقالات واقعی مجله به‌زودی از طریق پنل مدیریت منتشر می‌شود؛ آن‌چه
                می‌بینید کارت‌های آشنایی اول است.
              </p>
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
