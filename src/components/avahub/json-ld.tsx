// ─────────────────────────────────────────────────────────────
// کامپوننت JSON-LD — فاز د (SEO)
// داده‌ی Schema.org را به‌صورت <script type="application/ld+json">
// داخل صفحه رندر می‌کند؛ برای Rich Results گوگل.
// فقط سرور-side استفاده شود (Server Component).
// ─────────────────────────────────────────────────────────────

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// BreadcrumbList یکپارچه — فاز E (سئو)
// یک helper مشترک تا همه صفحات دقیقاً یک ساختار داشته باشند.
// items: [{ name, href? }] — آخرین آیتم (صفحهٔ فعلی) می‌تواند href نداشته باشد.
// ─────────────────────────────────────────────────────────────

import { SITE_URL } from "@/lib/avahub/site";

export type BreadcrumbItem = { name: string; href?: string };

export function makeBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href ? `${SITE_URL}${item.href}` : `${SITE_URL}/`,
    })),
  };
}
