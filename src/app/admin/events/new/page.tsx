import { createEventAction } from "@/app/admin/events/actions";
import { AdminEventForm } from "@/components/avahub/admin-event-form";

export default async function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">رویداد جدید</h1>
        <p className="mt-2 text-white/60">
          مشخصات رویداد را کامل کنید. تا زمانی که وضعیت «منتشر شده» را انتخاب نکنید، در سایت نمایش داده نمی‌شود.
        </p>
      </div>
      <AdminEventForm action={createEventAction} submitLabel="ساخت رویداد" />
    </div>
  );
}
