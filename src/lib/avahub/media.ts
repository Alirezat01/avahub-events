import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Media Manager — فاز ۶
// آپلود/تعویض/حذف تصاویر در باکت «media» سونابیس
// نوشتن فقط با کلید service_role (سمت سرور، داخل اکشن‌های
// گاردشدهٔ ادمین) — کلید هرگز به مرورگر نمی‌رود
// ─────────────────────────────────────────────────────────────

export const MEDIA_BUCKET = "media";
/** ۱۵ مگابایت سقف هر فایل */
export const MEDIA_MAX_BYTES = 15 * 1024 * 1024;
export const MEDIA_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export function isMediaConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** کلاینت service-role — فقط داخل Server Actions گاردشده */
export function getMediaAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type MediaItem = {
  name: string;
  url: string;
  size: number;
  updatedAt: string | null;
};

export function mediaPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** نام فایل امن برای باکت — از روی نام اصلی + پسوند */
export function safeMediaName(original: string): string {
  const dot = original.lastIndexOf(".");
  const ext = dot >= 0 ? original.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = (dot >= 0 ? original.slice(0, dot) : original)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const stamp = Date.now().toString(36);
  return `${stamp}-${base || "image"}${ext || ".bin"}`;
}

/** همهٔ رسانه‌های باکت media — جدیدترین اول */
export async function listMediaObjects(): Promise<MediaItem[] | null> {
  const client = getMediaAdminClient();
  if (!client) return null;
  const { data, error } = await client.storage.from(MEDIA_BUCKET).list("", {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return null;
  return (data ?? [])
    .filter((f) => f.name && !f.id?.startsWith("folder")) // فایل‌ها فقط
    .map((f) => ({
      name: f.name,
      url: mediaPublicUrl(f.name),
      size: f.metadata?.size ?? 0,
      updatedAt: f.updated_at ?? f.created_at ?? null,
    }));
}
