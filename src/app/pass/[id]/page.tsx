import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Hourglass,
  MapPin,
  ShieldCheck,
  Ticket,
  XCircle,
} from "lucide-react";
import {
  getPassData,
  getSiteOrigin,
  passValidity,
  passPath,
  qrDataUrl,
} from "@/lib/avahub/pass";
import { formatJalaliDate, formatTimeFa } from "@/lib/avahub/jalali";
import { PassPrintButton } from "@/components/avahub/pass-print-button";

// ─────────────────────────────────────────────────────────────
// کارت ورود (بلیت QR) — فاز ۴ب
// آدرس غیرقابل حدس (UUID) + بدون دادهٔ حساس؛ هم شرکت‌کننده و هم
// میزبان می‌تواند با اسکن، اعتبار بلیت را همان‌جا ببیند.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کارت ورود | آواهاب ایونتس",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function PassPage({ params }: Props) {
  const { id } = await params;
  const pass = await getPassData(id).catch(() => null);
  if (!pass) notFound();

  const origin = await getSiteOrigin();
  const passUrl = `${origin}${passPath(pass.id)}`;
  const validity = passValidity(pass);

  // QR فقط برای کارت معتبر/در انتظار ساخته می‌شود
  const qr =
    validity === "invalid"
      ? null
      : await qrDataUrl(passUrl).catch(() => null);

  const eventCancelled = pass.event.status === "CANCELLED";

  const badge =
    validity === "valid" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        ثبت‌نام قطعی — بلیت معتبر
      </span>
    ) : validity === "pending" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300">
        <Hourglass className="size-3.5" aria-hidden="true" />
        در انتظار تأیید — هنوز قابل ورود نیست
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-bold text-rose-300">
        <XCircle className="size-3.5" aria-hidden="true" />
        {eventCancelled ? "این رویداد لغو شده است" : "این کارت باطل شده است"}
      </span>
    );

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media print{header,footer,nav{display:none!important}body{background:#fff!important}.pass-print-hide{display:none!important}.pass-ticket{border-color:#d4af37!important;background:#fff!important;color:#111!important}}",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-md px-4 sm:px-6">
        {/* سربرگ */}
        <div className="pass-print-hide mb-6 text-center">
          <p className="text-[11px] font-bold tracking-widest text-gold/80">
            AVAHUB EVENTS — کارت ورود
          </p>
        </div>

        {/* بلیت */}
        <div className="pass-ticket overflow-hidden rounded-3xl border border-gold/30 bg-charcoal/85 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur">
          {/* نوار بالای بلیت */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-gold/25 bg-gold/[0.06] px-6 py-4">
            <span className="inline-flex items-center gap-2 text-sm font-black text-gold">
              <Ticket className="size-4" aria-hidden="true" />
              آواهاب ایونتس
            </span>
            {badge}
          </div>

          {/* مشخصات رویداد */}
          <div className="px-6 py-5">
            <h1 className="text-lg font-black leading-8">{pass.event.title}</h1>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex items-center gap-2 text-foreground/75">
                <CalendarDays className="size-4 shrink-0 text-gold/70" aria-hidden="true" />
                <dd>{formatJalaliDate(pass.event.startsAt)}</dd>
              </div>
              <div className="flex items-center gap-2 text-foreground/75">
                <Clock3 className="size-4 shrink-0 text-gold/70" aria-hidden="true" />
                <dd>ساعت {formatTimeFa(pass.event.startsAt)}</dd>
              </div>
              <div className="flex items-start gap-2 text-foreground/75">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold/70" aria-hidden="true" />
                <dd>
                  {pass.event.venueName ?? pass.event.venueCity}
                  {pass.event.venueName && pass.event.venueCity
                    ? ` — ${pass.event.venueCity}`
                    : ""}
                </dd>
              </div>
            </dl>

            {/* دارندهٔ بلیت */}
            <div className="mt-4 rounded-2xl border border-border/70 bg-charcoal/60 px-4 py-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground/50">دارندهٔ کارت</span>
                <b>{pass.attendeeName ?? "مهمان آواهاب"}</b>
              </div>
              {pass.attendeePhone && (
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="text-foreground/50">موبایل</span>
                  <span dir="ltr" className="tabular-nums">
                    {pass.attendeePhone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* خط پرفراژ */}
          <div className="relative">
            <div className="mx-6 border-t border-dashed border-gold/25" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#0a0a0f]"
            />
            <span
              aria-hidden="true"
              className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-[#0a0a0f]"
            />
          </div>

          {/* QR */}
          <div className="px-6 pb-6 pt-5 text-center">
            {qr ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt={`کد QR کارت ورود رویداد ${pass.event.title}`}
                  width={232}
                  height={232}
                  className="mx-auto h-[232px] w-[232px] rounded-2xl bg-white p-3"
                />
                <p className="mt-3 text-[11px] leading-5 text-foreground/50">
                  هنگام ورود، همین کد را از اپلیکیشن یا چاپ کاغذی ارائه کنید؛
                  <br />
                  با اسکن، اعتبار بلیت برای میزبان نمایان می‌شود.
                </p>
                <p
                  dir="ltr"
                  className="mt-1 font-mono text-[10px] tracking-widest text-foreground/35"
                >
                  {pass.id.slice(0, 8).toUpperCase()} · AVAHUB
                </p>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/[0.05] px-4 py-8 text-[13px] leading-7 text-foreground/60">
                {eventCancelled
                  ? "به‌دلیل لغو رویداد، این کارت اعتبار ندارد. در رویدادهای بعدی آواهاب شما را دوباره می‌بینیم."
                  : "این ثبت‌نام انصراف/لغو شده و کارت ورود آن باطل است."}
              </div>
            )}
          </div>
        </div>

        {/* زیر بلیت */}
        <div className="pass-print-hide mt-6 space-y-4 text-center">
          {validity === "valid" && <PassPrintButton />}
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-foreground/40">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            کارت ورود شخصی است؛ لطفاً آن را برای دیگران نفرستید.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-xs font-bold text-foreground/75 transition-colors hover:text-foreground"
            >
              رویدادهای من
            </Link>
            <Link
              href={`/events/${pass.event.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-xs font-bold text-foreground/75 transition-colors hover:text-foreground"
            >
              صفحه رویداد
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
