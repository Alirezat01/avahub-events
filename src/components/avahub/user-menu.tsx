"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LogOut, Sparkles, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────
// منوی کاربر هدر — حالت مهمان: دکمه ورود | حالت ورود: آواتار + منو
// ─────────────────────────────────────────────────────────────

export function UserMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduced = useReducedMotion();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  // ── حالت بارگذاری ──
  if (loading) {
    return <span aria-hidden="true" className="block size-9 animate-pulse rounded-full bg-foreground/10" />;
  }

  // ── حالت مهمان ──
  if (!user) {
    if (variant === "mobile") {
      return (
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          ورود | ثبت‌نام
        </Link>
      );
    }
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-4 py-1.5 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        ورود | ثبت‌نام
      </Link>
    );
  }

  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string };
  const name = meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "کاربر";
  const initial = name.charAt(0);

  // ── حالت ورود ──
  if (variant === "mobile") {
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/account"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/50 px-4 py-2.5 text-sm font-semibold text-gold"
        >
          <UserRound className="size-4" aria-hidden="true" />
          حساب کاربری
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-foreground/70"
        >
          <LogOut className="size-4" aria-hidden="true" />
          خروج
        </button>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-gold/40 py-1 pl-2 pr-1 transition-shadow hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-gold/15 text-sm font-black text-gold">
          {initial}
        </span>
        <ChevronDown
          className={`size-3.5 text-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="menu"
            className="absolute left-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-gold/25 bg-charcoal shadow-2xl shadow-black/50"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-bold">{name}</p>
              <p dir="ltr" className="truncate text-right text-[11px] text-foreground/50">
                {user.email}
              </p>
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-gold"
              role="menuitem"
            >
              <UserRound className="size-4" aria-hidden="true" />
              حساب کاربری
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-right text-sm text-red-300/90 transition-colors hover:bg-red-500/10"
              role="menuitem"
            >
              <LogOut className="size-4" aria-hidden="true" />
              خروج از حساب
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
