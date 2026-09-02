"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// Server Actions نمونه‌کارها — فاز ۶ (فقط ادمین)
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PortfolioFormState = { error?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  title: z.string().trim().min(2, "عنوان حداقل ۲ نویسه").max(120),
  tag: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
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

  await db.portfolioItem.create({
    data: {
      title: d.title,
      tag: d.tag || null,
      description: d.description || null,
      coverImage: d.coverImage,
      link: d.link || null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
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
    },
  });

  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
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
