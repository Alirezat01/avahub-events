import { requireSuperAdmin } from "@/lib/avahub/admin";
import { db } from "@/lib/db";
import { fmtFa } from "@/lib/avahub/admin-data";
import {
  addTeamMemberAction,
  removeTeamMemberAction,
  saveTeamEventsAction,
  setTeamRoleAction,
  toggleTeamActiveAction,
} from "./actions";
import { ConfirmSubmit } from "@/components/avahub/confirm-submit";

// ─────────────────────────────────────────────────────────────
// فاز K — مدیریت تیم (فقط SUPER_ADMIN)
// افزودن مدیر با ایمیل + نقش + تخصیص رویدادهای مجاز
// مدیر رویداد فقط آمار/جزئیات رویدادهای تخصیص‌یافته را می‌بیند
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const ROLE_FA: Record<string, string> = {
  SUPER_ADMIN: "مدیر ارشد",
  EVENT_MANAGER: "مدیر رویداد",
  STAFF: "کارمند",
};

const ROLE_CLASS: Record<string, string> = {
  SUPER_ADMIN: "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]",
  EVENT_MANAGER: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  STAFF: "border-white/15 bg-white/5 text-white/70",
};

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const session = await requireSuperAdmin("/admin/team");
  const { msg } = await searchParams;

  const [team, events] = await Promise.all([
    db.admin.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { email: true, fullName: true } },
        eventAdmins: {
          include: { event: { select: { id: true, title: true, startsAt: true } } },
        },
      },
    }),
    db.event.findMany({
      orderBy: { startsAt: "desc" },
      select: { id: true, title: true, startsAt: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">مدیران و دسترسی‌ها</h1>
        <p className="mt-2 text-white/60">
          مدیر ارشد همه‌چیز را می‌بیند؛ «مدیر رویداد» فقط آمار و جزئیات رویدادهای تخصیص‌یافته.
          ادمین جدید باید یک بار با همان ایمیل در سایت لاگین کند تا دسترسی‌اش فعال شود.
        </p>
      </div>

      {msg && (
        <p className="rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#d4af37]">
          {msg}
        </p>
      )}

      {/* افزودن مدیر */}
      <form
        action={addTeamMemberAction}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-xs text-white/60">ایمیل مدیر جدید (گوگل)</label>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            placeholder="example@gmail.com"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#d4af37]/60"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/60">نقش</label>
          <select
            name="role"
            defaultValue="EVENT_MANAGER"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#d4af37]/60"
          >
            <option value="EVENT_MANAGER">مدیر رویداد (فقط رویدادهای تخصیصی)</option>
            <option value="STAFF">کارمند (همان سطح، محدودتر)</option>
            <option value="SUPER_ADMIN">مدیر ارشد (دسترسی کامل)</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-bold text-[#0a0a0f] hover:brightness-110 transition"
        >
          + افزودن
        </button>
      </form>

      {/* فهرست مدیران */}
      <div className="space-y-4">
        {team.map((a) => {
          const isSelf = a.id === session.adminId;
          const assigned = new Set(a.eventAdmins.map((ea) => ea.event.id));
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {a.profile.fullName ?? "—"}
                    {isSelf && <span className="mr-2 text-xs text-[#d4af37]">(شما)</span>}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/50" dir="ltr">
                    {a.profile.email}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${ROLE_CLASS[a.role]}`}>
                  {ROLE_FA[a.role]}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    a.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {a.isActive ? "فعال" : "غیرفعال"}
                </span>
                <span className="text-xs text-white/40">از {fmtFa(a.createdAt)}</span>
              </div>

              {/* تخصیص رویدادها */}
              {a.role !== "SUPER_ADMIN" && (
                <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <summary className="cursor-pointer text-sm text-white/80">
                    رویدادهای مجاز این مدیر
                    <span className="mr-2 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/60">
                      {a.eventAdmins.length} رویداد
                    </span>
                  </summary>
                  <form action={saveTeamEventsAction} className="mt-4 space-y-3">
                    <input type="hidden" name="adminId" value={a.id} />
                    <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                      {events.length === 0 && (
                        <p className="text-xs text-white/40">هنوز رویدادی ثبت نشده است.</p>
                      )}
                      {events.map((e) => (
                        <label
                          key={e.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            name="eventIds"
                            value={e.id}
                            defaultChecked={assigned.has(e.id)}
                            className="accent-[#d4af37]"
                          />
                          <span className="line-clamp-1">{e.title}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold text-[#d4af37] hover:bg-[#d4af37]/20 transition"
                    >
                      ذخیرهٔ تخصیص‌ها
                    </button>
                  </form>
                </details>
              )}

              {a.role === "SUPER_ADMIN" && !isSelf && (
                <p className="text-xs text-white/40">
                  مدیر ارشد به همهٔ رویدادها دسترسی دارد — نیازی به تخصیص نیست.
                </p>
              )}

              {/* کنترل‌ها — برای خودت غیرفعال */}
              {!isSelf ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <form action={setTeamRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="adminId" value={a.id} />
                    <select
                      name="role"
                      defaultValue={a.role}
                      className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs outline-none focus:border-[#d4af37]/60"
                    >
                      <option value="EVENT_MANAGER">مدیر رویداد</option>
                      <option value="STAFF">کارمند</option>
                      <option value="SUPER_ADMIN">مدیر ارشد</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                    >
                      تغییر نقش
                    </button>
                  </form>
                  <form action={toggleTeamActiveAction}>
                    <input type="hidden" name="adminId" value={a.id} />
                    <ConfirmSubmit
                      message={
                        a.isActive
                          ? `دسترسی ${a.profile.email} غیرفعال شود؟`
                          : `${a.profile.email} دوباره فعال شود؟`
                      }
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5 transition"
                    >
                      {a.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                    </ConfirmSubmit>
                  </form>
                  <form action={removeTeamMemberAction} className="ms-auto">
                    <input type="hidden" name="adminId" value={a.id} />
                    <ConfirmSubmit
                      message={`حذف کامل ${a.profile.email} از مدیران؟ این عمل بازگشت ندارد.`}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      حذف
                    </ConfirmSubmit>
                  </form>
                </div>
              ) : (
                <p className="border-t border-white/10 pt-4 text-xs text-white/40">
                  رکورد خودتان است — برای امنیت از این صفحه قابل تغییر نیست.
                </p>
              )}
            </div>
          );
        })}

        {team.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-[#12121a] p-8 text-center text-sm text-white/50">
            هنوز مدیری ثبت نشده — از فرم بالا اولین مدیر را اضافه کنید.
          </p>
        )}
      </div>
    </div>
  );
}
