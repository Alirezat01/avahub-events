"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import type { JournalFormState } from "@/app/admin/journal/actions";
import { AdminImageField } from "@/components/avahub/admin-image-field";

// ─────────────────────────────────────────────────────────────
// فرم ساخت/ویرایش مقالهٔ مجله — فاز ۶
// محتوا با Markdown + پیش‌نمایش زنده
// ─────────────────────────────────────────────────────────────

type Defaults = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  icon?: string | null;
  tags?: string[];
  authorName?: string | null;
  status?: string;
  publishedAt?: string; // yyyy-mm-dd
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d4af37]/60 focus:bg-white/[0.06] placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-white/70";

export function AdminJournalForm({
  action,
  defaults = {},
  mediaUrls = [],
  submitLabel,
}: {
  action: (state: JournalFormState, fd: FormData) => Promise<JournalFormState>;
  defaults?: Defaults;
  mediaUrls?: string[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [content, setContent] = useState(defaults.content ?? "");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {state.error}
        </div>
      )}

      {/* مشخصات مقاله */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">مشخصات مقاله</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="title">عنوان *</label>
            <input id="title" name="title" required maxLength={160} defaultValue={defaults.title} className={inputCls} placeholder="مثلاً: ۵ تکنیک برای درخشش برند در رویدادها" />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">اسلاگ (آدرس)</label>
            <input id="slug" name="slug" dir="ltr" defaultValue={defaults.slug} className={inputCls} placeholder="خالی بگذارید تا از عنوان ساخته شود" />
          </div>
          <div>
            <label className={labelCls} htmlFor="status">وضعیت</label>
            <select id="status" name="status" defaultValue={defaults.status ?? "DRAFT"} className={inputCls}>
              <option value="DRAFT">پیش‌نویس (پنهان)</option>
              <option value="PUBLISHED">منتشر شده</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="excerpt">خلاصه (کارت مجله)</label>
            <textarea id="excerpt" name="excerpt" rows={2} maxLength={400} defaultValue={defaults.excerpt ?? ""} className={inputCls} placeholder="یک یا دو خط جذاب که در کارت مقاله دیده می‌شود" />
          </div>
          <div className="sm:col-span-2">
            <AdminImageField
              label="کاور مقاله"
              defaultValue={defaults.coverImage ?? ""}
              mediaUrls={mediaUrls}
            />
            {state?.fieldErrors?.coverImage && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.coverImage}</p>
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="icon">ایموجی کاور (وقتی عکس نیست)</label>
            <input id="icon" name="icon" maxLength={8} defaultValue={defaults.icon ?? ""} className={inputCls} placeholder="✨ یا 🎤" />
          </div>
          <div>
            <label className={labelCls} htmlFor="tags">برچسب‌ها (با ویرگول جدا کنید)</label>
            <input id="tags" name="tags" defaultValue={defaults.tags?.join("، ") ?? ""} className={inputCls} placeholder="رویداد، برندینگ" />
          </div>
          <div>
            <label className={labelCls} htmlFor="authorName">نام نویسنده</label>
            <input id="authorName" name="authorName" maxLength={80} defaultValue={defaults.authorName ?? ""} className={inputCls} placeholder="تیم آواهاب" />
          </div>
          <div>
            <label className={labelCls} htmlFor="publishedAt">تاریخ انتشار</label>
            <input id="publishedAt" type="date" name="publishedAt" defaultValue={defaults.publishedAt} className={inputCls} />
            <p className="mt-1 text-[11px] text-white/40">برای انتشار فوری خالی بگذارید — «الان» ثبت می‌شود.</p>
          </div>
        </div>
      </section>

      {/* محتوا */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">محتوا (Markdown)</h2>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/5"
          >
            {showPreview ? "پنهان کردن پیش‌نمایش" : "پیش‌نمایش زنده"}
          </button>
        </div>
        <textarea
          id="content"
          name="content"
          rows={16}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${inputCls} font-mono leading-7`}
          placeholder={"## تیتر بخش\n\nمتن پاراگراف…\n\n- مورد لیست\n- مورد دوم\n\n**مهم:** این متن بولد است"}
        />
        <p className="text-[11px] text-white/40">
          پشتیبانی: تیتر با # و ## ، **بولد**، *ایتالیک*، لیست با - ، لینک [متن](آدرس)، نقل‌قول با &gt;
        </p>

        {showPreview && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-[10px] font-bold text-[#d4af37] mb-3">پیش‌نمایش</div>
            <div className="max-w-none text-sm leading-8 text-white/80 [&_a]:text-[#d4af37] [&_a]:underline [&_blockquote]:border-r-2 [&_blockquote]:border-[#d4af37]/40 [&_blockquote]:pe-2 [&_blockquote]:ps-3 [&_blockquote]:text-white/60 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-black [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pe-5 [&_p]:my-3 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pe-5">
              <Markdown>{content || "چیزی برای پیش‌نمایش نیست…"}</Markdown>
            </div>
          </div>
        )}
      </section>

      {/* سئو */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">سئو (اختیاری)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="metaTitle">Title گوگل</label>
            <input id="metaTitle" name="metaTitle" maxLength={120} defaultValue={defaults.metaTitle ?? ""} className={inputCls} placeholder="خالی = همان عنوان مقاله" />
          </div>
          <div>
            <label className={labelCls} htmlFor="metaDescription">Description گوگل</label>
            <input id="metaDescription" name="metaDescription" maxLength={200} defaultValue={defaults.metaDescription ?? ""} className={inputCls} placeholder="خالی = همان خلاصه" />
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
        <Link href="/admin/journal" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/5">
          انصراف
        </Link>
      </div>
    </form>
  );
}
