"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/avahub/admin";
import type { EventStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Server Actions رویدادها — فاز ۵ (فقط SUPER_ADMIN)
// نکته زمان: ورودی فرم datetime-local به وقت تهران (+03:30) تفسیر می‌شود
// (ایران از ۱۴۰۱ ساعت تابستانی ندارد — آفست ثابت درست است)
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EventFormState = { error?: string; fieldErrors?: Record<string, string> };

const eventSchema = z.object({
  title: z.string().trim().min(3, "عنوان باید حداقل ۳ نویسه باشد").max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "اسلاگ فقط حروف انگلیسی کوچک، رقم و خط تیره")
    .max(80)
    .optional()
    .or(z.literal("")),
  summary: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  coverImage: z.string().trim().max(300).optional().or(z.literal("")),
  startsAt: z.string().min(1, "زمان شروع الزامی است"),
  endsAt: z.string().optional().or(z.literal("")),
  venueName: z.string().trim().max(150).optional().or(z.literal("")),
  venueAddress: z.string().trim().max(300).optional().or(z.literal("")),
  venueCity: z.string().trim().max(60).optional().or(z.literal("")),
  capacity: z.coerce.number().int("ظرفیت باید عدد صحیح باشد").min(0).max(100000),
  waitlistEnabled: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]),
  metaTitle: z.string().trim().max(120).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(200).optional().or(z.literal("")),
  // نکات خاص رویداد — همان که کاربر موقع ثبت‌نام می‌بیند
  hasSeating: z.boolean().optional().default(false),
  cateringNote: z.string().trim().max(300).optional().or(z.literal("")),
  musicInfo: z.string().trim().max(300).optional().or(z.literal("")),
  specialNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** datetime-local (وقت تهران) → Date مطلق */
function parseTehran(value: string | undefined | null): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const hasTz = /(?:z|[+-]\d{2}:?\d{2})$/i.test(v);
  const d = new Date(hasTz ? v : `${v}+03:30`);
  return isNaN(d.getTime()) ? null : d;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  return base || `event-${Date.now().toString(36)}`;
}

async function uniqueSlug(preferred: string, excludeId?: string): Promise<string> {
  let candidate = preferred;
  let n = 2;
  for (;;) {
    const exists = await db.event.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = `${preferred}-${n++}`;
  }
}

function readForm(fd: FormData) {
  const bool = (k: string) => fd.get(k) === "on" || fd.get(k) === "true";
  return eventSchema.safeParse({
    title: fd.get("title"),
    slug: fd.get("slug") ?? "",
    summary: fd.get("summary") ?? "",
    description: fd.get("description") ?? "",
    coverImage: fd.get("coverImage") ?? "",
    startsAt: fd.get("startsAt"),
    endsAt: fd.get("endsAt") ?? "",
    venueName: fd.get("venueName") ?? "",
    venueAddress: fd.get("venueAddress") ?? "",
    venueCity: fd.get("venueCity") ?? "",
    capacity: fd.get("capacity"),
    waitlistEnabled: bool("waitlistEnabled"),
    isFeatured: bool("isFeatured"),
    status: fd.get("status") ?? "DRAFT",
    metaTitle: fd.get("metaTitle") ?? "",
    metaDescription: fd.get("metaDescription") ?? "",
    hasSeating: bool("hasSeating"),
    cateringNote: fd.get("cateringNote") ?? "",
    musicInfo: fd.get("musicInfo") ?? "",
    specialNotes: fd.get("specialNotes") ?? "",
  });
}

export async function createEventAction(
  _prev: EventFormState,
  fd: FormData
): Promise<EventFormState> {
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
  const startsAt = parseTehran(d.startsAt);
  if (!startsAt) return { error: "زمان شروع نامعتبر است" };
  const endsAt = parseTehran(d.endsAt);
  if (d.endsAt && !endsAt) return { error: "زمان پایان نامعتبر است" };
  if (endsAt && endsAt <= startsAt) return { error: "پایان باید بعد از شروع باشد" };

  const slug = await uniqueSlug(d.slug ? d.slug : slugify(d.title));

  const ev = await db.event.create({
    data: {
      title: d.title,
      slug,
      summary: d.summary || null,
      description: d.description || null,
      coverImage: d.coverImage || null,
      startsAt,
      endsAt,
      venueName: d.venueName || null,
      venueAddress: d.venueAddress || null,
      venueCity: d.venueCity || "تهران",
      capacity: d.capacity,
      waitlistEnabled: d.waitlistEnabled,
      isFeatured: d.isFeatured,
      status: d.status as EventStatus,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      hasSeating: d.hasSeating,
      cateringNote: d.cateringNote || null,
      musicInfo: d.musicInfo || null,
      specialNotes: d.specialNotes || null,
    },
    select: { id: true },
  });

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/admin/events/${ev.id}?created=1`);
}

export async function updateEventAction(
  _prev: EventFormState,
  fd: FormData
): Promise<EventFormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "شناسه رویداد نامعتبر است" };

  const parsed = readForm(fd);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const iss of parsed.error.issues) fe[iss.path.join(".")] = iss.message;
    return { error: "خطای اعتبارسنجی — فیلدها را بررسی کنید", fieldErrors: fe };
  }
  const d = parsed.data;
  const startsAt = parseTehran(d.startsAt);
  if (!startsAt) return { error: "زمان شروع نامعتبر است" };
  const endsAt = parseTehran(d.endsAt);
  if (d.endsAt && !endsAt) return { error: "زمان پایان نامعتبر است" };
  if (endsAt && endsAt <= startsAt) return { error: "پایان باید بعد از شروع باشد" };

  const slug = await uniqueSlug(d.slug ? d.slug : slugify(d.title), id);

  await db.event.update({
    where: { id },
    data: {
      title: d.title,
      slug,
      summary: d.summary || null,
      description: d.description || null,
      coverImage: d.coverImage || null,
      startsAt,
      endsAt,
      venueName: d.venueName || null,
      venueAddress: d.venueAddress || null,
      venueCity: d.venueCity || "تهران",
      capacity: d.capacity,
      waitlistEnabled: d.waitlistEnabled,
      isFeatured: d.isFeatured,
      status: d.status as EventStatus,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      hasSeating: d.hasSeating,
      cateringNote: d.cateringNote || null,
      musicInfo: d.musicInfo || null,
      specialNotes: d.specialNotes || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  redirect(`/admin/events/${id}?updated=1`);
}

export async function setEventStatusAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!UUID_RE.test(id)) return;
  const allowed: EventStatus[] = ["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"];
  if (!allowed.includes(status as EventStatus)) return;

  await db.event.update({ where: { id }, data: { status: status as EventStatus } });
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/");
}
