import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { listMediaObjects } from "@/lib/avahub/media";
import { updateJournalAction } from "../../actions";
import { AdminJournalForm } from "@/components/avahub/admin-journal-form";

export const dynamic = "force-dynamic";

export default async function EditJournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  await requireAdmin("/admin/journal");
  const { id } = await params;
  const sp = await searchParams;
  const post = await db.journalPost.findUnique({ where: { id } });
  if (!post) notFound();
  const media = await listMediaObjects();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/journal" className="text-xs text-white/50 transition hover:text-white">
          ← بازگشت به مجله
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">ویرایش مقاله</h1>
      </div>

      {sp.created && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          مقاله ذخیره شد. با دکمهٔ «انتشار» در فهرست مجله (یا تغییر وضعیت همین فرم) عمومی می‌شود.
        </div>
      )}
      {sp.updated && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          تغییرات ذخیره شد.
        </div>
      )}

      <AdminJournalForm
        action={updateJournalAction}
        defaults={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          icon: post.icon,
          tags: post.tags,
          authorName: post.authorName,
          status: post.status,
          publishedAt: post.publishedAt
            ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(post.publishedAt)
            : "",
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          category: post.category,
          isFeatured: post.isFeatured,
        }}
        mediaUrls={(media ?? []).map((m) => m.url)}
        submitLabel="ذخیرهٔ تغییرات"
      />
    </div>
  );
}
