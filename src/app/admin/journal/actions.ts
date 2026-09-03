"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSuperAdmin } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// Server Actions مجله — فاز ۶ (فقط ادمین)
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JournalFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  warnings?: string[]; // فاز E — هشدار سئو (تکراری بودن Title/Description)
};

// فاز E — هشدار تکراری بودن Title/Description در مقاله‌های دیگر
async function dupMetaWarnings(
  metaTitle: string | null,
  metaDescription: string | null,
  excludeId?: string
): Promise<string[]> {
  const warnings: string[] = [];
  const not = excludeId ? { id: { not: excludeId } } : {};
  if (metaTitle) {
    const dup = await db.journalPost.findFirst({ where: { metaTitle, ...not }, select: { title: true } });
    if (dup) warnings.push(`هشدار سئو: Title تکراری — در مقالهٔ «${dup.title}» هم استفاده شده است.`);
  }
  if (metaDescription) {
    const dup = await db.journalPost.findFirst({ where: { metaDescription, ...not }, select: { title: true } });
    if (dup) warnings.push(`هشدار سئو: Description تکراری — در مقالهٔ «${dup.title}» هم استفاده شده است.`);
  }
  return warnings;
}

const schema = z.object({
  title: z.string().trim().min(3, "عنوان حداقل ۳ نویسه").max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(90)
    .regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/, "اسلاگ فقط حروف/رقم و خط تیره")
    .optional()
    .or(z.literal("")),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().trim().max(50000).optional().or(z.literal("")),
  coverImage: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  authorName: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().optional().or(z.literal("")),
  metaTitle: z.string().trim().max(120).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  isFeatured: z.boolean().optional().default(false),
});

function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
  return base || `post-${Date.now().toString(36)}`;
}

async function uniqueSlug(preferred: string, excludeId?: string): Promise<string> {
  let candidate = preferred;
  let n = 2;
  for (;;) {
    const exists = await db.journalPost.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${preferred}-${n++}`;
  }
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  // ورودی date به وقت تهران تفسیر می‌شود
  const v = value.trim();
  const hasTz = /(?:z|[+-]\d{2}:?\d{2})$/i.test(v);
  const d = new Date(hasTz ? v : `${v}T12:00:00+03:30`);
  return isNaN(d.getTime()) ? null : d;
}

function readForm(fd: FormData) {
  return schema.safeParse({
    title: fd.get("title"),
    slug: fd.get("slug") ?? "",
    excerpt: fd.get("excerpt") ?? "",
    content: fd.get("content") ?? "",
    coverImage: fd.get("coverImage") ?? "",
    icon: fd.get("icon") ?? "",
    tags: fd.get("tags") ?? "",
    authorName: fd.get("authorName") ?? "",
    status: fd.get("status") ?? "DRAFT",
    publishedAt: fd.get("publishedAt") ?? "",
    metaTitle: fd.get("metaTitle") ?? "",
    metaDescription: fd.get("metaDescription") ?? "",
    category: fd.get("category") ?? "",
    isFeatured: fd.get("isFeatured") === "on" || fd.get("isFeatured") === "true",
  });
}

function tagsToArray(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function createJournalAction(
  _prev: JournalFormState,
  fd: FormData
): Promise<JournalFormState> {
  try {
    await assertSuperAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  const parsed = readForm(fd);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const iss of parsed.error.issues) fe[iss.path.join(".")] = iss.message;
    return { error: "خطای اعتبارسنجی — فیلدها را بررسی کنید", fieldErrors: fe };
  }
  const d = parsed.data;

  const publishedAt = parseDate(d.publishedAt);
  if (d.publishedAt && !publishedAt) return { error: "تاریخ انتشار نامعتبر است" };
  if (d.status === "PUBLISHED" && !publishedAt) {
    // بدون تاریخ مشخص → الان
  }
  const slug = await uniqueSlug(d.slug ? d.slug : slugifyTitle(d.title));

  // فاز E — هشدار سئوی تکراری بودن (غیرمسدودکننده)
  const warnings = await dupMetaWarnings(
    d.metaTitle || d.title,
    d.metaDescription || d.excerpt || null
  );

  const post = await db.journalPost.create({
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      content: d.content || "",
      coverImage: d.coverImage || null,
      icon: d.icon || null,
      tags: tagsToArray(d.tags),
      category: d.category || null,
      isFeatured: d.isFeatured,
      authorName: d.authorName || null,
      status: d.status,
      publishedAt:
        d.status === "PUBLISHED" ? (publishedAt ?? new Date()) : publishedAt,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
    },
    select: { id: true },
  });

  if (warnings.length > 0) {
    redirect(`/admin/journal/${post.id}/edit?created=1&w=${encodeURIComponent(warnings.join(" | "))}`);
  }
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect(`/admin/journal/${post.id}/edit?created=1`);
}

export async function updateJournalAction(
  _prev: JournalFormState,
  fd: FormData
): Promise<JournalFormState> {
  try {
    await assertSuperAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "شناسه نامعتبر است" };

  const parsed = readForm(fd);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const iss of parsed.error.issues) fe[iss.path.join(".")] = iss.message;
    return { error: "خطای اعتبارسنجی — فیلدها را بررسی کنید", fieldErrors: fe };
  }
  const d = parsed.data;

  const publishedAt = parseDate(d.publishedAt);
  if (d.publishedAt && !publishedAt) return { error: "تاریخ انتشار نامعتبر است" };
  const slug = await uniqueSlug(d.slug ? d.slug : slugifyTitle(d.title), id);

  // فاز E — هشدار سئو
  const warnings = await dupMetaWarnings(
    d.metaTitle || d.title,
    d.metaDescription || d.excerpt || null,
    id
  );

  await db.journalPost.update({
    where: { id },
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      content: d.content || "",
      coverImage: d.coverImage || null,
      icon: d.icon || null,
      tags: tagsToArray(d.tags),
      category: d.category || null,
      isFeatured: d.isFeatured,
      authorName: d.authorName || null,
      status: d.status,
      publishedAt:
        d.status === "PUBLISHED" ? (publishedAt ?? new Date()) : publishedAt,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
    },
  });

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  if (warnings.length > 0) {
    redirect(`/admin/journal/${id}/edit?updated=1&w=${encodeURIComponent(warnings.join(" | "))}`);
  }
  redirect(`/admin/journal/${id}/edit?updated=1`);
}

export async function deleteJournalAction(fd: FormData): Promise<void> {
  await assertSuperAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  await db.journalPost.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

export async function toggleJournalStatusAction(fd: FormData): Promise<void> {
  await assertSuperAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  const post = await db.journalPost.findUnique({ where: { id }, select: { status: true } });
  if (!post) return;
  await db.journalPost.update({
    where: { id },
    data: {
      status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      ...(post.status === "DRAFT" ? { publishedAt: new Date() } : {}),
    },
  });
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}
