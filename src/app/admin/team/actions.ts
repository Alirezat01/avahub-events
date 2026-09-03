"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminRole } from "@prisma/client";
import { db } from "@/lib/db";
import { assertSuperAdmin } from "@/lib/avahub/admin";
import { logActivity } from "@/lib/avahub/activity";

// ─────────────────────────────────────────────────────────────
// فاز K — مدیریت تیم (فقط SUPER_ADMIN)
// افزودن مدیر / تغییر نقش / فعال‌غیرفعال / حذف / تخصیص رویداد
// محافظت‌ها: خودت را تغییر نمی‌دهی؛ آخرین مدیر ارشد حذف نمی‌شود
// ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: AdminRole[] = ["SUPER_ADMIN", "EVENT_MANAGER", "STAFF"];

function back(msg: string): never {
  redirect(`/admin/team?msg=${encodeURIComponent(msg)}`);
}

/** شمار مدیران ارشد فعال به‌جز یک رکورد */
function activeSuperCount(excludeAdminId: string) {
  return db.admin.count({
    where: { role: "SUPER_ADMIN", isActive: true, id: { not: excludeAdminId } },
  });
}

export async function addTeamMemberAction(formData: FormData) {
  const me = await assertSuperAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "EVENT_MANAGER");
  if (!EMAIL_RE.test(email)) back("ایمیل نامعتبر است.");
  const role: AdminRole = ROLES.includes(roleRaw as AdminRole) ? (roleRaw as AdminRole) : "EVENT_MANAGER";

  let profile = await db.profile.findUnique({ where: { email }, select: { id: true } });
  if (!profile) {
    // پروفایل تازه — با اولین ورود گوگل با همین ایمیل، خودکار پیوند می‌خورد
    profile = await db.profile.create({ data: { email }, select: { id: true } });
  }
  const exists = await db.admin.findUnique({ where: { profileId: profile.id }, select: { id: true } });
  if (exists) back("این ایمیل از قبل در فهرست مدیران هست.");

  await db.admin.create({ data: { profileId: profile.id, role } });
  await logActivity({
    adminProfileId: me.profileId,
    adminName: me.fullName ?? me.email,
    action: "TEAM_ADD",
    entity: "admin",
    detail: `${email} — نقش: ${role}`,
  });
  revalidatePath("/admin/team");
  back(`${email} به تیم اضافه شد. برای فعال شدن، یک بار با همین ایمیل در سایت لاگین کند.`);
}

export async function setTeamRoleAction(formData: FormData) {
  const me = await assertSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  if (!ROLES.includes(roleRaw as AdminRole)) back("نقش نامعتبر است.");

  const target = await db.admin.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, profile: { select: { email: true } } },
  });
  if (!target) back("مدیر پیدا نشد.");
  if (target.id === me.adminId) back("رکورد خودتان را از این صفحه تغییر نمی‌دهید.");

  if (target.role === "SUPER_ADMIN" && roleRaw !== "SUPER_ADMIN") {
    const others = await activeSuperCount(adminId);
    if (others === 0) back("آخرین مدیر ارشد را نمی‌توان تنزل داد.");
  }

  await db.admin.update({ where: { id: adminId }, data: { role: roleRaw as AdminRole } });
  await logActivity({
    adminProfileId: me.profileId,
    adminName: me.fullName ?? me.email,
    action: "TEAM_ROLE",
    entity: "admin",
    entityId: adminId,
    detail: `${target.profile.email}: ${target.role} → ${roleRaw}`,
  });
  revalidatePath("/admin/team");
  back("نقش به‌روزرسانی شد.");
}

export async function toggleTeamActiveAction(formData: FormData) {
  const me = await assertSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");
  const target = await db.admin.findUnique({
    where: { id: adminId },
    select: { id: true, isActive: true, role: true, profile: { select: { email: true } } },
  });
  if (!target) back("مدیر پیدا نشد.");
  if (target.id === me.adminId) back("خودتان را غیرفعال نمی‌کنید.");
  if (target.isActive && target.role === "SUPER_ADMIN") {
    const others = await activeSuperCount(adminId);
    if (others === 0) back("آخرین مدیر ارشد فعال را نمی‌توان غیرفعال کرد.");
  }

  await db.admin.update({ where: { id: adminId }, data: { isActive: !target.isActive } });
  await logActivity({
    adminProfileId: me.profileId,
    adminName: me.fullName ?? me.email,
    action: "TEAM_TOGGLE",
    entity: "admin",
    entityId: adminId,
    detail: `${target.profile.email} → ${!target.isActive ? "فعال" : "غیرفعال"}`,
  });
  revalidatePath("/admin/team");
  back(!target.isActive ? "مدیر فعال شد." : "مدیر غیرفعال شد.");
}

export async function removeTeamMemberAction(formData: FormData) {
  const me = await assertSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");
  const target = await db.admin.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, profile: { select: { email: true } } },
  });
  if (!target) back("مدیر پیدا نشد.");
  if (target.id === me.adminId) back("رکورد خودتان را حذف نمی‌کنید.");
  if (target.role === "SUPER_ADMIN") {
    const others = await activeSuperCount(adminId);
    if (others === 0) back("آخرین مدیر ارشد را نمی‌توان حذف کرد.");
  }

  await db.admin.delete({ where: { id: adminId } }); // تخصیص رویدادها هم cascade حذف می‌شود
  await logActivity({
    adminProfileId: me.profileId,
    adminName: me.fullName ?? me.email,
    action: "TEAM_REMOVE",
    entity: "admin",
    entityId: adminId,
    detail: target.profile.email,
  });
  revalidatePath("/admin/team");
  back(`${target.profile.email} از مدیران حذف شد.`);
}

export async function saveTeamEventsAction(formData: FormData) {
  const me = await assertSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");
  const eventIds = formData.getAll("eventIds").map(String).filter(Boolean);

  const target = await db.admin.findUnique({
    where: { id: adminId },
    select: { id: true, profile: { select: { email: true } } },
  });
  if (!target) back("مدیر پیدا نشد.");

  // جلوگیری از تخصیص رویداد جعلی — فقط رویدادهای واقعی
  const valid = await db.event.findMany({ where: { id: { in: eventIds } }, select: { id: true } });

  await db.$transaction([
    db.eventAdmin.deleteMany({ where: { adminId } }),
    db.eventAdmin.createMany({
      data: valid.map((e) => ({ adminId, eventId: e.id })),
      skipDuplicates: true,
    }),
  ]);
  await logActivity({
    adminProfileId: me.profileId,
    adminName: me.fullName ?? me.email,
    action: "TEAM_EVENTS",
    entity: "admin",
    entityId: adminId,
    detail: `${target.profile.email} — ${valid.length} رویداد`,
  });
  revalidatePath("/admin/team");
  back("رویدادهای تخصیص‌یافته ذخیره شد.");
}
