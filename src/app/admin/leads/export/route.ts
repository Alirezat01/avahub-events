import { requireAdmin } from "@/lib/avahub/admin";
import { leadRows, leadsToCsv } from "@/lib/avahub/leads";

// ─────────────────────────────────────────────────────────────
// فاز G — خروجی CSV سرنخ‌ها (با فیلتر اختیاری)
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const rows = await leadRows({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  const csv = leadsToCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="avahub-leads-${date}.csv"`,
    },
  });
}
