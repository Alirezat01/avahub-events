"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// Server Actions نمونه‌کارها — فاز ۶ + فاز E (کیس‌استادی + سئو)
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PortfolioFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  warnings?: string[]; // فاز E — هشدار سئو
};

// فاز E — هشدار تکراری بودن Title/Description (در بین همهٔ نمونه‌کارها)
async function dupMetaWarnings(
  seoTitle: string | null,
  seoDescription: string | null,
  excludeId?: string
): Promise<string[]> {
  const warnings: string[] = [];
  const not = excludeId ? { id: { not: excludeId } } : {};
  if (seoTitle) {
    const dup = await db.portfolioItem.findFirst({ where: { seoTitle, ...not }, select: { title: true } });
    if (dup) warnings.push(`هشدار سئو: Title تکراری — در نمونه‌کار «${dup.title}» هم استفاده شده است.`);
  }
  if (seoDescription) {
    const dup = await db.portfolioItem.findFirst({ where: { seoDescription, ...not }, select: { title: true } });
    if (dup) warnings.push(`هشدار سئو: Description تکراری — در نمونه‌کار «${dup.title}» هم استفاده شده است.`);
  }
  return warnings;
}

function splitList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[,،\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function splitGallery(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/\n/)
    .map((t) => t.trim())
    .filter((t) => /^https?:\/\/|^\/images\//.test(t))
    .slice(0, 12);
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
  return base || `case-${Date.now().toString(36)}`;
}

async function uniqueCaseSlug(preferred: string, excludeId?: string): Promise<string> {
  let candidate = preferred;
  let n = 2;
  for (;;) {
    const exists = await db.portfolioItem.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${preferred}-${n++}`;
  }
}

const schema = z.object({
  title: z.string().trim().min(2, "عنوان حداقل ۲ نویسه").max(120),
  tag: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  coverImage: z.string().trim().min(1, "آدرس تصویر الزامی است").max(500),
  link: z
    .string()
    .trim()
    .max(400)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "لینک باید با http:// یا https:// شروع شود")
    .optional()
    .or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean().optional().default(true),
  // فاز E — کیس‌استادی
  slug: z.string().trim().max(90).optional().or(z.literal("")),
  client: z.string().trim().max(120).optional().or(z.literal("")),
  projectType: z.string().trim().max(60).optional().or(z.literal("")),
  projectDate: z.string().trim().max(60).optional().or(z.literal("")),
  servicesUsed: z.string().trim().max(600).optional().or(z.literal("")),
  results: z.string().trim().max(3000).optional().or(z.literal("")),
  gallery: z.string().trim().max(3000).optional().or(z.literal("")),
  isFeatured: z.boolean().optional().default(false),
  // فاز E — سئو
  seoTitle: z.string().trim().max(120).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(200).optional().or(z.literal("")),
  altText: z.string().trim().max(200).optional().or(z.literal("")),
});

function readForm(fd: FormData) {
  return schema.safeParse({
    title: fd.get("title"),
    tag: fd.get("tag") ?? "",
    description: fd.get("description") ?? "",
    coverImage: fd.get("coverImage") ?? "",
    link: fd.get("link") ?? "",
    sortOrder: fd.get("sortOrder") ?? 0,
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
    slug: fd.get("slug") ?? "",
    client: fd.get("client") ?? "",
    projectType: fd.get("projectType") ?? "",
    projectDate: fd.get("projectDate") ?? "",
    servicesUsed: fd.get("servicesUsed") ?? "",
    results: fd.get("results") ?? "",
    gallery: fd.get("gallery") ?? "",
    isFeatured: fd.get("isFeatured") === "on" || fd.get("isFeatured") === "true",
    seoTitle: fd.get("seoTitle") ?? "",
    seoDescription: fd.get("seoDescription") ?? "",
    altText: fd.get("altText") ?? "",
  });
}

export async function createPortfolioAction(
  _prev: PortfolioFormState,
  fd: FormData
): Promise<PortfolioFormState> {
  try {
    await assertAdmin();
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

  const slug = await uniqueCaseSlug(d.slug || slugify(d.title));
  const warnings = await dupMetaWarnings(d.seoTitle || null, d.seoDescription || null);

  const created = await db.portfolioItem.create({
    data: {
      title: d.title,
      tag: d.tag || null,
      description: d.description || null,
      coverImage: d.coverImage,
      link: d.link || null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
      slug,
      client: d.client || null,
      projectType: d.projectType || null,
      projectDate: d.projectDate || null,
      servicesUsed: splitList(d.servicesUsed ?? null),
      results: d.results || null,
      gallery: splitGallery(d.gallery ?? null),
      isFeatured: d.isFeatured,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      altText: d.altText || null,
    },
    select: { id: true },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  if (warnings.length > 0) {
    redirect(`/admin/portfolio/${created.id}/edit?created=1&w=${encodeURIComponent(warnings.join(" | "))}`);
  }
  redirect("/admin/portfolio?created=1");
}

export async function updatePortfolioAction(
  _prev: PortfolioFormState,
  fd: FormData
): Promise<PortfolioFormState> {
  try {
    await assertAdmin();
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

  const slug = await uniqueCaseSlug(d.slug || slugify(d.title), id);
  const warnings = await dupMetaWarnings(d.seoTitle || null, d.seoDescription || null, id);

  await db.portfolioItem.update({
    where: { id },
    data: {
      title: d.title,
      tag: d.tag || null,
      description: d.description || null,
      coverImage: d.coverImage,
      link: d.link || null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
      slug,
      client: d.client || null,
      projectType: d.projectType || null,
      projectDate: d.projectDate || null,
      servicesUsed: splitList(d.servicesUsed ?? null),
      results: d.results || null,
      gallery: splitGallery(d.gallery ?? null),
      isFeatured: d.isFeatured,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      altText: d.altText || null,
    },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${slug}`);
  if (warnings.length > 0) {
    redirect(`/admin/portfolio/${id}/edit?updated=1&w=${encodeURIComponent(warnings.join(" | "))}`);
  }
  redirect("/admin/portfolio?updated=1");
}

export async function deletePortfolioAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  await db.portfolioItem.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
}

export async function togglePortfolioActiveAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  const item = await db.portfolioItem.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!item) return;
  await db.portfolioItem.update({
    where: { id },
    data: { isActive: !item.isActive },
  });
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
}
