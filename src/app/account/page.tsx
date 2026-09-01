import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/avahub/logout-button";
import { CalendarCheck, Mail, MapPin, Phone, ShieldCheck, Ticket } from "lucide-react";

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
  let profile: { fullName: string | null; email: string; phone: string | null; city: string | null } | null =
    null;
  try {
    profile = await db.profile.findFirst({
      where: { authUserId: user.id },
      select: { fullName: true, email: true, phone: true, city: true },
    });
  } catch {
    profile = null;
  }

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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <Ticket className="size-7 text-gold/60" aria-hidden="true" />
            <p className="max-w-sm text-sm leading-7 text-foreground/55">
              هنوز در رویدادی ثبت‌نام نکرده‌ای. به‌محض فعال‌سازی ثبت حضور (فاز ۴)، بلیت‌ها و
              QR ورودی‌ات همین‌جا نمایش داده می‌شود.
            </p>
            <Link
              href="/events"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              دیدن رویدادهای پیش رو
            </Link>
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
