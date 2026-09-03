"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { PortfolioFormState } from "@/app/admin/portfolio/actions";
import { AdminImageField } from "@/components/avahub/admin-image-field";
import { SeoPreviewFields } from "@/components/avahub/admin-seo-preview";

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
  slug?: string | null;
  client?: string | null;
  projectType?: string | null;
  projectDate?: string | null;
  servicesUsed?: string[];
  results?: string | null;
  gallery?: string[];
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  altText?: string | null;
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

      {/* کیس‌استادی — فاز E */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">کیس‌استادی (برای صفحهٔ اختصاصی نمونه‌کار)</h2>
        <p className="text-[11px] text-white/40">هرچه این بخش کامل‌تر باشد، نمونه‌کار صفحهٔ اختصاصی + سئوی قوی‌تری دارد.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="slug">اسلاگ (آدرس کیس‌استادی)</label>
            <input id="slug" name="slug" dir="ltr" defaultValue={defaults.slug ?? ""} className={inputCls} placeholder="خالی = از عنوان ساخته می‌شود" />
          </div>
          <div>
            <label className={labelCls} htmlFor="client">کارفرما / برند</label>
            <input id="client" name="client" maxLength={120} defaultValue={defaults.client ?? ""} className={inputCls} placeholder="مثلاً: بانک آینده" />
          </div>
          <div>
            <label className={labelCls} htmlFor="projectType">نوع پروژه</label>
            <input id="projectType" name="projectType" maxLength={60} defaultValue={defaults.projectType ?? ""} className={inputCls} placeholder="همایش / کنسرت / کمپین تبلیغاتی" />
          </div>
          <div>
            <label className={labelCls} htmlFor="projectDate">زمان اجرا</label>
            <input id="projectDate" name="projectDate" maxLength={60} defaultValue={defaults.projectDate ?? ""} className={inputCls} placeholder="مثلاً: پاییز ۱۴۰۳" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="servicesUsed">خدمات انجام‌شده (با ویرگول جدا کنید)</label>
            <input id="servicesUsed" name="servicesUsed" maxLength={600} defaultValue={defaults.servicesUsed?.join("، ") ?? ""} className={inputCls} placeholder="برنامه‌ریزی، صدا و نور، پذیرایی" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="results">نتایج پروژه</label>
            <textarea id="results" name="results" rows={3} maxLength={3000} defaultValue={defaults.results ?? ""} className={inputCls} placeholder="مثلاً: ۸۰۰ مهمان، ۹۵٪ رضایت، ۲ میلیون بازدید رسانه‌ای" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="gallery">گالری (هر خط یک آدرس عکس)</label>
            <textarea id="gallery" name="gallery" rows={3} maxLength={3000} dir="ltr" defaultValue={defaults.gallery?.join("\n") ?? ""} className={`${inputCls} font-mono text-xs`} placeholder="/images/photo1.jpg&#10;https://…" />
          </div>
          <div className="sm:col-span-2 flex items-center">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={defaults.isFeatured ?? false} className="h-4 w-4 accent-[#d4af37]" />
              کیس‌استادی ویژه (بالای صفحهٔ پورتفولیو)
            </label>
          </div>
        </div>
      </section>

      {/* سئو — فاز E */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">سئو</h2>
        <SeoPreviewFields
          defaultTitle={defaults.seoTitle ?? ""}
          defaultDescription={defaults.seoDescription ?? ""}
          fallbackTitle={defaults.title || "عنوان نمونه‌کار"}
          path="/portfolio/..."
        />
        <div>
          <label className={labelCls} htmlFor="altText">متن جایگزین تصویر (Alt)</label>
          <input id="altText" name="altText" maxLength={200} defaultValue={defaults.altText ?? ""} className={inputCls} placeholder="توصیف دقیق عکس برای گوگل و نابینایان" />
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
