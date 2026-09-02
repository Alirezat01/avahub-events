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
