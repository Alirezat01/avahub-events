import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// فاز J — انتشار خودکار مقالهٔ مجله (نویسندهٔ هوش مصنوعی)
// این endpoint فقط توسط GitHub Action با توکن محرمانه صدا زده می‌شود.
// هدر مورد نیاز:  x-publish-token: <PUBLISH_TOKEN>
// بدنهٔ JSON:
//   title*        عنوان مقاله
//   slug*         اسلاگ لاتین یکتا (a-z0-9-)
//   content*      متن مقاله به صورت Markdown
//   excerpt       خلاصهٔ کارت مجله
//   category      یکی از: رویدادها | برندسازی | تولید محتوا | تبلیغات
//   tags[]        برچسب‌ها
//   coverImage    مسیر استاتیک /images/... یا URL باکت media سونابیس
//   seoTitle / seoDescription / authorName
//   status        "DRAFT" (پیش‌فرض) | "PUBLISHED"
//
// GET با توکن معتبر → ۴۰ مقالهٔ اخیر (عنوان/اسلاگ/کاور) برای اینکه
// نویسندهٔ AI موضوع تکراری انتخاب نکند (فاز N)
// PATCH با توکن معتبر → به‌روزرسانی فقط کاورِ یک مقالهٔ موجود
//   بدنه: { slug*, coverImage* } — فاز O: پرکردن کاور مقاله‌های قدیمی
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["رویدادها", "برندسازی", "تولید محتوا", "تبلیغات"];
const MAX_CONTENT_CHARS = 80_000;

function safeTokenEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "post";
  for (let i = 2; i < 60; i++) {
    const exists = await db.journalPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function requireToken(req: NextRequest): Promise<Response | null> {
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
  return null;
}

// ── کاور معتبر: مسیر استاتیک برند یا URL باکت media همین پروژه ──
function validCover(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const storageBase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const isStatic = /^\/images\/[a-z0-9-]+\.(png|jpg|webp)$/i.test(value);
  const isStorage =
    storageBase !== "" && value.startsWith(`${storageBase}/storage/v1/object/public/media/`);
  return isStatic || isStorage ? value : null;
}

// ── فاز N: مقالات اخیر برای جلوگیری از تکرار موضوع ──
export async function GET(req: NextRequest) {
  const denied = await requireToken(req);
  if (denied) return denied;
  try {
    const posts = await db.journalPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { title: true, slug: true, status: true, coverImage: true, createdAt: true },
    });
    return Response.json({ ok: true, posts });
  } catch (err) {
    console.error("recent-posts failed:", err);
    return Response.json({ ok: false, error: "خطای دیتابیس" }, { status: 500 });
  }
}

// ── فاز O: به‌روزرسانی فقط کاورِ مقالهٔ موجود (پرکردن کاورهای خالی) ──
export async function PATCH(req: NextRequest) {
  const denied = await requireToken(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "JSON نامعتبر" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const cover = validCover(body.coverImage);
  if (!slug) {
    return Response.json({ ok: false, error: "اسلاگ نامعتبر است" }, { status: 400 });
  }
  if (!cover) {
    return Response.json(
      { ok: false, error: "کاور نامعتبر است (فقط مسیر /images یا URL باکت media همین پروژه)" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.journalPost.update({
      where: { slug },
      data: { coverImage: cover },
      select: { slug: true, coverImage: true },
    });
    return Response.json({ ok: true, slug: updated.slug, coverImage: updated.coverImage });
  } catch {
    return Response.json({ ok: false, error: "مقاله‌ای با این اسلاگ نبود" }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  // ── احراز توکن ──
  const denied = await requireToken(req);
  if (denied) return denied;

  // ── بدنه ──
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "JSON نامعتبر" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const rawSlug = typeof body.slug === "string" ? body.slug : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!title || title.length > 200) {
    return Response.json({ ok: false, error: "عنوان نامعتبر است" }, { status: 400 });
  }
  if (content.length < 300 || content.length > MAX_CONTENT_CHARS) {
    return Response.json(
      { ok: false, error: "متن مقاله باید بین ۳۰۰ تا ۸۰٬۰۰۰ کاراکتر باشد" },
      { status: 400 }
    );
  }

  const slug = await uniqueSlug(normalizeSlug(rawSlug));
  if (!slug) {
    return Response.json({ ok: false, error: "اسلاگ نامعتبر است" }, { status: 400 });
  }

  const category =
    typeof body.category === "string" && ALLOWED_CATEGORIES.includes(body.category)
      ? body.category
      : "رویدادها";

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string").slice(0, 8)
    : [];

  // کاور: مسیر استاتیک برند یا URL باکت media همین پروژه (تصویر AI فاز N)
  const coverImage = validCover(body.coverImage) ?? "/images/event-showcase.png";

  const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const data: Prisma.JournalPostCreateInput = {
    slug,
    title,
    content,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.slice(0, 300) : content.slice(0, 155),
    category,
    tags,
    coverImage,
    status,
    authorName: typeof body.authorName === "string" ? body.authorName.slice(0, 60) : "تیم محتوای آواهاب",
    metaTitle: typeof body.seoTitle === "string" ? body.seoTitle.slice(0, 180) : null,
    metaDescription:
      typeof body.seoDescription === "string" ? body.seoDescription.slice(0, 300) : null,
    ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
  };

  try {
    const post = await db.journalPost.create({ data, select: { id: true, slug: true, status: true } });
    return Response.json({ ok: true, id: post.id, slug: post.slug, status: post.status });
  } catch (err) {
    console.error("auto-publish failed:", err);
    return Response.json({ ok: false, error: "خطای دیتابیس" }, { status: 500 });
  }
}
