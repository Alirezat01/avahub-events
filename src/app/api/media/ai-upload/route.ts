import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getMediaAdminClient, MEDIA_BUCKET, mediaPublicUrl, safeMediaName } from "@/lib/avahub/media";

// ─────────────────────────────────────────────────────────────
// فاز N — آپلود تصویر کاورِ تولیدیِ هوش مصنوعی
// این endpoint فقط توسط GitHub Action با توکن محرمانه صدا زده می‌شود.
// هدر مورد نیاز:  x-publish-token: <PUBLISH_TOKEN>
// بدنهٔ JSON:
//   dataBase64*  محتوای تصویر به‌صورت base64 (بدون پیشوند data:)
//   filename     نام اختیاری فایل برای تولید نام امن
// خروجی: { ok: true, url: "https://<supabase>/storage/v1/object/public/media/..." }
// تصویر در باکت «media» (همان Media Manager پنل) زیرپوشهٔ ai/ ذخیره می‌شود.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

/** سقف ۴ مگابایت برای تصویر decoded (زیر محدودیت بدنهٔ Vercel) */
const MAX_BYTES = 4 * 1024 * 1024;

function safeTokenEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** تشخیص نوع فایل از امضای بایت‌ها — فقط JPEG / PNG / WEBP */
function sniffImageMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

const EXT_OF: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  // ── احراز توکن ──
  const secret = process.env.PUBLISH_TOKEN;
  if (!secret) {
    return Response.json(
      { ok: false, error: "PUBLISH_TOKEN روی سرور تنظیم نشده است" },
      { status: 503 }
    );
  }
  const provided = req.headers.get("x-publish-token") ?? "";
  if (!provided || !safeTokenEqual(provided, secret)) {
    return Response.json({ ok: false, error: "توکن نامعتبر است" }, { status: 401 });
  }

  // ── سرویس مدیا باید پیکربندی شده باشد ──
  const client = getMediaAdminClient();
  if (!client) {
    return Response.json(
      { ok: false, error: "حافظهٔ رسانه (سونابیس) روی سرور پیکربندی نشده است" },
      { status: 503 }
    );
  }

  // ── بدنه ──
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "JSON نامعتبر" }, { status: 400 });
  }

  const raw64 = typeof body.dataBase64 === "string" ? body.dataBase64 : "";
  if (!raw64) {
    return Response.json({ ok: false, error: "dataBase64 خالی است" }, { status: 400 });
  }

  const buf = Buffer.from(raw64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (buf.length < 100) {
    return Response.json({ ok: false, error: "تصویر نامعتبر یا خراب است" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "تصویر بزرگ‌تر از ۴ مگابایت است" },
      { status: 413 }
    );
  }

  const mime = sniffImageMime(buf);
  if (!mime) {
    return Response.json(
      { ok: false, error: "فرمت تصویر پشتیبانی نمی‌شود (فقط JPEG/PNG/WEBP)" },
      { status: 415 }
    );
  }

  const filename =
    typeof body.filename === "string" && body.filename.trim()
      ? body.filename.trim()
      : `ai-cover${EXT_OF[mime]}`;

  const path = `ai/${safeMediaName(filename).replace(/(\.[a-z0-9.]+)?$/i, EXT_OF[mime])}`;

  const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, buf, {
    contentType: mime,
    cacheControl: "31536000",
    upsert: false,
  });

  // اگر نام تکراری شد (بعید)، یک‌بار با نام تازه تلاش کن
  if (error) {
    const retryPath = `ai/${Date.now().toString(36)}-ai-cover${EXT_OF[mime]}`;
    const retry = await client.storage.from(MEDIA_BUCKET).upload(retryPath, buf, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (retry.error) {
      console.error("ai-upload failed:", retry.error.message);
      return Response.json({ ok: false, error: "آپلود به حافظهٔ رسانه شکست خورد" }, { status: 500 });
    }
    return Response.json({ ok: true, url: mediaPublicUrl(retryPath) });
  }

  return Response.json({ ok: true, url: mediaPublicUrl(path) });
}
