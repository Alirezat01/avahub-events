import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateEventAction } from "@/app/admin/events/actions";
import { AdminEventForm } from "@/components/avahub/admin-event-form";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Date → رشته datetime-local به وقت دیوار تهران (h23) */
function toTehranInput(d: Date | null): string {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const ev = await db.event.findUnique({ where: { id } });
  if (!ev) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">ویرایش رویداد</h1>
        <p className="mt-2 text-white/60" dir="ltr">
          /events/{ev.slug}
        </p>
      </div>
      <AdminEventForm
        action={updateEventAction}
        submitLabel="ذخیره تغییرات"
        defaults={{
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          summary: ev.summary,
          description: ev.description,
          coverImage: ev.coverImage,
          startsAt: toTehranInput(ev.startsAt),
          endsAt: toTehranInput(ev.endsAt),
          venueName: ev.venueName,
          venueAddress: ev.venueAddress,
          venueCity: ev.venueCity,
          capacity: ev.capacity,
          waitlistEnabled: ev.waitlistEnabled,
          isFeatured: ev.isFeatured,
          status: ev.status,
          eventType: post.eventType,
          isOnline: post.isOnline,
          metaTitle: ev.metaTitle,
          metaDescription: ev.metaDescription,
          category: post.category,
          isFeatured: post.isFeatured,
          hasSeating: ev.hasSeating,
          cateringNote: ev.cateringNote,
          musicInfo: ev.musicInfo,
          specialNotes: ev.specialNotes,
        }}
      />
    </div>
  );
}
