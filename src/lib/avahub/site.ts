// ─────────────────────────────────────────────────────────────
// آدرس پایه سایت — فاز د (SEO)
// همه canonical / sitemap / JSON-LD از اینجا می‌خوانند.
// اگر NEXT_PUBLIC_SITE_URL در ورسل ست شود، همین استفاده می‌شود؛
// پیش‌فرض: دامنه اصلی avahubevents.com
// ─────────────────────────────────────────────────────────────

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.avahubevents.com"
).replace(/\/+$/, "");

/** تبدیل مسیر نسبی عکس به URL مطلق — برای JSON-LD و OG */
export function absoluteImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}
