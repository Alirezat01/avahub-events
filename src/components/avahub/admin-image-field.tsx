"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// فیلد تصویر پنل ادمین — فاز ۶
// آدرس دستی + پیش‌نمایش زنده + پیشنهاد از رسانه‌های آپلودشده
// (datalist از Media Manager)
// ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d4af37]/60 focus:bg-white/[0.06] placeholder:text-white/30";

export function AdminImageField({
  name = "coverImage",
  label = "تصویر",
  defaultValue = "",
  mediaUrls = [],
  required = false,
}: {
  name?: string;
  label?: string;
  defaultValue?: string;
  mediaUrls?: string[];
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const listId = `${name}-media-list`;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70" htmlFor={`${name}-input`}>
        {label} {required && "*"}
        <span className="text-white/40"> — آدرس را دستی بدهید یا از رسانه‌های آپلودشده انتخاب کنید</span>
      </label>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="h-16 w-24 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            {value.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="پیش‌نمایش"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                بدون عکس
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <input
            id={`${name}-input`}
            name={name}
            dir="ltr"
            list={mediaUrls.length > 0 ? listId : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
            placeholder="/images/event-....png یا https://…supabase.co/storage/v1/object/public/media/…"
          />
          {mediaUrls.length > 0 && (
            <datalist id={listId}>
              {mediaUrls.slice(0, 50).map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          )}
          <p className="mt-1 text-[11px] text-white/40">
            برای آپلود عکس جدید به <span className="text-[#d4af37]">رسانه‌ها</span> در منوی پنل بروید و آدرس را کپی کنید.
          </p>
        </div>
      </div>
    </div>
  );
}
