import Link from "next/link";
import { requireAdmin } from "@/lib/avahub/admin";
import { listMediaObjects } from "@/lib/avahub/media";
import { createPortfolioAction } from "../actions";
import { AdminPortfolioForm } from "@/components/avahub/admin-portfolio-form";

export const dynamic = "force-dynamic";

export default async function NewPortfolioPage() {
  await requireAdmin("/admin/portfolio/new");
  const media = await listMediaObjects();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/portfolio" className="text-xs text-white/50 transition hover:text-white">
          ← بازگشت به نمونه‌کارها
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">نمونه‌کار جدید</h1>
      </div>
      <AdminPortfolioForm
        action={createPortfolioAction}
        mediaUrls={(media ?? []).map((m) => m.url)}
        submitLabel="ثبت نمونه‌کار"
      />
    </div>
  );
}
