import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { SERVICES, getService } from "@/lib/avahub/services";
import { PageHero } from "@/components/avahub/page-hero";
import { Reveal } from "@/components/avahub/reveal";
import { FaqList } from "@/components/avahub/faq";
import { CtaBanner } from "@/components/avahub/sections";

const SITE_URL = "https://www.avahubevents.com";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.seoTitle,
    description: service.seoDescription,
    keywords: [service.title, "آواهاب ایونتس", "رویداد", "تبلیغات", "برند"],
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.seoTitle} | آواهاب ایونتس`,
      description: service.seoDescription,
      url: `${SITE_URL}/services/${service.slug}`,
      images: [{ url: service.icon, width: 1024, height: 1024, alt: service.title }],
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.seoDescription,
      provider: {
        "@type": "Organization",
        name: "آواهاب ایونتس",
        url: SITE_URL,
      },
      areaServed: "IR",
      url: `${SITE_URL}/services/${service.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: service.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "خدمات", item: `${SITE_URL}/services` },
        {
          "@type": "ListItem",
          position: 3,
          name: service.title,
          item: `${SITE_URL}/services/${service.slug}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="مسیر صفحه"
        className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-28"
      >
        <ol className="flex items-center gap-1.5 text-xs text-foreground/45">
          <li>
            <Link href="/" className="transition-colors hover:text-gold">
              خانه
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronLeft className="size-3.5" />
          </li>
          <li>
            <Link href="/services" className="transition-colors hover:text-gold">
              خدمات
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronLeft className="size-3.5" />
          </li>
          <li className="text-gold-soft">{service.title}</li>
        </ol>
      </nav>

      <PageHero eyebrow={service.heroLine} title={service.title} sub={service.heroSub} />

      {/* Floating 3D icon + intro */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <Reveal>
          <div className="relative mx-auto mb-12 flex size-32 items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-full bg-purple/20 blur-2xl"
            />
            <Image
              src={service.icon}
              alt={`آیکون سه‌بعدی ${service.title}`}
              width={128}
              height={128}
              sizes="128px"
              className="relative size-28 object-contain drop-shadow-[0_0_30px_rgba(123,77,223,0.4)]"
            />
          </div>
        </Reveal>
        <div className="mx-auto grid max-w-4xl gap-6">
          {service.intro.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <p className="text-[15px] leading-9 text-foreground/70 sm:text-base">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-12 text-center">
            <h2 className="text-2xl font-black sm:text-3xl">
              در این خدمت <span className="text-gradient-gold">چه چیزی</span> دریافت
              می‌کنید؟
            </h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.06}>
                <div className="group h-full rounded-2xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-[0_16px_45px_-18px_rgba(212,175,55,0.3)]">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-black">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/55">
                    {feature.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-black sm:text-3xl">مسیر اجرا</h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.process.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <div className="relative h-full rounded-2xl border border-border bg-charcoal/60 p-5 text-center">
                  <span className="text-3xl font-black text-gradient-gold">
                    {(i + 1).toLocaleString("fa-IR")}
                  </span>
                  <h3 className="mt-2 font-black">{step.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-foreground/55">
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-black sm:text-3xl">سؤالات پرتکرار</h2>
            <div aria-hidden="true" className="mx-auto mt-4 h-px w-24 gold-line" />
          </Reveal>
          <Reveal delay={0.1}>
            <FaqList items={service.faqs} />
          </Reveal>
        </div>
      </section>

      {/* Other services (SEO cross links) */}
      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-6 text-center text-lg font-black text-foreground/80">
              خدمات دیگر آواهاب
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SERVICES.filter((s) => s.slug !== service.slug).map((other) => (
                <Link
                  key={other.slug}
                  href={`/services/${other.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold"
                >
                  {other.title}
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
