import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { assertAdmin, canAccessEvent } from "@/lib/avahub/admin";

// ─────────────────────────────────────────────────────────────
// کد QR ثبت‌نام رویداد — فاز ۵ب (قول فراموش‌شده!)
// GET /admin/events/<id>/qr        → نمایش داخل صفحهٔ ادمین (inline)
// GET /admin/events/<id>/qr?dl=1   → دانلود PNG باکیفیت چاپ
//
// محتوای QR: آدرس مطلق صفحهٔ ثبت‌نام + UTM
//   ?utm_source=qr&utm_medium=poster
// ⇒ هر ثبت‌نامی که از اسکن QR بیاید در جدول ثبت‌نامی‌ها و
//   خروجی CSV با منبع «qr» ثبت می‌شود (ردیابی کمپین).
//
// کیفیت چاپ: ۱۲۰۰px + سطح تصحیح خطای H (مقاوم در چاپ/اسکن)
// دامنه‌پذیر: از x-forwarded-host می‌خواند ⇒ روی vercel.app الان و
// avahubevents.com بعد از اتصال دامنه، هر دو درست کار می‌کند.
// ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // ۲) مبدأ سایت از هدر درخواست (همان الگوی pass.ts)
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "avahub-events.vercel.app";
  const isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(host);
  const proto = request.headers.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  const origin = `${proto}://${host}`;

  // ۳) مقصد QR — صفحهٔ عمومی ثبت‌نام با برچسب منبع QR
  const target = `${origin}/events/${event.slug}?utm_source=qr&utm_medium=poster`;

  // ۴) PNG باکیفیت چاپ
  const png = await QRCode.toBuffer(target, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 3,
    width: 1200,
    color: { dark: "#0a0a0f", light: "#ffffff" },
  });

  const download = request.nextUrl.searchParams.get("dl") === "1";

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": download
        ? `attachment; filename="avahub-qr-${event.slug}.png"`
        : "inline",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
