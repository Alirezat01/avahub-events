"use client";

// ─────────────────────────────────────────────────────────────
// فرم ثبت‌حضور — موبایل (⭐) + شهر + تیک اجباری توافق‌نامه
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { useActionState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import {
  submitRegistration,
  type RegisterState,
} from "./actions";

const initialState: RegisterState = { status: "idle" };

type Props = {
  slug: string;
  mode: "register" | "waitlist";
  defaultPhone?: string;
  defaultCity?: string;
  utm: { source?: string; medium?: string; campaign?: string };
  consentLabel: string;
};

export function RegisterForm({
  slug,
  mode,
  defaultPhone,
  defaultCity,
  utm,
  consentLabel,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    submitRegistration,
    initialState,
  );

  if (state.status === "success" || state.status === "waitlisted") {
    const isWaitlist = state.status === "waitlisted";
    return (
      <div className="rounded-3xl border border-gold/30 bg-charcoal/80 p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          {isWaitlist ? (
            <Clock3 className="size-7 text-gold" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-7 text-gold" aria-hidden="true" />
          )}
        </span>
        <h2 className="mt-4 text-lg font-black">
          {isWaitlist ? "در لیست انتظار ثبت شدید" : "ثبت‌حضور شما قطعی شد!"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-foreground/65">
          {state.message}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!isWaitlist && state.regId && (
            <Link
              href={`/pass/${state.regId}`}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-black text-charcoal transition-shadow hover:shadow-[0_0_35px_rgba(212,175,55,0.45)]"
            >
              <QrCode className="size-4" aria-hidden="true" />
              دریافت کارت ورود (QR)
            </Link>
          )}
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_35px_rgba(212,175,55,0.35)]"
          >
            <Ticket className="size-4" aria-hidden="true" />
            رویدادهای من
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-2.5 text-sm font-bold text-foreground/75 transition-colors hover:text-foreground"
          >
            رویدادهای دیگر
          </Link>
        </div>
        {!isWaitlist && state.regId && (
          <p className="mt-4 text-[11px] leading-5 text-foreground/45">
            کارت ورود شما همین حالا صادر شده — می‌توانید تصویر QR را نگه دارید یا چاپ کنید.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      {utm.source && <input type="hidden" name="utm_source" value={utm.source} />}
      {utm.medium && <input type="hidden" name="utm_medium" value={utm.medium} />}
      {utm.campaign && <input type="hidden" name="utm_campaign" value={utm.campaign} />}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="leading-6">{state.message}</span>
        </div>
      )}

      {/* شماره موبایل — قلب دیتابیس مخاطبان */}
      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-bold text-foreground/85"
        >
          شماره موبایل <span className="text-gold">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          autoComplete="tel"
          required
          defaultValue={defaultPhone ?? ""}
          placeholder="09123456789"
          className="w-full rounded-2xl border border-border bg-charcoal/70 px-4 py-3 text-left text-sm tracking-wider outline-none transition-colors placeholder:text-foreground/30 focus:border-gold/50"
        />
        <p className="mt-2 text-[11px] leading-5 text-foreground/45">
          برای اطلاع‌رسانی‌های حیاتی (مثل تغییر برنامه یا لغو رویداد) استفاده
          می‌شود و در پنل مدیریت، جداگانه و به‌صورت امن نگهداری می‌شود.
        </p>
      </div>

      {/* شهر — اختیاری */}
      <div>
        <label
          htmlFor="city"
          className="mb-2 block text-sm font-bold text-foreground/85"
        >
          شهر <span className="text-foreground/40">(اختیاری)</span>
        </label>
        <input
          id="city"
          name="city"
          type="text"
          autoComplete="address-level2"
          defaultValue={defaultCity ?? ""}
          placeholder="مثلاً تهران"
          className="w-full rounded-2xl border border-border bg-charcoal/70 px-4 py-3 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-gold/50"
        />
      </div>

      {/* توافق‌نامه — تیک اجباری با پشتوانه حقوقی */}
      <div className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 size-4 shrink-0 accent-[#d4af37]"
          />
          <span className="text-[13px] leading-6 text-foreground/80">
            {consentLabel}{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-bold text-gold underline decoration-gold/40 underline-offset-4 hover:text-gold-soft"
            >
              (متن کامل)
            </Link>{" "}
            <ShieldCheck className="inline size-4 align-[-2px] text-gold/70" aria-hidden="true" />
          </span>
        </label>
        <p className="mt-2 border-t border-gold/15 pt-2 text-[11px] leading-5 text-foreground/45">
          با این تیک، رضایت شما به همراه نسخه و زمان دقیق پذیرش در سامانه ثبت
          می‌شود. ثبت‌نام رایگان است و هیچ پرداخت آنلاینی انجام نمی‌شود.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            در حال ثبت...
          </>
        ) : mode === "waitlist" ? (
          <>
            عضویت در لیست انتظار
            <Clock3 className="size-4 rotate-180" aria-hidden="true" />
          </>
        ) : (
          <>
            ثبت قطعی حضور — رایگان
            <CalendarCheck className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-foreground/40">
        با ثبت‌نام، جایگاه شما تا زمان انصراف رزرو می‌ماند و می‌توانید از بخش
        حساب کاربری هر زمان انصراف دهید.
        <ArrowRight className="mx-1 inline size-3 align-[-2px]" aria-hidden="true" />
      </p>
    </form>
  );
}
