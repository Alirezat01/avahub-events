import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Armchair,
  CalendarDays,
  Coffee,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Music,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getEventBySlug } from "@/lib/avahub/events-db";
import {
  getEventCapacitySummary,
  getUserRegistration,
  getUserWaitlistEntry,
} from "@/lib/avahub/registration";
import { CONSENT_LABEL, CONSENT_VERSION } from "@/lib/avahub/consent";
import { formatJalaliDate, formatTimeFa } from "@/lib/avahub/jalali";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ثبت‌حضور | آواهاب ایونتس",
  robots: { index: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function utmParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) notFound();

  // فقط کاربر واردشده می‌تواند ثبت‌نام کند
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${slug}/register`);

  const profile = await db.profile
    .findFirst({
      where: { authUserId: user.id },
      select: { id: true, phone: true, city: true },
    })
    .catch(() => null);

  const [capacity, existingReg, waitlistEntry] = await Promise.all([
    getEventCapacitySummary(event.id, event.capacity).catch(() => ({
      taken: 0,
      remaining: null as number | null,
      full: false,
    })),
    profile
      ? getUserRegistration(event.id, profile.id).catch(() => null)
      : Promise.resolve(null),
    profile
      ? getUserWaitlistEntry(event.id, profile.id).catch(() => null)
      : Promise.resolve(null),
  ]);

  const activeReg =
    existingReg && existingReg.status !== "CANCELLED" ? existingReg : null;

  const startsAt = event.startsAt;
  const specialItems = [
    {
      icon: Armchair,
      text:
        event.hasSeating === true
          ? "این رویداد صندلی اختصاصی دارد."
          : event.hasSeating === false
            ? "این رویداد صندلی اختصاصی ندارد؛ نشستن آزاد است."
            : null,
    },
    { icon: Coffee, text: event.cateringNote },
    { icon: Music, text: event.musicInfo },
    { icon: Info, text: event.specialNotes },
  ].filter((x) => x.text);

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
        <nav
          aria-label="مسیر راهنما"
          className="mb-6 flex items-center gap-2 text-xs text-foreground/50"
        >
          <Link href="/" className="hover:text-gold">
            خانه
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/events" className="hover:text-gold">
            رویدادها
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/events/${event.slug}`} className="hover:text-gold">
            {event.title}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground/80">ثبت‌حضور</span>
        </nav>

        {/* خلاصه رویداد */}
        <div className="rounded-3xl border border-border bg-card/50 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10">
              <Ticket className="size-5 text-gold" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-black leading-7">{event.title}</h1>
              <p className="mt-0.5 text-[11px] text-foreground/50">
                {event.category?.title ?? "رویداد"} — آواهاب ایونتس
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-2 text-[13px] sm:grid-cols-2">
            <div className="flex items-center gap-2 text-foreground/70">
              <CalendarDays className="size-4 text-gold/70" aria-hidden="true" />
              <dd>{formatJalaliDate(startsAt)}</dd>
            </div>
            <div className="flex items-center gap-2 text-foreground/70">
              <Clock3 className="size-4 text-gold/70" aria-hidden="true" />
              <dd>{formatTimeFa(startsAt)}</dd>
            </div>
            <div className="flex items-center gap-2 text-foreground/70 sm:col-span-2">
              <MapPin className="size-4 text-gold/70" aria-hidden="true" />
              <dd>{event.venueName ?? event.venueCity}</dd>
            </div>
          </dl>

          {/* ظرفیت زنده */}
          <p className="mt-4 rounded-xl border border-border/70 bg-charcoal/60 px-4 py-2.5 text-xs text-foreground/60">
            {event.capacity > 0 ? (
              capacity.full ? (
                <span className="text-amber-300">
                  ظرفیت تکمیل شده — {capacity.taken.toLocaleString("fa-IR")} نفر ثبت‌نام کرده‌اند
                </span>
              ) : (
                <>
                  ظرفیت باقی‌مانده:{" "}
                  <b className="text-gold">
                    {(capacity.remaining ?? 0).toLocaleString("fa-IR")}
                  </b>{" "}
                  نفر از {event.capacity.toLocaleString("fa-IR")}
                </>
              )
            ) : (
              "بدون محدودیت ظرفیت"
            )}
          </p>
        </div>

        {/* نکات خاص این رویداد — ادمین می‌نویسد، کاربر همین‌جا می‌بیند */}
        {specialItems.length > 0 && (
          <section
            aria-labelledby="special-notes"
            className="mt-5 rounded-3xl border border-purple/25 bg-purple/[0.05] p-6"
          >
            <h2
              id="special-notes"
              className="flex items-center gap-2 text-sm font-black text-foreground/90"
            >
              <Info className="size-4 text-purple" aria-hidden="true" />
              نکات مهم این رویداد
            </h2>
            <ul className="mt-3 space-y-2.5">
              {specialItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground/70"
                >
                  <item.icon
                    className="mt-0.5 size-4 shrink-0 text-purple/80"
                    aria-hidden="true"
                  />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* بدنه اصلی — فرم یا وضعیت‌های خاص */}
        <div className="mt-6">
          {activeReg ? (
            <div className="rounded-3xl border border-gold/30 bg-charcoal/80 p-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                <CheckCircle2 className="size-7 text-gold" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-black">
                شما قبلاً در این رویداد ثبت‌نام کرده‌اید
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-foreground/65">
                وضعیت ثبت‌نام شما:{" "}
                <b className="text-gold">
                  {activeReg.status === "CONFIRMED" ? "ثبت‌نام قطعی" : "در انتظار تأیید"}
                </b>
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  <Ticket className="size-4" aria-hidden="true" />
                  رویدادهای من
                </Link>
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-2.5 text-sm font-bold text-foreground/75"
                >
                  صفحه رویداد
                </Link>
              </div>
            </div>
          ) : waitlistEntry ? (
            <div className="rounded-3xl border border-purple/30 bg-charcoal/80 p-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-purple/40 bg-purple/10">
                <Clock3 className="size-7 text-purple" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-black">
                شما در لیست انتظار این رویداد هستید
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-foreground/65">
                نوبت فعلی شما:{" "}
                <b className="text-purple">
                  {waitlistEntry.position.toLocaleString("fa-IR")}
                </b>{" "}
                — به‌محض آزاد شدن جایگاه از طریق ایمیل و شماره‌ای که ثبت کرده‌اید
                خبرتان می‌کنیم.
              </p>
              <Link
                href="/account"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-2.5 text-sm font-bold text-foreground/75"
              >
                رویدادهای من
              </Link>
            </div>
          ) : capacity.full && !event.waitlistEnabled ? (
            <div className="rounded-3xl border border-border bg-charcoal/80 p-8 text-center">
              <h2 className="text-lg font-black">ظرفیت تکمیل شده است</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-foreground/65">
                متأسفانه ظرفیت این رویداد تکمیل شده و لیست انتظار نیز فعال
                نیست.
              </p>
              <Link
                href="/events"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-2.5 text-sm font-bold text-foreground/75"
              >
                رویدادهای دیگر
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card/50 p-6 sm:p-8">
              <h2 className="mb-1 text-base font-black">
                {capacity.full ? "لیست انتظار" : "فرم ثبت‌حضور"}
              </h2>
              <p className="mb-6 text-xs leading-6 text-foreground/50">
                {capacity.full
                  ? "ظرفیت پر شده است؛ اطلاعات زیر را وارد کنید تا در لیست انتظار قرار بگیرید."
                  : "اطلاعات زیر را کامل کنید؛ ثبت‌نام رایگان است و کمتر از یک دقیقه طول می‌کشد."}
              </p>
              <RegisterForm
                slug={event.slug}
                mode={capacity.full ? "waitlist" : "register"}
                defaultPhone={profile?.phone ?? ""}
                defaultCity={profile?.city ?? ""}
                utm={{
                  source: utmParam(sp, "utm_source"),
                  medium: utmParam(sp, "utm_medium"),
                  campaign: utmParam(sp, "utm_campaign"),
                }}
                consentLabel={CONSENT_LABEL}
              />
              <p className="mt-4 text-center text-[10px] text-foreground/35" dir="ltr">
                consent: {CONSENT_VERSION}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
