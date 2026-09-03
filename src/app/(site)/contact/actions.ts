"use server";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/avahub/activity";

// ─────────────────────────────────────────────────────────────
// فاز G — ثبت سرنخ از فرم تماس
// best-effort: اگر دیتابیس در دسترس نبود، واتساپ همچنان کار می‌کند
// ─────────────────────────────────────────────────────────────

export type LeadInput = {
  name: string;
  phone: string;
  topic: string;
  message: string;
};

export async function submitLead(input: LeadInput): Promise<{ ok: boolean }> {
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const message = input.message?.trim() ?? "";
  const topic = input.topic?.trim() || "مشاوره رایگان";

  // اعتبارسنجی سمت سرور — هم‌سنگ با سمت کلاینت
  if (name.length < 2 || phone.length < 8 || message.length < 5) return { ok: false };

  try {
    const lead = await db.lead.create({
      data: { name, phone, topic, message, source: "contact" },
      select: { id: true },
    });
    await logActivity({
      action: "LEAD_NEW",
      entity: "lead",
      entityId: lead.id,
      detail: `${name} — ${topic}`,
    });
    return { ok: true };
  } catch {
    // دیتابیس در دسترس نیست — فرم نباید بشکند (واتساپ جایگزین است)
    return { ok: false };
  }
}
