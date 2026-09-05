import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, Tag, Users } from "lucide-react";
import { PageHero } from "@/components/avahub/page-hero";
import { JsonLd, makeBreadcrumbJsonLd } from "@/components/avahub/json-ld";
import { getPortfolioCases } from "@/lib/avahub/portfolio";
import { absoluteImageUrl, SITE_URL } from "@/lib/avahub/site";
import { SERVICES } from "@/lib/avahub/services";

// ─────────────────────────────────────────────────────────────
// کیس‌استادی — فاز M
// تا امروز sitemap این URLها را به گوگل می‌داد ولی صفحه وجود
// نداشت (۴۰۴!) — این صفحه لینک‌های داخلی و سئوی پورتفولیو را
// به موتور اصلی سئو تبدیل می‌کند.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Params = { slug: string };

async function getCase(slug: string) {
  try {
    const { cases, fromDb } = await getPortfolioCases();
    if (!fromDb) return null;
    return cases.find((c) => c.slug === slug) ?? null;
  } catch (e) {
    console.error("[portfolio-case] خطای خواندن کیس:", e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCase(slug);
  if (!c) return { title: "نمونه‌کار یافت نشد" };
  const title = c.seoTitle || `${c.title} | نمونه‌کار آواهاب ایونتس`;
  const description =
    c.seoDescription ||
    c.description?.slice(0, 155) ||
    `نمونه‌کار ${c.title} — اجرای حرفه‌ای توسط آواهاب ایونتس`;
  const cover = absoluteImageUrl(c.image);
  return {
    title,
    description,
    alternates: { canonical: `/portfolio/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/portfolio/${slug}`,
      type: "article",
      locale: "fa_IR",
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function PortfolioCasePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const c = await getCase(slug);
  if (!c) notFound();

  // سایر کیس‌ها برای لینک‌سازی داخلی
  let otherCases: { slug: string; title: string; image: string }[] = [];
  try {
    const { cases } = await getPortfolioCases();
    otherCases = cases
      .filter((x) => x.slug && x.slug !== c.slug)
      .slice(0, 3)
      .map((x) => ({ slug: x.slug!, title: x.title, image: x.image }));
  } catch {
    otherCases = [];
  }

  const cover = c.image;
  const coverAbs = absoluteImageUrl(cover);

  // اسکیمای Article — فاز M
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.seoDescription ?? c.description?.slice(0, 160) ?? undefined,
    image: coverAbs ? [coverAbs] : undefined,
    inLanguage: "fa-IR",
    author: { "@type": "Organization", name: "آواهاب ایونتس", url: SITE_URL },
    publisher: { "@type": "Organization", name: "آواهاب ایونتس", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/portfolio/${c.slug}`,
    about: c.projectType ? { "@type": "Thing", name: c.projectType } : undefined,
  };
  const breadcrumbJsonLd = makeBreadcrumbJsonLd([
    { name: "خانه", href: "/" },
    { name: "نمونه‌کارها", href: "/portfolio" },
    { name: c.title, href: `/portfolio/${c.slug}` },
  ]);

  // خدمات استفاده‌شده → لینک به صفحات خدمات
  const usedServices = (c.servicesUsed ?? [])
    .map((name) => SERVICES.find((s) => s.title.includes(name) || name.includes(s.title.replace("آتلیهٔ ", "").replace("استودیو ", "").slice(0, 8))))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));

  const paragraphs = (c.description ?? "")
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero eyebrow="CASE STUDY" title={c.title} sub={c.tag || c.projectType || "نمونه‌کار آواهاب ایونتس"} />

      <article className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        {/* کاور */}
        {cover && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl border border-border">
            <Image
              src={cover}
              alt={c.altText || c.title}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* متادیتای پروژه */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="مشخصات پروژه">
          {c.client && (
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                <Building2 className="size-3.5" aria-hidden="true" /> کارفرما
              </p>
              <p className="mt-1 text-sm font-bold">{c.client}</p>
            </div>
          )}
          {c.projectType && (
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                <Tag className="size-3.5" aria-hidden="true" /> نوع پروژه
              </p>
              <p className="mt-1 text-sm font-bold">{c.projectType}</p>
            </div>
          )}
          {c.projectDate && (
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                <CalendarDays className="size-3.5" aria-hidden="true" /> زمان اجرا
              </p>
              <p className="mt-1 text-sm font-bold">{c.projectDate}</p>
            </div>
          )}
          {c.servicesUsed.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                <Users className="size-3.5" aria-hidden="true" /> خدمات
              </p>
              <p className="mt-1 text-xs font-bold leading-5">{c.servicesUsed.join("، ")}</p>
            </div>
          )}
        </section>

        {/* شرح پروژه */}
        {paragraphs.length > 0 && (
          <section className="mt-10 space-y-4 text-[15px] leading-8 text-foreground/80">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        )}

        {/* نتایج */}
        {c.results && (
          <section className="mt-10 rounded-3xl border border-gold/35 bg-gold/[0.06] p-6 sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-gold">
              <ArrowRight className="size-5" aria-hidden="true" />
              نتیجهٔ پروژه
            </h2>
            <p className="text-[15px] leading-8 text-foreground/85">{c.results}</p>
          </section>
        )}

        {/* گالری */}
        {c.gallery.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-black">تصاویر پروژه</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {c.gallery.map((g, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                  <Image src={g} alt={`${c.title} — تصویر ${i + 1}`} fill sizes="(min-width:640px) 33vw, 50vw" className="object-cover transition duration-500 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* لینک بیرونی پروژه */}
        {c.link && (
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-gold/40 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10"
          >
            مشاهدهٔ نتیجه به‌صورت زنده
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        )}

        {/* خدمات استفاده‌شده — لینک‌سازی داخلی */}
        {usedServices.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-black">خدمات به‌کاررفته در این پروژه</h2>
            <div className="flex flex-wrap gap-2">
              {usedServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground/80 transition hover:border-gold/40 hover:text-gold"
                >
                  {s.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* سایر نمونه‌کارها */}
        {otherCases.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-black">سایر نمونه‌کارها</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {otherCases.map((o) => (
                <Link
                  key={o.slug}
                  href={`/portfolio/${o.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border transition hover:border-gold/40"
                >
                  <div className="relative aspect-[16/10]">
                    <Image src={o.image} alt={o.title} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <p className="p-3 text-xs font-bold leading-5">{o.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 rounded-3xl border border-border bg-card/60 p-6 text-center sm:p-8">
          <h2 className="text-lg font-black">پروژهٔ مشابه دارید؟</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-foreground/60">
            تیم آواهاب ایونتس همین پروژه را برای برند شما با کیفیت بالاتر اجرا می‌کند — مشاورهٔ اولیه رایگان است.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-black transition hover:bg-gold-soft">
              درخواست مشاوره
            </Link>
            <Link href="/services" className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold text-foreground/80 transition hover:border-gold/40 hover:text-gold">
              مشاهده خدمات
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
