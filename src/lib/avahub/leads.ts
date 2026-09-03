import { db } from "@/lib/db";
import { LeadStatus, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// فاز G — سرنخ‌های فروش (CRM سبک)
// فرم تماس و واتساپ → جدول leads → پیگیری در پنل ادمین
// ─────────────────────────────────────────────────────────────

export const LEAD_STATUS_FA: Record<LeadStatus, string> = {
  NEW: "تازه",
  CONTACTED: "تماس شد",
  QUALIFIED: "جدی",
  WON: "تبدیل شد",
  LOST: "منصرف",
};

export const LEAD_STATUS_CLASS: Record<LeadStatus, string> = {
  NEW: "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/30",
  CONTACTED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  QUALIFIED: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  WON: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  LOST: "bg-white/5 text-white/50 border-white/10",
};

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  topic: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  adminNote: string | null;
  createdAt: Date;
};

/** همه سرنخ‌ها با فیلتر وضعیت و جستجو — جدیدترین اول */
export async function leadRows(opts: { status?: string; q?: string } = {}): Promise<LeadRow[]> {
  const where: Prisma.LeadWhereInput = {};
  if (opts.status && opts.status in LEAD_STATUS_FA) where.status = opts.status as LeadStatus;
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }];
  }
  const rows = await db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
  return rows;
}

/** شمارش سرنخ‌های تازه (برای اعلان داشبورد) */
export async function newLeadsCount(): Promise<number> {
  return db.lead.count({ where: { status: "NEW" } });
}

/** خروجی CSV برای اکسل — با BOM برای نمایش درست فارسی */
export function leadsToCsv(rows: LeadRow[]): string {
  const esc = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["نام", "تلفن", "موضوع", "پیام", "منبع", "وضعیت", "یادداشت ادمین", "تاریخ"].map(esc).join(",");
  const body = rows
    .map((r) =>
      [
        esc(r.name),
        esc(r.phone),
        esc(r.topic),
        esc(r.message.replace(/\n/g, " ")),
        esc(r.source),
        esc(LEAD_STATUS_FA[r.status]),
        esc(r.adminNote),
        esc(r.createdAt.toISOString()),
      ].join(","),
    )
    .join("\n");
  return "\uFEFF" + head + "\n" + body;
}
