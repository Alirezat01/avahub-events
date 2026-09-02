"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { PortfolioFormState } from "@/app/admin/portfolio/actions";
import { AdminImageField } from "@/components/avahub/admin-image-field";

// ─────────────────────────────────────────────────────────────
// فرم ساخت/ویرایش نمونه‌کار — فاز ۶
// ─────────────────────────────────────────────────────────────

type Defaults = {
  id?: string;
  title?: string;
  tag?: string | null;
  description?: string | null;
  coverImage?: string;
  link?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d4af37]/60 focus:bg-white/[0.06] placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-white/70";

export function AdminPortfolioForm({
  action,
  defaults = {},
  mediaUrls = [],
  submitLabel,
}: {
  action: (state: PortfolioFormState, fd: FormData) => Promise<PortfolioFormState>;
  defaults?: Defaults;
  mediaUrls?: string[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {state.error}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">مشخصات نمونه‌کار</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="title">عنوان *</label>
            <input id="title" name="title" required maxLength={120} defaultValue={defaults.title} className={inputCls} placeholder="مثلاً: همایش سالانه انجمن مدیران" />
          </div>
          <div>
            <label className={labelCls} htmlFor="tag">برچسب روی عکس</label>
            <input id="tag" name="tag" maxLength={40} defaultValue={defaults.tag ?? ""} className={inputCls} placeholder="مثلاً: همایش" />
          </div>

          <div className="sm:col-span-2">
            <AdminImageField
              label="تصویر نمونه‌کار"
              defaultValue={defaults.coverImage ?? ""}
              mediaUrls={mediaUrls}
              required
            />
            {state?.fieldErrors?.coverImage && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.coverImage}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="description">توضیح (اختیاری)</label>
            <textarea id="description" name="description" rows={3} maxLength={1000} defaultValue={defaults.description ?? ""} className={inputCls} placeholder="چند خط دربارهٔ این پروژه" />
          </div>

          <div>
            <label className={labelCls} htmlFor="link">لینک (اختیاری)</label>
            <input id="link" name="link" dir="ltr" defaultValue={defaults.link ?? ""} className={inputCls} placeholder="https://instagram.com/…" />
          </div>
          <div>
            <label className={labelCls} htmlFor="sortOrder">ترتیب نمایش (کوچک‌تر = بالاتر)</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} max={9999} defaultValue={defaults.sortOrder ?? 0} className={inputCls} />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={defaults.isActive ?? true} className="h-4 w-4 accent-[#d4af37]" />
              نمایش در سایت (فعال)
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#d4af37] px-6 py-2.5 text-sm font-bold text-[#0a0a0f] transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "در حال ذخیره…" : submitLabel}
        </button>
        <Link href="/admin/portfolio" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/5">
          انصراف
        </Link>
      </div>
    </form>
  );
}
