import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-96 -translate-x-1/2 rounded-full bg-purple/15 blur-[120px]"
      />
      <Image
        src="/images/hero-triangle-alpha.png"
        alt=""
        width={280}
        height={280}
        className="relative w-48 opacity-90 sm:w-60"
        aria-hidden="true"
      />
      <h1 className="mt-6 text-6xl font-black text-gradient-gold sm:text-7xl">۴۰۴</h1>
      <p className="mt-4 max-w-md text-base leading-8 text-foreground/60">
        این صفحه مثل نور آخر کنسرت خاموش شده! آدرس را اشتباه رفته‌اید یا صفحه
        جابه‌جا شده است.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-black text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-shadow hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]"
        >
          بازگشت به خانه
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-7 py-3 text-sm font-medium text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
        >
          مشاهده رویدادها
        </Link>
      </div>
    </section>
  );
}
