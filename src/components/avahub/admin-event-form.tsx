"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { EventFormState } from "@/app/admin/events/actions";

// ─────────────────────────────────────────────────────────────
// فرم ساخت/ویرایش رویداد — فاز ۵
// شامل باکس «نکات خاص رویداد» (صندلی/پذیرایی/موسیقی/سایر)
// که کاربر موقع ثبت‌نام در باکس «نکات مهم» می‌بیند
// ─────────────────────────────────────────────────────────────

type EventDefaults = {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  coverImage?: string | null;
  startsAt?: string; // برای input datetime-local (وقت تهران)
  endsAt?: string;
  venueName?: string | null;
  venueAddress?: string | null;
  venueCity?: string | null;
  capacity?: number;
  waitlistEnabled?: boolean;
  isFeatured?: boolean;
  status?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  hasSeating?: boolean | null;
  cateringNote?: string | null;
  musicInfo?: string | null;
  specialNotes?: string | null;
};

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d4af37]/60 focus:bg-white/[0.06] placeholder:text-white/30";
const labelCls = "mb-1.5 block text-xs font-medium text-white/70";

export function AdminEventForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: EventFormState, fd: FormData) => Promise<EventFormState>;
  defaults?: EventDefaults;
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

      {/* مشخصات اصلی */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">مشخصات اصلی</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="title">عنوان رویداد *</label>
            <input id="title" name="title" required maxLength={150} defaultValue={defaults.title} className={inputCls} placeholder="مثلاً: کنفرانس نوآوری و فناوری" />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">اسلاگ (آدرس انگلیسی)</label>
            <input id="slug" name="slug" dir="ltr" defaultValue={defaults.slug} className={inputCls} placeholder="innovation-conference — خالی بگذارید تا خودکار ساخته شود" />
          </div>
          <div>
            <label className={labelCls} htmlFor="status">وضعیت انتشار</label>
            <select id="status" name="status" defaultValue={defaults.status ?? "DRAFT"} className={inputCls}>
              <option value="DRAFT">پیش‌نویس (پنهان)</option>
              <option value="PUBLISHED">منتشر شده</option>
              <option value="CANCELLED">لغو شده</option>
              <option value="ARCHIVED">آرشیو</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="summary">خلاصه (کارت رویداد)</label>
            <textarea id="summary" name="summary" rows={2} maxLength={300} defaultValue={defaults.summary ?? ""} className={inputCls} placeholder="یک خط جذاب درباره رویداد" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="description">توضیح کامل (صفحه رویداد)</label>
            <textarea id="description" name="description" rows={6} maxLength={8000} defaultValue={defaults.description ?? ""} className={inputCls} placeholder="شرح کامل برنامه، محورها، سخنران‌ها و..." />
          </div>
          <div>
            <label className={labelCls} htmlFor="coverImage">مسیر تصویر کاور</label>
            <input id="coverImage" name="coverImage" dir="ltr" defaultValue={defaults.coverImage ?? ""} className={inputCls} placeholder="/images/event-....png" />
          </div>
          <div className="flex items-end gap-5 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={defaults.isFeatured} className="h-4 w-4 accent-[#d4af37]" />
              رویداد ویژه (صفحه اصلی)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="waitlistEnabled" defaultChecked={defaults.waitlistEnabled ?? true} className="h-4 w-4 accent-[#d4af37]" />
              لیست انتظار فعال
            </label>
          </div>
        </div>
      </section>

      {/* زمان و مکان */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">زمان و مکان</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="startsAt">شروع * (به وقت تهران)</label>
            <input id="startsAt" type="datetime-local" name="startsAt" required defaultValue={defaults.startsAt} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="endsAt">پایان (اختیاری)</label>
            <input id="endsAt" type="datetime-local" name="endsAt" defaultValue={defaults.endsAt} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="venueName">نام مکان</label>
            <input id="venueName" name="venueName" defaultValue={defaults.venueName ?? ""} className={inputCls} placeholder="برج میلاد، تالار همایش‌ها" />
          </div>
          <div>
            <label className={labelCls} htmlFor="venueCity">شهر</label>
            <input id="venueCity" name="venueCity" defaultValue={defaults.venueCity ?? "تهران"} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="venueAddress">آدرس کامل</label>
            <input id="venueAddress" name="venueAddress" defaultValue={defaults.venueAddress ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="capacity">ظرفیت (۰ = بدون محدودیت)</label>
            <input id="capacity" type="number" name="capacity" min={0} max={100000} step={1} defaultValue={defaults.capacity ?? 0} className={inputCls} />
          </div>
        </div>
      </section>

      {/* نکات خاص رویداد */}
      <section className="rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/[0.04] p-5 space-y-4">
        <div>
          <h2 className="font-bold text-[#d4af37]">نکات خاص رویداد</h2>
          <p className="mt-1 text-xs text-white/60 leading-6">
            این موارد هنگام ثبت‌نام در باکس «نکات مهم» به شرکت‌کننده نمایش داده می‌شود.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="hasSeating" defaultChecked={defaults.hasSeating ?? false} className="h-4 w-4 accent-[#d4af37]" />
              صندلی اختصاصی دارد
            </label>
          </div>
          <div>
            <label className={labelCls} htmlFor="cateringNote">پذیرایی</label>
            <input id="cateringNote" name="cateringNote" defaultValue={defaults.cateringNote ?? ""} className={inputCls} placeholder="مثلاً: پذیرایی صبحگاهی و ناهار رایگان" />
          </div>
          <div>
            <label className={labelCls} htmlFor="musicInfo">نوع موسیقی / برنامه هنری</label>
            <input id="musicInfo" name="musicInfo" defaultValue={defaults.musicInfo ?? ""} className={inputCls} placeholder="مثلاً: موسیقی سنتی ایرانی (زنده)" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="specialNotes">سایر نکات مهم</label>
            <textarea id="specialNotes" name="specialNotes" rows={3} maxLength={1000} defaultValue={defaults.specialNotes ?? ""} className={inputCls} placeholder="هر نکته‌ای که شرکت‌کننده باید بداند" />
          </div>
        </div>
      </section>

      {/* سئو */}
      <section className="rounded-2xl border border-white/10 bg-[#12121a] p-5 space-y-4">
        <h2 className="font-bold">سئو (اختیاری)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="metaTitle">Meta Title</label>
            <input id="metaTitle" name="metaTitle" defaultValue={defaults.metaTitle ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="metaDescription">Meta Description</label>
            <input id="metaDescription" name="metaDescription" defaultValue={defaults.metaDescription ?? ""} className={inputCls} />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#d4af37] px-6 py-2.5 font-bold text-[#0a0a0f] transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "در حال ذخیره..." : submitLabel}
        </button>
        <Link href="/admin" className="rounded-xl border border-white/15 px-6 py-2.5 text-sm hover:bg-white/5 transition">
          انصراف
        </Link>
      </div>
    </form>
  );
}
