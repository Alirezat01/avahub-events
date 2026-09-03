import Link from "next/link";
import { requireAdmin } from "@/lib/avahub/admin";
import { leadRows, LEAD_STATUS_FA, LEAD_STATUS_CLASS } from "@/lib/avahub/leads";
import { updateLeadAction, deleteLeadAction } from "./actions";
import { formatJalaliDate } from "@/lib/avahub/jalali";
import { LeadStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// فاز G — مدیریت سرنخ‌ها (CRM سبک)
// فهرست + فیلتر وضعیت + جستجو + تغییر وضعیت + یادداشت داخلی + CSV
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "همه" },
  ...(Object.keys(LEAD_STATUS_FA) as LeadStatus[]).map((k) => ({
    key: k,
    label: LEAD_STATUS_FA[k],
  })),
];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await leadRows({ status: sp.status, q: sp.q });

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: sp.status, q: sp.q, ...over };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };

  const csvHref = () => {
    const p = new URLSearchParams();
    if (sp.status) p.set("status", sp.status);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return `/admin/leads/export${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">سرنخ‌ها (CRM)</h1>
          <p className="mt-1 text-xs text-white/50">
            پیام‌های فرم تماس و مشاوره — پیگیری، تغییر وضعیت و یادداشت داخلی
          </p>
        </div>
        <a
          href={csvHref()}
          className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20"
        >
          ⬇ خروجی CSV
        </a>
      </div>

      {/* فیلتر وضعیت + جستجو */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = (sp.status ?? "") === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={qs({ status: f.key || undefined })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "border-[#d4af37]/50 bg-[#d4af37]/15 text-[#d4af37]"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <form action="/admin/leads" method="get" className="ms-auto flex items-center gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="جستجوی نام یا شماره…"
            className="w-48 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#d4af37]/40 focus:outline-none"
          />
          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
            بگرد
          </button>
        </form>
      </div>

      {/* لیست سرنخ‌ها */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
          سرنخی نیست. پیام‌های فرم تماس سایت اینجا ظاهر می‌شوند.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black">{lead.name}</span>
                    <span
                      dir="ltr"
                      className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-white/70"
                    >
                      {lead.phone}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${LEAD_STATUS_CLASS[lead.status]}`}
                    >
                      {LEAD_STATUS_FA[lead.status]}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {lead.source === "whatsapp" ? "واتساپ" : "فرم تماس"}
                    </span>
                  </div>
                  {lead.topic && (
                    <p className="mt-1 text-[11px] text-[#d4af37]/80">موضوع: {lead.topic}</p>
                  )}
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-xs leading-6 text-white/70">
                    {lead.message}
                  </p>
                  <p className="mt-2 text-[10px] text-white/35">
                    {formatJalaliDate(lead.createdAt)}
                  </p>
                </div>

                {/* فرم تغییر وضعیت + یادداشت */}
                <form action={updateLeadAction} className="w-full space-y-2 sm:w-72">
                  <input type="hidden" name="id" value={lead.id} />
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white focus:border-[#d4af37]/40 focus:outline-none"
                  >
                    {(Object.keys(LEAD_STATUS_FA) as LeadStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {LEAD_STATUS_FA[k]}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="adminNote"
                    defaultValue={lead.adminNote ?? ""}
                    placeholder="یادداشت داخلی (تماس گرفتم، قرار جلسه…)"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs leading-5 text-white placeholder:text-white/25 focus:border-[#d4af37]/40 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button className="rounded-full bg-[#d4af37] px-4 py-1.5 text-[11px] font-black text-[#0a0a0f] transition hover:brightness-110">
                      ذخیره
                    </button>
                    <a
                      href={`https://wa.me/98${lead.phone.replace(/\D/g, "").replace(/^98/, "").slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      واتساپ
                    </a>
                    <a
                      href={`tel:${lead.phone}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
                    >
                      تماس
                    </a>
                  </div>
                </form>
              </div>

              {/* حذف */}
              <form action={deleteLeadAction} className="mt-3 border-t border-white/5 pt-2">
                <input type="hidden" name="id" value={lead.id} />
                <button className="text-[10px] text-white/25 transition hover:text-rose-400">
                  حذف سرنخ
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
