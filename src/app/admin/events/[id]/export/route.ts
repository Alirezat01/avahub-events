import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assertAdmin, canAccessEvent } from "@/lib/avahub/admin";
import { registrationLabel } from "@/lib/avahub/admin-data";

// ─────────────────────────────────────────────────────────────
// خروجی CSV شماره‌ها — فاز ۵ ⭐
// GET /admin/events/<id>/export?status=CONFIRMED|WAITLIST|CANCELLED|ALL
// - UTF-8 با BOM تا فارسی در اکسل درست دیده شود
// - CRLF + RFC4180 (کوتیشن امن)
// - WAITLIST از جدول waitlists خوانده می‌شود
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HEADERS = [
  "ردیف",
  "نام",
  "موبایل",
  "ایمیل",
  "شهر",
  "وضعیت",
  "زمان ثبت‌نام",
  "نسخه توافق‌نامه",
  "زمان پذیرش توافق‌نامه",
  "منبع (UTM)",
];

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function faDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(d);
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ۱) گارد ادمین + دسترسی رویدادی (فاز K)
  try {
    const session = await assertAdmin();
    if (!(await canAccessEvent(session, (await ctx.params).id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "رویداد یافت نشد" }, { status: 404 });

  // ۲) فیلتر وضعیت
  const status = (request.nextUrl.searchParams.get("status") ?? "ALL").toUpperCase();
  const valid = ["ALL", "CONFIRMED", "PENDING", "CANCELLED", "WAITLIST"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "فیلتر وضعیت نامعتبر" }, { status: 400 });
  }

  // ۳) ردیف‌های داده
  type Row = (string | null)[];

  if (status === "WAITLIST") {
    const wl = await db.waitlist.findMany({
      where: { eventId: id, status: "ACTIVE" },
      orderBy: { position: "asc" },
      select: {
        position: true,
        createdAt: true,
        profile: { select: { fullName: true, email: true, phone: true, city: true } },
      },
    });
    const rows: Row[] = wl.map((w, i) => [
      String(i + 1),
      w.profile.fullName ?? "",
      w.profile.phone ?? "",
      w.profile.email,
      w.profile.city ?? "",
      "لیست انتظار",
      faDate(w.createdAt),
      "",
      "",
      "",
    ]);
    return csvResponse(rows, event.slug, "waitlist", HEADERS);
  }

  const where =
    status === "ALL"
      ? { eventId: id }
      : status === "CANCELLED"
        ? { eventId: id, status: "CANCELLED" as const }
        : { eventId: id, status: status as "CONFIRMED" | "PENDING" };

  const regs = await db.registration.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: {
      status: true,
      cancelledBy: true,
      createdAt: true,
      consentVersion: true,
      consentAcceptedAt: true,
      utmSource: true,
      profile: { select: { fullName: true, email: true, phone: true, city: true } },
    },
  });

  const rows: Row[] = regs.map((r, i) => [
    String(i + 1),
    r.profile.fullName ?? "",
    r.profile.phone ?? "",
    r.profile.email,
    r.profile.city ?? "",
    registrationLabel(r.status, r.cancelledBy),
    faDate(r.createdAt),
    r.consentVersion ?? "",
    faDate(r.consentAcceptedAt),
    r.utmSource ?? "direct",
  ]);

  return csvResponse(rows, event.slug, status.toLowerCase(), HEADERS);
}

function csvResponse(rows: (string | null)[][], slug: string, tag: string, headers: string[]) {
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  // BOM برای نمایش صحیح فارسی در Excel
  const body = "\uFEFF" + lines.join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="avahub-${slug}-${tag}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
