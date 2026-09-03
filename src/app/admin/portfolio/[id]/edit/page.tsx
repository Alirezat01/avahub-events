import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { listMediaObjects } from "@/lib/avahub/media";
import { updatePortfolioAction } from "../../actions";
import { AdminPortfolioForm } from "@/components/avahub/admin-portfolio-form";

export const dynamic = "force-dynamic";

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/portfolio");
  const { id } = await params;
  const item = await db.portfolioItem.findUnique({ where: { id } });
  if (!item) notFound();
  const media = await listMediaObjects();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/portfolio" className="text-xs text-white/50 transition hover:text-white">
          ← بازگشت به نمونه‌کارها
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">ویرایش نمونه‌کار</h1>
      </div>
      <AdminPortfolioForm
        action={updatePortfolioAction}
        defaults={{
          id: item.id,
          title: item.title,
          tag: item.tag,
          description: item.description,
          coverImage: item.coverImage,
          link: item.link,
          sortOrder: item.sortOrder,
          slug: item.slug,
          client: item.client,
          projectType: item.projectType,
          projectDate: item.projectDate,
          servicesUsed: item.servicesUsed,
          results: item.results,
          gallery: item.gallery,
          isFeatured: item.isFeatured,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          altText: item.altText,
          isActive: item.isActive,
        }}
        mediaUrls={(media ?? []).map((m) => m.url)}
        submitLabel="ذخیرهٔ تغییرات"
      />
    </div>
  );
}
