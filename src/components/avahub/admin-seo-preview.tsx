"use client";

// ─────────────────────────────────────────────────────────────
// SEO Field با شمارنده + پیش‌نمایش نتیجهٔ گوگل — فاز E
// (SEO Manager نسخهٔ سبک داخل فرم‌ها)
// ─────────────────────────────────────────────────────────────

import { useState } from "react";

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d4af37]/60 focus:bg-white/[0.06] placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-white/70";

export function SeoPreviewFields({
  defaultTitle = "",
  defaultDescription = "",
  fallbackTitle = "",
  path = "/",
}: {
  defaultTitle?: string;
  defaultDescription?: string;
  fallbackTitle?: string; // وقتی Title خالی است چه چیزی نمایش داده می‌شود
  path?: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [desc, setDesc] = useState(defaultDescription);

  const shownTitle = title || fallbackTitle || "عنوان صفحه";
  const tLen = (title || fallbackTitle).length;
  const dLen = desc.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="seoTitle">Title گوگل</label>
          <input
            id="seoTitle"
            name="seoTitle"
            maxLength={120}
            defaultValue={defaultTitle}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder={fallbackTitle ? `خالی = ${fallbackTitle}` : "تیتر اختصاصی برای گوگل"}
          />
          <div className="mt-1 flex justify-between text-[11px]">
            <span className={tLen > 60 ? "text-rose-300" : tLen >= 45 ? "text-emerald-300" : "text-white/40"}>
              {tLen > 60 ? "بلندتر از حد استاندارد (۶۰)" : tLen >= 45 ? "عالی (۴۵–۶۰)" : "کمی کوتاه"}
            </span>
            <span className="tabular-nums text-white/40">{tLen}/60</span>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="seoDescription">Description گوگل</label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            maxLength={220}
            defaultValue={defaultDescription}
            onChange={(e) => setDesc(e.target.value)}
            className={inputCls}
            placeholder="توضیح ۱۵۰ نویسه‌ای که زیر لینک در گوگل می‌آید"
          />
          <div className="mt-1 flex justify-between text-[11px]">
            <span className={dLen > 160 ? "text-rose-300" : dLen >= 120 ? "text-emerald-300" : "text-white/40"}>
              {dLen > 160 ? "بلندتر از حد استاندارد (۱۶۰)" : dLen >= 120 ? "عالی (۱۲۰–۱۶۰)" : "کمی کوتاه"}
            </span>
            <span className="tabular-nums text-white/40">{dLen}/160</span>
          </div>
        </div>
      </div>

      {/* پیش‌نمایش نتیجهٔ گوگل */}
      <div className="rounded-xl border border-white/10 bg-white p-4" dir="rtl">
        <p className="text-[11px] text-[#4d5156]">پیش‌نمایش نتیجهٔ گوگل</p>
        <p className="mt-1.5 truncate text-[13px] text-[#202124]">
          www.avahubevents.com<span className="text-[#4d5156]">{path}</span>
        </p>
        <p className="mt-0.5 truncate text-[17px] leading-7 text-[#1a0dab]">{shownTitle}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-6 text-[#4d5156]">
          {desc || "توضیح متا اینجا نمایش داده می‌شود — توصیه می‌شود بین ۱۲۰ تا ۱۶۰ نویسه باشد."}
        </p>
      </div>
    </div>
  );
}
