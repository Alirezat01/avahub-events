import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/avahub/logout-button";
import { CancelRegistrationButton } from "@/components/avahub/cancel-registration-button";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hourglass,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Ticket,
  XCircle,
} from "lucide-react";
import { formatJalaliShort } from "@/lib/avahub/jalali";

export const metadata: Metadata = {
  title: "حساب کاربری | آواهاب ایونتس",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // middleware قبلاً هدایت کرده

  // پروفایل ساخته‌شده توسط تریگر سونابیس
  let profile: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    city: string | null;
  } | null = null;
  try {
    profile = await db.profile.findFirst({
      where: { authUserId: user.id },
      select: { id: true, fullName: true, email: true, phone: true, city: true },
    });
  } catch {
    profile = null;
  }

  // رویدادهای من — ثبت‌نامی‌ها + لیست انتظار (فاز ۴)
  const [myRegistrations, myWaitlists] = profile
    ? await Promise.all([
        db.registration
          .findMany({
            where: { profileId: profile.id },
            orderBy: { createdAt: "desc" },
            include: {
              event: {
                select: {
                  slug: true,
                  title: true,
                  startsAt: true,
                  venueName: true,
                  venueCity: true,
                },
              },
            },
          })
          .catch(() => []),
        db.waitlist
          .findMany({
            where: { profileId: profile.id, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            include: {
              event: {
                select: {
                  slug: true,
                  title: true,
                  startsAt: true,
                  venueName: true,
                  venueCity: true,
                },
              },
            },
          })
          .catch(() => []),
      ])
    : [[], []];
  const upcomingRegs = myRegistrations.filter(
    (r) => r.status !== "CANCELLED" && r.event.startsAt.getTime() >= Date.now(),
  );
  const pastRegs = myRegistrations.filter(
    (r) => r.event.startsAt.getTime() < Date.now() || r.status === "CANCELLED",
  );

  const meta = user.user_metadata as { full_name?: string; avatar_url?: string; name?: string };
  const displayName = profile?.fullName ?? meta.full_name ?? meta.name ?? "کاربر آواهاب";
  const email = profile?.email ?? user.email ?? "";

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,77,223,0.12),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* سربرگ حساب */}
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold/25 bg-charcoal/70 p-8 text-center backdrop-blur">
          <div className="flex size-20 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-2xl font-black text-gradient-gold">
            {displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black">{displayName}</h1>
            <p dir="ltr" className="mt-1 text-sm text-foreground/60">
              {email}
            </p>
          </div>
          <p className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-foreground/70">
            به خانواده آواهاب خوش آمدی؛ از این‌جا ثبت حضور رویدادها را مدیریت می‌کنی.
          </p>
        </div>

        {/* اطلاعات حساب */}
        <section aria-labelledby="account-info" className="mt-6">
          <h2 id="account-info" className="mb-3 text-sm font-black text-foreground/85">
            اطلاعات حساب
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            <div className="flex items-center gap-3 bg-charcoal/80 px-5 py-4">
              <Mail className="size-4 text-gold/70" aria-hidden="true" />
              <div>
                <dt className="text-[11px] text-foreground/50">ایمیل</dt>
                <dd dir="ltr" className="text-right text-sm">{email || "—"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-charcoal/80 px-5 py-4">
              <Phone className="size-4 text-gold/70" aria-hidden="true" />
              <div>
                <dt className="text-[11px] text-foreground/50">شماره موبایل</dt>
                <dd className="text-sm">
                  {profile?.phone ?? (
                    <span className="text-foreground/45">موقع ثبت‌نام رویداد اضافه می‌شود</span>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-charcoal/80 px-5 py-4">
              <MapPin className="size-4 text-gold/70" aria-hidden="true" />
              <div>
                <dt className="text-[11px] text-foreground/50">شهر</dt>
                <dd className="text-sm">{profile?.city ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-charcoal/80 px-5 py-4">
              <ShieldCheck className="size-4 text-gold/70" aria-hidden="true" />
              <div>
                <dt className="text-[11px] text-foreground/50">نوع ورود</dt>
                <dd className="text-sm">
                  {meta.full_name || user.app_metadata.provider === "google" ? "گوگل" : "ایمیل (لینک جادویی)"}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        {/* رویدادهای من — فاز ۴ */}
        <section aria-labelledby="my-events" className="mt-6">
          <h2 id="my-events" className="mb-3 text-sm font-black text-foreground/85">
            رویدادهای من
          </h2>

          {/* رویدادهای آینده */}
          {upcomingRegs.length === 0 && myWaitlists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
              <Ticket className="size-7 text-gold/60" aria-hidden="true" />
              <p className="max-w-sm text-sm leading-7 text-foreground/55">
                هنوز در رویدادی ثبت‌نام نکرده‌ای؛ رویداد بعدی‌ات را انتخاب کن و
                جایگاهت را رایگان رزرو کن.
              </p>
              <Link
                href="/events"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                دیدن رویدادهای پیش رو
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-2xl border border-border bg-charcoal/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/events/${reg.event.slug}`}
                        className="text-sm font-black transition-colors hover:text-gold"
                      >
                        {reg.event.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/50">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {formatJalaliShort(reg.event.startsAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden="true" />
                          {reg.event.venueName ?? reg.event.venueCity}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                        reg.status === "CONFIRMED"
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {reg.status === "CONFIRMED" ? (
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                      ) : (
                        <Hourglass className="size-3" aria-hidden="true" />
                      )}
                      {reg.status === "CONFIRMED" ? "ثبت‌نام قطعی" : "در انتظار تأیید"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
                    {reg.status === "CONFIRMED" && (
                      <Link
                        href={`/pass/${reg.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-black text-charcoal transition-shadow hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                      >
                        <QrCode className="size-3.5" aria-hidden="true" />
                        کارت ورود (QR)
                      </Link>
                    )}
                    <CancelRegistrationButton
                      registrationId={reg.id}
                      eventTitle={reg.event.title}
                    />
                  </div>
                </div>
              ))}

              {/* لیست انتظار */}
              {myWaitlists.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-purple/25 bg-purple/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/events/${w.event.slug}`}
                        className="text-sm font-black transition-colors hover:text-gold"
                      >
                        {w.event.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-foreground/50">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {formatJalaliShort(w.event.startsAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple/40 bg-purple/10 px-3 py-1 text-[11px] font-bold text-purple">
                      <Clock3 className="size-3" aria-hidden="true" />
                      لیست انتظار — نوبت {w.position.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </div>
              ))}

              {/* لغوشده‌ها / گذشته‌ها */}
              {pastRegs.length > 0 && (
                <details className="rounded-2xl border border-border bg-card/40 px-5 py-4">
                  <summary className="cursor-pointer text-xs font-bold text-foreground/60">
                    رویدادهای لغوشده و گذشته ({pastRegs.length.toLocaleString("fa-IR")})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {pastRegs.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-charcoal/60 px-4 py-3"
                      >
                        <Link
                          href={`/events/${reg.event.slug}`}
                          className="text-xs text-foreground/60 transition-colors hover:text-foreground"
                        >
                          {reg.event.title}
                        </Link>
                        <span className="inline-flex items-center gap-1 text-[11px] text-foreground/40">
                          <XCircle className="size-3" aria-hidden="true" />
                          {reg.status === "CANCELLED"
                            ? reg.cancelledBy === "USER"
                              ? "انصراف شما"
                              : "لغو شده"
                            : `برگزارشده — ${formatJalaliShort(reg.event.startsAt)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
