"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/avahub/admin";
import {
  MEDIA_ALLOWED_TYPES,
  MEDIA_MAX_BYTES,
  getMediaAdminClient,
  isMediaConfigured,
  mediaPublicUrl,
  safeMediaName,
} from "@/lib/avahub/media";

// ─────────────────────────────────────────────────────────────
// Server Actions رسانه‌ها — فاز ۶ (فقط ادمین)
// آپلود/تعویض/حذف فایل در باکت «media» با کلید service_role
// ─────────────────────────────────────────────────────────────

export type MediaActionState = { ok?: boolean; error?: string; url?: string };

function validateFile(file: File): string | null {
  if (!file || file.size === 0) return "فایلی انتخاب نشده است";
  if (file.size > MEDIA_MAX_BYTES) return "حجم فایل بیش از ۱۵ مگابایت است";
  if (!MEDIA_ALLOWED_TYPES.includes(file.type))
    return "فرمت مجاز نیست — فقط PNG، JPG، WebP، GIF یا SVG";
  return null;
}

export async function uploadMediaAction(
  _prev: MediaActionState,
  fd: FormData
): Promise<MediaActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  if (!isMediaConfigured()) {
    return {
      error:
        "کلید SUPABASE_SERVICE_ROLE_KEY در تنظیمات محیط تعریف نشده — طبق README بسته اضافه کنید",
    };
  }

  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "فایلی انتخاب نشده است" };
  const err = validateFile(file);
  if (err) return { error: err };

  const client = getMediaAdminClient();
  if (!client) return { error: "اتصال به رسانه برقرار نشد" };

  const name = safeMediaName(file.name || "image");
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage
    .from("media")
    .upload(name, buf, { contentType: file.type, upsert: false });
  if (error) return { error: `آپلود ناموفق: ${error.message}` };

  const url = mediaPublicUrl(name);
  revalidatePath("/admin/media");
  return { ok: true, url };
}

export async function replaceMediaAction(
  _prev: MediaActionState,
  fd: FormData
): Promise<MediaActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  if (!isMediaConfigured()) {
    return { error: "کلید SUPABASE_SERVICE_ROLE_KEY در تنظیمات محیط تعریف نشده" };
  }

  const path = String(fd.get("path") ?? "");
  if (!path || path.includes("..")) return { error: "مسیر نامعتبر است" };

  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "فایلی انتخاب نشده است" };
  const err = validateFile(file);
  if (err) return { error: err };

  const client = getMediaAdminClient();
  if (!client) return { error: "اتصال به رسانه برقرار نشد" };

  // همان نام قبلی → همه‌جای سایت که این URL را دارد، عکس نو می‌شود
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await client.storage
    .from("media")
    .upload(path, buf, { contentType: file.type, upsert: true });
  if (error) return { error: `تعویض ناموفق: ${error.message}` };

  revalidatePath("/admin/media");
  return { ok: true, url: mediaPublicUrl(path) };
}

export async function deleteMediaAction(
  _prev: MediaActionState,
  fd: FormData
): Promise<MediaActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  if (!isMediaConfigured()) {
    return { error: "کلید SUPABASE_SERVICE_ROLE_KEY در تنظیمات محیط تعریف نشده" };
  }

  const path = String(fd.get("path") ?? "");
  if (!path || path.includes("..")) return { error: "مسیر نامعتبر است" };

  const client = getMediaAdminClient();
  if (!client) return { error: "اتصال به رسانه برقرار نشد" };

  const { error } = await client.storage.from("media").remove([path]);
  if (error) return { error: `حذف ناموفق: ${error.message}` };

  revalidatePath("/admin/media");
  return { ok: true };
}
