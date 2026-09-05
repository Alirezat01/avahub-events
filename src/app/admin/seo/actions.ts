"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertSuperAdmin } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// فاز M — کنترل کیفیت متا به‌صورت خودکار
// پرکردن متاتایتل/متادیسکریپشنِ خالی از روی عنوان و خلاصهٔ محتوا
// ─────────────────────────────────────────────────────────────

/** تیتر متا استاندارد: حداکثر ۶۰ نویسه */
function genTitle(title: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

/** توضیح متا استاندارد: تا ۱۵۸ نویسه از خلاصه یا ابتدای متن */
function genDescription(summary: string | null, body: string | null): string | null {
  const base = (summary?.trim() || body?.replace(/\s+/g, " ").trim() || "").trim();
  if (!base) return null;
  if (base.length <= 158) return base;
  return `${base.slice(0, 155)}…`;
}

export async function autoFillMetaAction(): Promise<void> {
  await assertSuperAdmin();

  let fixed = 0;

  // رویدادهای منتشرشده
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, summary: true, description: true, metaTitle: true, metaDescription: true },
  });
  for (const ev of events) {
    const patch: { metaTitle?: string; metaDescription?: string } = {};
    if (!ev.metaTitle?.trim()) patch.metaTitle = genTitle(ev.title);
    if (!ev.metaDescription?.trim()) {
      const d = genDescription(ev.summary, ev.description);
      if (d) patch.metaDescription = d;
    }
    if (Object.keys(patch).length > 0) {
      await db.event.update({ where: { id: ev.id }, data: patch });
      fixed++;
    }
  }

  // نمونه‌کارهای فعال
  const cases = await db.portfolioItem.findMany({
    where: { isActive: true },
    select: { id: true, title: true, tag: true, description: true, seoTitle: true, seoDescription: true },
  });
  for (const c of cases) {
    const patch: { seoTitle?: string; seoDescription?: string } = {};
    if (!c.seoTitle?.trim()) patch.seoTitle = genTitle(c.tag ? `${c.title} | ${c.tag}` : c.title);
    if (!c.seoDescription?.trim()) {
      const d = genDescription(null, c.description);
      if (d) patch.seoDescription = d;
    }
    if (Object.keys(patch).length > 0) {
      await db.portfolioItem.update({ where: { id: c.id }, data: patch });
      fixed++;
    }
  }

  // مقالات منتشرشدهٔ مجله
  const posts = await db.journalPost.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, excerpt: true, content: true, metaTitle: true, metaDescription: true },
  });
  for (const p of posts) {
    const patch: { metaTitle?: string; metaDescription?: string } = {};
    if (!p.metaTitle?.trim()) patch.metaTitle = genTitle(p.title);
    if (!p.metaDescription?.trim()) {
      const d = genDescription(p.excerpt, p.content);
      if (d) patch.metaDescription = d;
    }
    if (Object.keys(patch).length > 0) {
      await db.journalPost.update({ where: { id: p.id }, data: patch });
      fixed++;
    }
  }

  revalidatePath("/admin/seo");
  redirect(`/admin/seo?ok=${fixed}`);
}
