import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// ابزار موقت تشخیص اتصال دیتابیس روی Vercel
// بعد از حل مشکل باید حذف شود!
// استفاده: /api/db-check?key=avahub-dbcheck-2026
// هیچ رمزی نشان نمی‌دهد — فقط ساختار (host/port/انکود بودن پسورد)
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type UrlInfo = Record<string, unknown>;

function analyzeUrl(raw: string | undefined): UrlInfo {
  if (!raw) return { present: false };
  const trimmed = raw.trim();
  const info: UrlInfo = {
    present: true,
    length: trimmed.length,
    schemeOk: trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://"),
    wrappedInQuotes: trimmed.startsWith('"') || trimmed.endsWith('"'),
    hasPgbouncerParam: trimmed.includes("pgbouncer=true"),
  };
  try {
    const u = new URL(trimmed);
    info.hostname = u.hostname;
    info.port = u.port || "(default)";
    info.database = u.pathname;
    const pw = u.password;
    info.usernameOk = u.username.startsWith("postgres.rhdwfcuusxekprjbravg");
    info.passwordPresent = pw.length > 0;
    info.passwordHasRawAt = pw.includes("@"); // @ واقعی در پسورد = انکود نشده → مشکل
    info.passwordPercentEncoded = pw.includes("%40"); // %40 = انکود صحیح
  } catch (err) {
    info.parseError = (err as Error).message.slice(0, 200);
  }
  return info;
}

function sanitize(input: string): string {
  return input
    .replace(/postgres(ql)?:\/\/[^\s"']+/g, "[CONNECTION-STRING-REDACTED]")
    .replace(/(password|secret)=[^&\s"']+/gi, "$1=[REDACTED]");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const expected = process.env.DB_CHECK_KEY ?? "avahub-dbcheck-2026";
  if (key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report: Record<string, unknown> = {
    time: new Date().toISOString(),
    node: process.version,
    region: process.env.VERCEL_REGION ?? "(local)",
    env: {
      DATABASE_URL: analyzeUrl(process.env.DATABASE_URL),
      DIRECT_URL: analyzeUrl(process.env.DIRECT_URL),
    },
  };

  let prisma: PrismaClient;
  try {
    prisma = new PrismaClient({ log: ["error"] });
  } catch (err) {
    const e = err as Error;
    report.initError = { name: e.name, message: sanitize(e.message).slice(0, 500) };
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    report.ping = "OK";
    const rows = await prisma.$queryRaw<{ published: bigint; upcoming: bigint }[]>`
      SELECT
        count(*) FILTER (WHERE "status" = 'PUBLISHED') AS published,
        count(*) FILTER (WHERE "status" = 'PUBLISHED' AND "startsAt" >= now()) AS upcoming
      FROM "events"`;
    const r = rows[0];
    report.events = { published: Number(r.published), upcoming: Number(r.upcoming) };
  } catch (err) {
    const e = err as Error;
    report.dbError = { name: e.name, message: sanitize(e.message).slice(0, 500) };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
