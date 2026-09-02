import Link from "next/link";
import { requireAdmin } from "@/lib/avahub/admin";
import { listMediaObjects } from "@/lib/avahub/media";
import { createJournalAction } from "../actions";
import { AdminJournalForm } from "@/components/avahub/admin-journal-form";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  await requireAdmin("/admin/journal/new");
  const media = await listMediaObjects();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/journal" className="text-xs text-white/50 transition hover:text-white">
          ← بازگشت به مجله
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">مقالهٔ جدید</h1>
      </div>
      <AdminJournalForm
        action={createJournalAction}
        mediaUrls={(media ?? []).map((m) => m.url)}
        submitLabel="ذخیرهٔ مقاله"
      />
    </div>
  );
}
