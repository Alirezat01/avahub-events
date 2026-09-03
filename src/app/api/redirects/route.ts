import { db } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// فاز G — نقشهٔ ریدایرکت‌ها برای middleware
// خروجی سبک JSON؛ middleware آن را ۶۰ ثانیه کش می‌کند
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.redirect.findMany({
      where: { isActive: true },
      select: { fromPath: true, toPath: true, statusCode: true },
    });
    const map: Record<string, { to: string; status: number }> = {};
    for (const r of rows) {
      map[r.fromPath] = { to: r.toPath, status: r.statusCode === 302 ? 302 : 301 };
    }
    return Response.json(map, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({}, { headers: { "Cache-Control": "no-store" } });
  }
}
