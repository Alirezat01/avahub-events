"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/avahub/admin";
import { logActivity } from "@/lib/avahub/activity";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normFrom(raw: string): string {
  const p = raw.trim();
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function normTo(raw: string): string {
  return raw.trim();
}

/** ساخت ریدایرکت جدید */
export async function createRedirectAction(fd: FormData): Promise<void> {
  const session = await assertAdmin();
  const fromPath = normFrom(String(fd.get("fromPath") ?? ""));
  const toPath = normTo(String(fd.get("toPath") ?? ""));
  const statusCode = String(fd.get("statusCode") ?? "301") === "302" ? 302 : 301;

  if (!fromPath || fromPath === "/" || !toPath) {
    redirectBack("مسیر مبدأ و مقصد را درست وارد کنید.");
    return;
  }
  if (!toPath.startsWith("/") && !/^https?:\/\//i.test(toPath)) {
    redirectBack("مقصد باید مسیر داخلی (/events) یا لینک کامل https:// باشد.");
    return;
  }

  const exists = await db.redirect.findUnique({ where: { fromPath }, select: { id: true } });
  if (exists) {
    redirectBack("برای این مسیر قبلاً ریدایرکت ثبت شده است.");
    return;
  }

  const created = await db.redirect.create({
    data: { fromPath, toPath, statusCode },
    select: { id: true },
  });

  await logActivity({
    adminProfileId: session.profileId,
    adminName: session.fullName ?? session.email,
    action: "REDIRECT_SAVE",
    entity: "redirect",
    entityId: created.id,
    detail: `${fromPath} → ${toPath} (${statusCode})`,
  });

  revalidatePath("/admin/redirects");
  redirectBack();
}

/** تغییر وضعیت فعال/غیرفعال یا مقصد */
export async function updateRedirectAction(fd: FormData): Promise<void> {
  const session = await assertAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  const toPath = normTo(String(fd.get("toPath") ?? ""));
  const statusCode = String(fd.get("statusCode") ?? "301") === "302" ? 302 : 301;
  const isActive = String(fd.get("isActive") ?? "") === "on";

  await db.redirect
    .update({
      where: { id },
      data: { ...(toPath ? { toPath } : {}), statusCode, isActive },
    })
    .catch(() => null);

  await logActivity({
    adminProfileId: session.profileId,
    adminName: session.fullName ?? session.email,
    action: "REDIRECT_SAVE",
    entity: "redirect",
    entityId: id,
    detail: `به‌روزرسانی → ${toPath} (${statusCode}) ${isActive ? "فعال" : "غیرفعال"}`,
  });

  revalidatePath("/admin/redirects");
  redirectBack();
}

export async function deleteRedirectAction(fd: FormData): Promise<void> {
  const session = await assertAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  await db.redirect.delete({ where: { id } }).catch(() => null);

  await logActivity({
    adminProfileId: session.profileId,
    adminName: session.fullName ?? session.email,
    action: "REDIRECT_DELETE",
    entity: "redirect",
    entityId: id,
  });

  revalidatePath("/admin/redirects");
  redirectBack();
}

/** پیام ساده با query param — بدون state */
function redirectBack(msg?: string): void {
  redirect(`/admin/redirects${msg ? `?err=${encodeURIComponent(msg)}` : "?ok=1"}`);
}
