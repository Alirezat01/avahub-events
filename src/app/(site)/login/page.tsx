"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldQuestion } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────
// صفحه ورود / ثبت‌نام — گوگل + لینک جادویی ایمیل (فاز ۲)
// ─────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5.1L1.3 17.2C3.3 21.2 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.3 6.8C.5 8.4 0 10.1 0 12s.5 3.6 1.3 5.2l3.8-2.9z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.8 1.3 6.8l3.8 2.9c1-3 3.7-5 6.9-5z"
      />
    </svg>
  );
}

function LoginCard() {
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const authError = params.get("error");
  const reduced = useReducedMotion();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function signInWithGoogle() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError("ورود با گوگل ناموفق بود. دوباره تلاش کنید.");
      setLoading(null);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    setLoading(null);
    if (error) {
      setError("ارسال لینک ناموفق بود؛ ایمیل را بررسی کنید.");
      return;
    }
    setSent(true);
  }

  if (!configured) {
    return (
      <div className="relative w-full max-w-md rounded-3xl border border-gold/25 bg-charcoal p-8 text-center">
        <ShieldQuestion className="mx-auto size-10 text-gold/70" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-black">ورود به‌زودی فعال می‌شود</h1>
        <p className="mt-3 text-sm leading-7 text-foreground/60">
          تنظیمات احراز هویت در حال اتصال است؛ چند لحظه دیگر دوباره سر بزنید.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm text-foreground/80 transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          بازگشت به خانه
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-gold/25 bg-charcoal p-8 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 size-48 -translate-x-1/2 rounded-full bg-gold/15 blur-[80px]"
        />
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          <CheckCircle2 className="size-8 text-gold" aria-hidden="true" />
        </div>
        <h1 className="relative mt-5 text-lg font-black">لینک ورود رفت به ایمیلت!</h1>
        <p className="relative mt-3 text-sm leading-7 text-foreground/65">
          روی دکمه داخل ایمیل <span className="font-bold text-gold-soft" dir="ltr">{email}</span> بزن تا
          وارد حساب کاربری‌ات بشی. (پوشه Spam را هم چک کن)
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="relative mt-6 text-sm text-foreground/60 underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          تغییر ایمیل / ارسال دوباره
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md rounded-3xl border border-gold/25 bg-charcoal p-8 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-purple/20 blur-[90px]"
      />

      <div className="relative text-center">
        <Link href="/" aria-label="آواهاب ایونتس — خانه" className="inline-block">
          <Image
            src="/images/logo-full.png"
            alt="آواهاب ایونتس"
            width={657}
            height={625}
            priority
            className="mx-auto h-20 w-auto"
          />
        </Link>
        <h1 className="mt-6 text-xl font-black">ورود | ثبت‌نام</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          برای ثبت حضور در رویدادها و تجربه اختصاصی، وارد حساب کاربری شو.
        </p>
      </div>

      {authError && (
        <p role="alert" className="relative mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs leading-6 text-red-300">
          لینک ورود منقضی یا نامعتبر بود؛ دوباره تلاش کن.
        </p>
      )}

      <div className="relative mt-7">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold text-[#1f1f1f] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-60"
        >
          {loading === "google" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          ورود با گوگل
        </button>
      </div>

      <div className="relative my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground/45">یا ورود با ایمیل</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="relative flex flex-col gap-3">
        <label htmlFor="email" className="text-xs font-medium text-foreground/70">
          ایمیل خود را وارد کنید
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
          <input
            id="email"
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-4 pr-11 text-left text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-gold/60"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs leading-6 text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_40px_rgba(212,175,55,0.35)] disabled:opacity-60"
        >
          {loading === "email" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="size-4" aria-hidden="true" />
          )}
          ارسال لینک ورود جادویی
        </button>
        <p className="text-center text-[11px] leading-5 text-foreground/40">
          با ورود، قوانین و حریم خصوصی آواهاب ایونتس را می‌پذیرید.
        </p>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,77,223,0.14),transparent_55%)]"
      />
      <Suspense
        fallback={
          <div className="flex size-16 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-gold" aria-hidden="true" />
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </main>
  );
}
